@echo off
chcp 65001 > nul
setlocal

title Установка системных компонентов (Prerequisites)

echo ======================================================================
echo  Установка системных компонентов для чистого компьютера
echo ======================================================================

net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] Требуются права Администратора!
    echo Щелкните правой кнопкой мыши по файлу и выберите "Запуск от имени администратора".
    pause
    exit /b 1
)

:: 1. Microsoft Visual C++ 2015-2022 Redistributable
if exist "%~dp0installers\vc_redist.x64.exe" (
    echo [1/3] Установка Microsoft Visual C++ Redistributable...
    "%~dp0installers\vc_redist.x64.exe" /install /quiet /norestart
    echo  [OK] Visual C++ Redistributable установлен.
)

:: 2. Node.js LTS (для системной интеграции)
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    for %%f in ("%~dp0installers\node-*.msi") do (
        echo [2/3] Установка системной среды Node.js (%%~nxf)...
        msiexec.exe /i "%%f" /quiet /qn /norestart
        echo  [OK] Node.js успешно установлен.
    )
) else (
    echo [2/3] Node.js уже установлен в системе.
)

:: 3. Модули Microsoft IIS (URL Rewrite и ARR)
if exist "%~dp0installers\rewrite_amd64_ru-RU.msi" (
    echo [3/3] Проверка и установка модулей IIS (URL Rewrite и ARR)...
    msiexec.exe /i "%~dp0installers\rewrite_amd64_ru-RU.msi" /quiet /qn /norestart
    if exist "%~dp0installers\requestRouter_amd64.msi" (
        msiexec.exe /i "%~dp0installers\requestRouter_amd64.msi" /quiet /qn /norestart
    )
    echo  [OK] Модули IIS установлены.
)

echo ======================================================================
echo  Все необходимые компоненты успешно настроены!
echo ======================================================================
timeout /t 5 >nul 2>&1 || ping -n 6 127.0.0.1 >nul
