@echo off
chcp 65001 > nul
setlocal

title Настройка и публикация сайта в Microsoft IIS

echo ======================================================================
echo  Центр Ортопедии Добрушкина — Развертывание в Microsoft IIS (Порт 80)
echo ======================================================================

net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] Требуются права Администратора!
    echo Щелкните правой кнопкой мыши по setup_iis.bat и выберите "Запуск от имени администратора".
    pause
    exit /b 1
)

echo [1/2] Проверка компонентов IIS и модулей URL Rewrite / ARR...
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\iis\check_and_install_iis.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo [ВНИМАНИЕ] Проверка IIS завершилась с предупреждениями.
)

echo.
echo [2/2] Создание веб-сайта в IIS и настройка проксирования на порт 5000...
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\iis\setup_iis_site.ps1" -SiteName "OrthopedClinic" -Port 80 -PhysicalPath "%~dp0client" -BackendPort 5000

echo.
echo ======================================================================
echo  Настройка завершена!
echo ======================================================================
pause
