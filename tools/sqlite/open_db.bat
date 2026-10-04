@echo off
chcp 65001 > nul
setlocal

set DB_PATH=%~dp0..\..\db\orthopedic_data_center.sqlite

if not exist "%DB_PATH%" (
    echo [ОШИБКА] База данных не найдена по пути: %DB_PATH%
    pause
    exit /b 1
)

echo Открытие базы данных SQLite: %DB_PATH%

if exist "%~dp0sqlite3.exe" (
    "%~dp0sqlite3.exe" "%DB_PATH%"
) else (
    where sqlite3 >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        sqlite3 "%DB_PATH%"
    ) else (
        echo [ИНФОРМАЦИЯ] Консольный клиент sqlite3.exe не найден.
        echo Базу данных можно просматривать через встроенный модуль веб-приложения:
        echo http://localhost:5000/sqlite-studio
        pause
    )
)
