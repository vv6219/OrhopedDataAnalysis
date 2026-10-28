@echo off
chcp 65001 > nul
setlocal

title Восстановление службы и устранение HTTP 502

echo ======================================================================
echo  Центр Ортопедии Добрушкина — Диагностика и Восстановление Системы
echo ======================================================================

net session >nul 2>&1
if %ERRORLEVEL% EQU 0 goto :run_fix

echo [ТРЕБУЮТСЯ ПРАВА АДМИНИСТРАТОРА] Запрос повышения привилегий UAC...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd.exe -ArgumentList '/k `\"%~f0`\"' -Verb RunAs"
exit /b

:run_fix
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\fix_bat.ps1"

echo ======================================================================
pause

