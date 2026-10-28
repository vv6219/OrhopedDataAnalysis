@echo off
chcp 65001 > nul
setlocal

title Настройка и публикация сайта в Microsoft IIS (HTTP и HTTPS)

echo ======================================================================
echo  Центр Ортопедии Добрушкина — Развертывание в Microsoft IIS (HTTP и HTTPS)
echo ======================================================================

net session >nul 2>&1
if %ERRORLEVEL% EQU 0 goto :run_setup

echo [ТРЕБУЮТСЯ ПРАВА АДМИНИСТРАТОРА] Запрос повышения привилегий UAC...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd.exe -ArgumentList '/k `\"%~f0`\"' -Verb RunAs"
exit /b

:run_setup
echo [1/2] Проверка компонентов IIS и модулей URL Rewrite / ARR...
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\iis\check_and_install_iis.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo [ВНИМАНИЕ] Проверка IIS завершилась с предупреждениями.
)

echo.
echo [2/2] Настройка сайта IIS, enabledProtocols (http,https) и проксирования...
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\iis\setup_iis_site.ps1" -SiteName "OrthopedClinic" -Port 8080 -HttpsPort 8443 -PhysicalPath "%~dp0client" -BackendPort 5000

echo.
echo ======================================================================
echo  Настройка IIS (HTTP: 8080, HTTPS: 8443) успешно завершена!
echo ======================================================================
pause
