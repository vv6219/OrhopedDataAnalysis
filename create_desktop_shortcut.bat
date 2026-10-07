@echo off
chcp 65001 > nul
setlocal

echo ======================================================================
echo  Создание ярлыка на Рабочем столе для Клиники Добрушкина
echo ======================================================================

set "TARGET_BAT=%~dp0start.bat"
set "WORK_DIR=%~dp0"
set "ICON_PATH=%~dp0client\favicon.ico"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws = New-Object -ComObject WScript.Shell; " ^
  "$desktop = [System.Environment]::GetFolderPath('Desktop'); " ^
  "$shortcut = $ws.CreateShortcut((Join-Path $desktop 'ОртоERP Клиника Добрушкина.lnk')); " ^
  "$shortcut.TargetPath = '%TARGET_BAT%'; " ^
  "$shortcut.WorkingDirectory = '%WORK_DIR%'; " ^
  "$shortcut.Description = 'Медицинская информационная система Центра Ортопедии Добрушкина'; " ^
  "if (Test-Path '%ICON_PATH%') { $shortcut.IconLocation = '%ICON_PATH%'; } " ^
  "$shortcut.Save()"

if %ERRORLEVEL% EQU 0 (
    echo [УСПЕХ] Ярлык успешно создан на Рабочем столе!
) else (
    echo [ОШИБКА] Не удалось создать ярлык.
)

echo ======================================================================
timeout /t 3
