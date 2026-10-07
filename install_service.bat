@echo off
chcp 65001 > nul
setlocal

title Установка службы Windows для Клиники Добрушкина

echo ======================================================================
echo  Установка бэкенда Клиники Добрушкина в качестве системной службы Windows
echo ======================================================================

net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] Требуются права Администратора! Запустите файл от имени Администратора.
    pause
    exit /b 1
)

set SERVICE_NAME=OrthopedClinicBackend
set "APP_DIR=%~dp0server"
set "SCRIPT_JS=index.js"

:: Определение Node.js
if exist "%~dp0tools\node\node.exe" (
    set "NODE_EXE=%~dp0tools\node\node.exe"
) else (
    set "NODE_EXE=node.exe"
)

:: Определение NSSM
set "NSSM_EXE="
if exist "%~dp0tools\nssm\nssm.exe" (
    set "NSSM_EXE=%~dp0tools\nssm\nssm.exe"
) else (
    where nssm >nul 2>&1
    if %ERRORLEVEL% EQU 0 set "NSSM_EXE=nssm"
)

if defined NSSM_EXE (
    echo Использование диспетчера служб NSSM...
    "%NSSM_EXE%" stop %SERVICE_NAME% >nul 2>&1
    "%NSSM_EXE%" remove %SERVICE_NAME% confirm >nul 2>&1
    "%NSSM_EXE%" install %SERVICE_NAME% "%NODE_EXE%" "%APP_DIR%\%SCRIPT_JS%"
    "%NSSM_EXE%" set %SERVICE_NAME% AppDirectory "%APP_DIR%"
    "%NSSM_EXE%" set %SERVICE_NAME% Description "Сервер автоматизации и REST API Центра Ортопедии Добрушкина"
    "%NSSM_EXE%" set %SERVICE_NAME% Start SERVICE_AUTO_START
    "%NSSM_EXE%" start %SERVICE_NAME%
    echo [УСПЕХ] Служба %SERVICE_NAME% успешно зарегистрирована и запущена!
) else (
    echo [ИНФОРМАЦИЯ] Регистрация автозапуска через системный планировщик задач Windows...
    schtasks /delete /tn "OrthopedClinicAutoStart" /f >nul 2>&1
    schtasks /create /tn "OrthopedClinicAutoStart" /tr "\"%~dp0start.bat\"" /sc onstart /ru SYSTEM /f >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [УСПЕХ] Задача автозапуска "OrthopedClinicAutoStart" успешно создана в Планировщике Windows!
    ) else (
        echo [ВНИМАНИЕ] Не удалось создать задачу в Планировщике. Запускайте сервер через start.bat.
    )
)

echo ======================================================================
pause
