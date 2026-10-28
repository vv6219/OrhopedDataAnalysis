@echo off
chcp 65001 > nul
setlocal

title Остановка Сервера Клиники Добрушкина

echo ======================================================================
echo  Центр Ортопедии Добрушкина — Остановка сервера
echo ======================================================================

:: Остановка системной службы Windows, если она запущена
sc query OrthopedClinicBackend >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Остановка системной службы Windows (OrthopedClinicBackend)...
    net stop OrthopedClinicBackend >nul 2>&1
)

echo Поиск и остановка процессов на порту 5000 (Сервер Express API)...
powershell -NoProfile -Command "$conns = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue; if ($conns) { $pids = $conns.OwningProcess | Select-Object -Unique; foreach ($p in $pids) { if ($p -gt 0) { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue; Write-Host ('[УСПЕХ] Сервер успешно остановлен (PID: ' + $p + ').') } } } else { Write-Host '[ИНФОРМАЦИЯ] Работающий сервер на порту 5000 не обнаружен.' }"

echo Поиск и остановка процессов на порту 5050 (Фискальный сервис ККТ)...
powershell -NoProfile -Command "$conns = Get-NetTCPConnection -LocalPort 5050 -State Listen -ErrorAction SilentlyContinue; if ($conns) { $pids = $conns.OwningProcess | Select-Object -Unique; foreach ($p in $pids) { if ($p -gt 0) { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue; Write-Host ('[УСПЕХ] Фискальный сервис успешно остановлен (PID: ' + $p + ').') } } } else { Write-Host '[ИНФОРМАЦИЯ] Работающий фискальный сервис на порту 5050 не обнаружен.' }"

echo ======================================================================
timeout /t 3 >nul 2>&1 || ping -n 4 127.0.0.1 >nul
