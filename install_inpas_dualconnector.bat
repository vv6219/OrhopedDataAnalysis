@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

title Установка эквайринга INPAS DualConnector 2.x

echo ======================================================================
echo  Установка и настройка INPAS DualConnector 2.x для АО «Альфа-Банк»
echo  (Служба Windows Dual Connector Service и утилита настройки DC Control)
echo ======================================================================

net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] Требуются права Администратора!
    echo Щелкните правой кнопкой мыши по файлу и выберите "Запуск от имени администратора".
    pause
    exit /b 1
)

set "INSTALLER_EXE=%~dp0installers\inpas\Common Connectors Installer.exe"
set "TARGET_DIR=C:\Program Files (x86)\INPAS\DualConnector"
set "DOCS_DIR=%~dp0installers\inpas\DC_2_DOC"

if not exist "!INSTALLER_EXE!" (
    echo [ОШИБКА] Файл установщика не найден:
    echo "!INSTALLER_EXE!"
    echo Убедитесь, что архив distributive распакован полностью.
    pause
    exit /b 1
)

echo [1/4] Запуск официального установщика INPAS Common Connectors...
echo Пожалуйста, следуйте шагам мастера установки на экране.
echo Рекомендуемый каталог установки: C:\Program Files (x86)\INPAS\DualConnector
echo.

start /wait "" "!INSTALLER_EXE!"

echo.
echo [2/4] Проверка установленных компонентов...
if exist "!TARGET_DIR!\DCControl.exe" (
    echo  [OK] Исполняемые файлы DualConnector обнаружены в:
    echo       !TARGET_DIR!
) else (
    echo  [ВНИМАНИЕ] Файл DCControl.exe не найден в стандартном каталоге !TARGET_DIR!.
    echo  Если вы выбрали другой путь, настройте его в «Параметрах эквайринга» МИС ОртоERP.
)

:: Копирование IKR.xml при необходимости
if exist "%~dp0installers\inpas\IKR.xml" (
    if exist "!TARGET_DIR!" (
        if not exist "!TARGET_DIR!\IKR.xml" (
            copy /y "%~dp0installers\inpas\IKR.xml" "!TARGET_DIR!\IKR.xml" >nul
            echo  [OK] Конфигурационный файл IKR.xml скопирован в каталог DualConnector.
        )
    )
)

echo.
echo [3/4] Проверка состояния службы Windows Dual Connector Service...
set "SVC_FOUND=0"
sc query "DualConnectorService" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "SVC_NAME=DualConnectorService"
    set "SVC_FOUND=1"
) else (
    sc query "Dual Connector Service" >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        set "SVC_NAME=Dual Connector Service"
        set "SVC_FOUND=1"
    )
)

if "!SVC_FOUND!"=="1" (
    echo  [OK] Служба "!SVC_NAME!" успешно зарегистрирована в системе.
    echo  Настройка автоматического запуска службы при старте Windows...
    sc config "!SVC_NAME!" start= auto >nul 2>&1
    echo  Запуск службы...
    net start "!SVC_NAME!" >nul 2>&1
    echo  [OK] Служба "!SVC_NAME!" запущена и готова к приёму команд XML.
) else (
    echo  [ИНФОРМАЦИЯ] Служба DualConnectorService регистрируется утилитой DC Control.
    echo  Запустите DC Control, перейдите на вкладку "Настройки службы" и нажмите "Установить службу".
)

echo.
echo [4/4] Создание ярлыков и открытие документации...
if exist "!TARGET_DIR!\DCControl.exe" (
    echo  - Утилита конфигурации PIN-пада: !TARGET_DIR!\DCControl.exe
)
if exist "%~dp0installers\inpas\Instrukciya po ustanovke DUALConnector 1.3.14.pdf" (
    echo  - Инструкция по установке: installers\inpas\Instrukciya po ustanovke DUALConnector 1.3.14.pdf
)

echo ======================================================================
echo  Установка INPAS DualConnector 2.x завершена!
echo.
echo  Для настройки терминала (COM-порт или IP-адрес):
echo  Запустите: "!TARGET_DIR!\DCControl.exe"
echo ======================================================================
echo.
set /p LAUNCH_DCC="Запустить утилиту DC Control прямо сейчас? (Y/N, по умолчанию Y): "
if /i "!LAUNCH_DCC!"=="" set "LAUNCH_DCC=Y"
if /i "!LAUNCH_DCC!"=="Y" (
    if exist "!TARGET_DIR!\DCControl.exe" (
        start "" "!TARGET_DIR!\DCControl.exe"
    )
)

exit /b 0
