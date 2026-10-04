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
set APP_DIR=%~dp0server
set NODE_EXE=node.exe
set SCRIPT_JS=index.js

where nssm >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Использование диспетчера служб NSSM...
    nssm stop %SERVICE_NAME% >nul 2>&1
    nssm remove %SERVICE_NAME% confirm >nul 2>&1
    nssm install %SERVICE_NAME% "%NODE_EXE%" "%APP_DIR%\%SCRIPT_JS%"
    nssm set %SERVICE_NAME% AppDirectory "%APP_DIR%"
    nssm set %SERVICE_NAME% Description "Сервер автоматизации и REST API Центра Ортопедии Добрушкина"
    nssm set %SERVICE_NAME% Start SERVICE_AUTO_START
    nssm start %SERVICE_NAME%
    echo [УСПЕХ] Служба %SERVICE_NAME% успешно зарегистрирована и запущена!
) else (
    echo [ИНФОРМАЦИЯ] NSSM не найден. Вы можете использовать запуск через start.bat или планировщик задач Windows.
    echo Для регистрации службы скачайте nssm.exe в папку Windows\System32 или запустите:
    echo schtasks /create /tn "OrthopedClinicAutoStart" /tr "\"%~dp0start.bat\"" /sc onstart /ru SYSTEM
)

echo ======================================================================
pause
