; =====================================================================
; Скрипт Inno Setup для сборки установочного пакета (.exe)
; Медицинская информационная система: Центр Ортопедии Добрушкина
; =====================================================================

#define MyAppName "Центр Ортопедии Добрушкина"
#define MyAppVersion "1.2.0"
#define MyAppPublisher "Центр Ортопедии и Травматологии Добрушкина"
#define MyAppURL "http://localhost:5000"
#define MyAppExeName "start.bat"

[Setup]
; Уникальный идентификатор приложения (GUID)
AppId={{D8A1C52E-9C5B-4C0A-B31F-8F8D588147E1}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\OrthopedClinic
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
LicenseFile=
OutputDir=..\installer_output
OutputBaseFilename=Setup_OrthopedClinic_v{#MyAppVersion}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\client\favicon.ico

[Languages]
Name: "russian"; MessagesFile: "compiler:Languages\Russian.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "autostart"; Description: "Запускать сервер автоматически при загрузке Windows"; GroupDescription: "Параметры запуска:"; Flags: unchecked
Name: "configure_iis"; Description: "Настроить публикацию через Microsoft IIS (Reverse Proxy на порту 80)"; GroupDescription: "Интеграция веб-сервера:"; Flags: unchecked
Name: "db_tools"; Description: "Установить клиентские утилиты СУБД (SQLite & Firebird)"; GroupDescription: "Инструменты администратора:"; Flags: checkedonce

[Files]
; Основные файлы дистрибутива из собранного каталога distributive
Source: "..\distributive\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; Исходный конфигурационный файл (не перезаписывать при обновлении)
Source: "..\distributive\appsettings.json"; DestDir: "{app}"; Flags: onlyifdoesntexist uninsneveruninstall
Source: "..\distributive\db\orthopedic_data_center.sqlite"; DestDir: "{app}\db"; Flags: onlyifdoesntexist uninsneveruninstall

[Dirs]
Name: "{app}\backups"; Permissions: users-full
Name: "{app}\db"; Permissions: users-full

[Icons]
; Ярлык на запуск клиники в Главном Меню
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\client\favicon.ico"; WorkingDir: "{app}"
; Ярлык остановки сервера
Name: "{group}\Остановить сервер клиники"; Filename: "{app}\stop.bat"; WorkingDir: "{app}"
; Ссылка на документацию Swagger API
Name: "{group}\REST API Документация (Swagger)"; Filename: "http://localhost:5000/api-docs"
; Ярлык на Рабочем столе
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\client\favicon.ico"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
; Настройка брандмауэра Windows (разрешение порта 5000 и 80 для локальной сети)
Filename: "netsh.exe"; Parameters: "advfirewall firewall add rule name=""OrthopedClinic Server"" dir=in action=allow protocol=TCP localport=5000"; Flags: runhidden; StatusMsg: "Настройка правил брандмауэра Windows..."

; Запуск скрипта интеграции с IIS, если выбрана соответствующая задача
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\scripts\iis\setup_iis_site.ps1"" -SiteName ""OrthopedClinic"" -Port 80 -PhysicalPath ""{app}\client"" -BackendPort 5000"; Flags: runhidden; Tasks: configure_iis; StatusMsg: "Настройка сайта в Microsoft IIS..."

; Регистрация службы автозапуска, если выбрана задача
Filename: "{app}\install_service.bat"; Tasks: autostart; Flags: runhidden; StatusMsg: "Регистрация службы автоматического запуска..."

; Предложение запустить программу сразу после установки
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: postinstall skipifsilent nowait unchecked
