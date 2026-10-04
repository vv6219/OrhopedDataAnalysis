@echo off
chcp 65001 > nul
setlocal

echo ======================================================================
echo  Центр Ортопедии Добрушкина — Проверка соединения с Firebird DB
echo ======================================================================

set FB_HOST=localhost
set FB_PORT=3050
set FB_DB=C:\Users\vladimir\source\DB\Export\MEDICAL.FDB
set FB_USER=SYSDBA
set FB_PASS=masterkey

echo Проверка порта %FB_PORT% на хосте %FB_HOST%...
powershell -Command "Test-NetConnection -ComputerName '%FB_HOST%' -Port %FB_PORT% -WarningAction SilentlyContinue"

if exist "%~dp0isql.exe" (
    echo.
    echo Запуск консольного запроса через isql.exe к базе %FB_DB%...
    "%~dp0isql.exe" -user %FB_USER% -password %FB_PASS% "%FB_HOST%:%FB_DB%" -q -i "%~dp0test_query.sql"
    if %ERRORLEVEL% EQU 0 (
        echo [УСПЕХ] Прямое соединение с базой MEDICAL.FDB подтверждено!
    ) else (
        echo [ОШИБКА] Не удалось подключиться к базе через isql. Проверьте путь к файлу и пароль.
    )
) else (
    echo.
    echo isql.exe не найден в локальной папке tools\firebird.
    echo Запуск проверки через Python скрипт (firebirdsql wire protocol)...
    python "%~dp0..\..\server\sync_patients_firebird.py" --test "%FB_DB%" "%FB_USER%" "%FB_PASS%" "%FB_HOST%" "%FB_PORT%" "WIN1251"
)

echo ======================================================================
pause
