@echo off
chcp 65001 > nul
setlocal

title Центр Ортопедии Добрушкина - Запуск Системы

echo ======================================================================
echo  Центр Ортопедии Добрушкина — Запуск медицинской информационной системы
echo ======================================================================

:: Определение среды выполнения Node.js (Встроенная или Системная)
set "NODE_BIN="
if exist "%~dp0tools\node\node.exe" (
    set "NODE_BIN=%~dp0tools\node\node.exe"
    echo [РЕЖИМ] Использование встроенного портативного Node.js (Zero-Dependency)
) else (
    where node >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        set "NODE_BIN=node"
    )
)

if not defined NODE_BIN (
    echo [ОШИБКА] Среда выполнения Node.js не найдена на данном компьютере!
    echo Для автоматической установки запустите install_prerequisites.bat от имени Администратора.
    pause
    exit /b 1
)

:: Проверка занятости порта 5000
netstat -ano | findstr :5000 | findstr LISTENING >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [ИНФОРМАЦИЯ] Сервер уже запущен на порту 5000.
) else (
    echo [1/2] Запуск сервера Express API и раздачи клиентского интерфейса...
    start "ОртоERP Сервер Клиники Добрушкина" cmd /c "cd /d ""%~dp0server"" && ""%NODE_BIN%"" index.js"
    timeout /t 2 /nobreak >nul 2>&1 || ping -n 3 127.0.0.1 >nul
)

:: Открытие веб-интерфейса в браузере
echo [2/2] Открытие рабочего места в браузере...
start http://localhost:5000

echo ======================================================================
echo  Система успешно запущена!
echo  Адрес локального интерфейса: http://localhost:5000
echo  Документация OpenAPI/Swagger: http://localhost:5000/api-docs
echo ======================================================================
timeout /t 5 >nul 2>&1 || ping -n 6 127.0.0.1 >nul
