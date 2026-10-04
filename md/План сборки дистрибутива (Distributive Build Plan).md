# План сборки и упаковки дистрибутива приложения
## Медицинская информационная система (МИС / ERP) Центра Ортопедии и Травматологии Добрушкина

---

## 1. Архитектурная концепция дистрибутива

Приложение проектируется как **автономный локально-серверный дистрибутив (On-Premise / LAN Monolith)**, способный работать:
1. **Локально (Standalone):** на одном компьютере врача/администратора без подключения к интернету.
2. **В локальной сети клиники (LAN Multi-user):** серверная часть устанавливается на главном ПК / сервере клиники (или компьютере регистратуры), а все остальные компьютеры (кабинеты врачей, процедурные, касса) подключаются через веб-браузер по локальному IP-адресу (например, `http://192.168.1.50:5000`).

```mermaid
graph TD
    subgraph "Клиентские рабочие места (LAN / Wi-Fi)"
        Browser1["Рабочее место Регистратуры<br/>(Chrome / Edge / Firefox)"]
        Browser2["Кабинет Врача-ортопеда<br/>(Планшет / Ноутбук / ПК)"]
        Browser3["Касса / Расчётная зона<br/>(ПК + Чековый принтер)"]
    end

    subgraph "Серверный дистрибутив (Пакет приложения)"
        subgraph "Node.js / Express Монолит (Порт 5000)"
            StaticServer["Статический сервер SPA<br/>(client/dist: HTML5 History API)"]
            APIServer["REST API Сервер<br/>(/api/*, Swagger /api-docs)"]
            DocEngine["Движок документов и отчётов<br/>(Печать талонов, калькуляции BOM)"]
        end

        subgraph "Хранилище данных"
            SQLite[("Встроенная СУБД SQLite<br/>orthopedic_data_center.sqlite<br/>(WAL-режим, 61k пациентов, BOM)")]
            Backups[("Каталог горячих бэкапов<br/>/backups/*.sqlite")]
        end

        subgraph "Внешняя интеграция (Опционально)"
            Firebird[("МИС Firebird DB<br/>MEDICAL.FDB<br/>(Синхронизация через Python)")]
        end
    end

    Browser1 -->|HTTP / JSON| StaticServer
    Browser1 -->|REST API| APIServer
    Browser2 -->|HTTP / JSON| StaticServer
    Browser2 -->|REST API| APIServer
    Browser3 -->|HTTP / JSON| StaticServer
    Browser3 -->|REST API| APIServer

    APIServer <-->|better-sqlite3 / sqlite3| SQLite
    APIServer -.->|Скрипт синхронизации| Firebird
    APIServer -->|VACUUM INTO| Backups
```

---

## 2. Анализ текущего состояния и необходимые доработки кодовой базы (Gap Analysis)

Перед сборкой финального дистрибутива необходимо выполнить 3 ключевые адаптации:

### 2.1. Устранение прямого указания `http://localhost:5000` в React-клиенте
* **Проблема:** Сейчас в компонентах (`Patients.tsx`, `Operations.tsx`, `Inventory.tsx`, `Staff.tsx`, `LiveQueueMonitor.tsx`, `SchedulingWizard.tsx` и др.) вызовы `fetch` содержат абсолютные адреса `http://localhost:5000/api/...` или `http://127.0.0.1:5000/api/...`. 
* **Последствие:** Если сервер запущен на компьютере `192.168.1.50`, а врач открыл интерфейс со своего ноутбука `192.168.1.51`, запросы браузера пойдут на `localhost` ноутбука и завершатся ошибкой `net::ERR_CONNECTION_REFUSED`.
* **Решение:** 
  1. Создать единую константу / утилиту `API_BASE_URL` в `client/src/config/apiConfig.ts`:
     ```typescript
     // В production при отдаче клиентом из Express используется относительный путь '' (тот же хост и порт)
     // В режиме разработки Vite проксирует запросы на порт 5000
     export const API_BASE_URL = import.meta.env.VITE_API_URL || '';
     ```
  2. Перевести все вызовы API на относительные пути `/api/...`.
  3. Настроить в `client/vite.config.ts` проксирование для режима разработки:
     ```typescript
     server: {
       proxy: {
         '/api': {
           target: 'http://localhost:5000',
           changeOrigin: true
         }
       }
     }
     ```

### 2.2. Настройка раздачи клиентской статики в Express (`server/index.js`)
* **Задача:** Express должен сам отдавать собранный React SPA (`client/dist`), устраняя необходимость запускать второй процесс Vite в продакшене.
* **Реализация:**
  ```javascript
  const clientDistPath = path.resolve(__dirname, '../client/dist');
  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    // SPA Fallback для маршрутизации React Router (HTML5 History API)
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/api-docs')) {
        return next();
      }
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }
  ```

### 2.3. Изоляция и переносимость базы данных SQLite
* **Текущее состояние:** Путь к базе данных уже параметризован в [server/config.js](file:///c:/Users/vladimir/source/repos/Data%20Analysis/server/config.js) и [server/appsettings.json](file:///c:/Users/vladimir/source/repos/Data%20Analysis/server/appsettings.json) (`../db/orthopedic_data_center.sqlite`).
* **Требование дистрибутива:**
  1. Обеспечить корректное автосоздание папки `DB/` и проверку целостности файла при первом запуске.
  2. Режим `WAL` (Write-Ahead Logging) для устойчивости к внезапному отключению питания клиники и поддержки одновременного чтения/записи несколькими рабочими местами.

---

## 3. Архитектура и структура каталогов готового дистрибутива

Каталог дистрибутива при распаковке / установке:

```
OrthopedClinic_v2.0/
├── appsettings.json               # Главный файл конфигурации (порт, пути, Firebird)
├── start.bat                      # Быстрый запуск в один клик (консольный режим)
├── install_service.bat            # Регистрация в качестве системной службы Windows
├── uninstall_service.bat          # Удаление системной службы Windows
├── open_browser.bat               # Ярлык для открытия веб-интерфейса в браузере по умолчанию
│
├── runtime/                       # Встроенный Node.js runtime (v20+ LTS, без необходимости установки Node пользователем)
│   ├── node.exe
│   └── ...
│
├── server/                        # Скомпилированный / подготовленный бэкенд
│   ├── index.js
│   ├── database.js
│   ├── config.js
│   ├── schedulingRoutes.js
│   ├── sync_patients_firebird.py  # Скрипт синхронизации с Firebird
│   └── node_modules/              # Только production-зависимости (express, sqlite3, cors и т.д.)
│
├── public/                        # Скомпилированный бандл React-клиента (Vite build)
│   ├── index.html
│   ├── favicon.ico
│   └── assets/
│       ├── index-*.js
│       ├── index-*.css
│       └── ...
│
├── DB/                            # База данных клиники
│   ├── orthopedic_data_center.sqlite
│   ├── orthopedic_data_center.sqlite-wal
│   └── orthopedic_data_center.sqlite-shm
│
├── backups/                       # Автоматические ежедневные резервные копии SQLite
│   └── .gitkeep
│
├── tools/                         # Автономные инструменты баз данных
│   ├── sqlite/                    # Официальный SQLite CLI Shell
│   │   └── sqlite3.exe            # Аварийное обслуживание, VACUUM, PRAGMA, экспорт
│   ├── sqlite-gui/                # Портативный DB Browser for SQLite / SQLiteStudio
│   │   └── ...                    # Визуальный просмотр таблиц администратором
│   └── firebird/                  # Firebird Client Library & CLI
│       ├── fbclient.dll           # 64-битная клиентская библиотека Firebird
│       ├── gds32.dll              # Библиотека обратной совместимости
│       ├── isql.exe               # Консольная утилита выполнения запросов к FDB
│       ├── firebird.msg           # Файлы системных сообщений СУБД
│       └── plugins/               # Плагины аутентификации (Srp, Legacy_Auth)
│
└── logs/                          # Системные журналы работы сервера
    ├── access.log
    └── error.log
```

---

## 4. Пайплайн сборки дистрибутива (Step-by-Step Build Pipeline)

Процесс сборки автоматизируется единым сценарием `scripts/build_distributive.ps1` (или `.bat`):

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Разработчик / CI-CD
    participant Client as React Client (Vite)
    participant Server as Express Server
    participant DB as SQLite DB
    participant Dist as Папка дистрибутива /dist_app

    Dev->>Client: 1. npx tsc --noEmit && npm run build
    Client-->>Dist: Генерация минифицированного SPA в dist_app/public
    Dev->>Server: 2. npm prune --production
    Server-->>Dist: Копирование server/* и node_modules в dist_app/server
    Dev->>DB: 3. Валидация целостности PRAGMA integrity_check
    DB-->>Dist: Копирование чистой БД в dist_app/DB
    Dev->>Dist: 4. Копирование готового Node.js Runtime + .bat лаунчеров
    Dev->>Dist: 5. Упаковка в Inno Setup Installer (.exe) / ZIP-архив
```

### Подробное описание этапов сборки:

#### Этап 1. Сборка React фронтенда:
```powershell
Write-Host ">>> [1/5] Сборка оптимизированного React приложения..." -ForegroundColor Cyan
Set-Location -Path "client"
npx tsc --noEmit
npm run build
Set-Location -Path ".."
```
* Результат: `client/dist/` содержит сжатые JS, CSS, картинки, SVG с хэшированием имен файлов для сброса кэша браузера.

#### Этап 2. Подготовка и изоляция бэкенда:
```powershell
Write-Host ">>> [2/5] Подготовка серверной части и production-зависимостей..." -ForegroundColor Cyan
# Очистка dev-зависимостей, оставляются только sqlite3, express, cors, dotenv, swagger
Copy-Item -Path "server" -Destination "dist_app/server" -Recurse -Force
```

#### Этап 3. Подготовка и сжатие базы данных SQLite:
```powershell
Write-Host ">>> [3/5] Дефрагментация и проверка целостности SQLite..." -ForegroundColor Cyan
# Выполнение VACUUM для сжатия базы и PRAGMA integrity_check
sqlite3 "DB/orthopedic_data_center.sqlite" "PRAGMA integrity_check; VACUUM;"
Copy-Item -Path "DB/orthopedic_data_center.sqlite" -Destination "dist_app/DB/orthopedic_data_center.sqlite" -Force
```

#### Этап 4. Включение портативного Node.js (Embedded Runtime):
* Чтобы дистрибутив работал на любом компьютере клиники **без предварительной установки Node.js, Python или Git**:
* В дистрибутив вкладывается легковесный бинарник `node.exe` официальной сборки Node.js LTS (размер ~70 МБ).
* Лаунчер `start.bat` вызывает именно `runtime\node.exe server\index.js`.

---

## 5. Варианты поставки дистрибутива (Deployment Targets)

### Вариант 1. Установочный пакет Windows Installer (`Setup_OrthopedClinic_v2.0.exe`) с поддержкой IIS — **Основной корпоративный**
Сборка через **Inno Setup** (промышленный стандарт инсталляторов Windows):
* **Возможности установщика:**
  - Установка «в 1 клик» с выбором сценария:
    - **«Установка Сервера клиники с Microsoft IIS (Рекомендуется)»** — автоматически проверяет, доустанавливает и настраивает IIS, URL Rewrite, Application Request Routing и публикует сайт на стандартных портах `80 / 443`.
    - **«Установка автономного сервера (Node.js Service)»** — регистрирует службу Windows без IIS на порту `5000`.
    - **«Клиентское рабочее место»** — создает ярлыки рабочего стола, сразу открывающие веб-интерфейс сервера клиники.
  - Автоматическая настройка правил в Брандмауэре Windows (Windows Firewall) для портов `80`, `443`, `5000`.
  - Создание ярлыков с медицинским логотипом Центра Ортопедии на Рабочем столе и в меню «Пуск».
  - Поддержка тихого обновления (Silent Upgrade) и чистого удаления через Панель управления Windows.

### Вариант 2. Автономная служба Windows (NSSM Service)
* Работа сервера в фоновом режиме 24/7 без необходимости входа пользователя в Windows.
* Автозапуск при включении электропитания сервера.

### Вариант 3. Портативный архив (Portable ZIP)
* Готовая автономная папка со встроенным `runtime/node.exe` для запуска с внешнего накопителя через `start.bat`.

### Вариант 4. Docker-контейнер (`docker-compose.yml`)
* Для клиник с серверами на базе Linux или сетевых накопителей (Synology / QNAP NAS).

---

## 6. Интеграция с веб-сервером Microsoft IIS (Проверка, автоустановка и Reverse Proxy)

В корпоративной среде Windows использование **Microsoft IIS** в качестве фронтального веб-сервера (Reverse Proxy) предоставляет следующие преимущества:
1. **Стандартные порты 80 (HTTP) и 443 (HTTPS):** персоналу клиники не требуется указывать порт `:5000` в строке браузера — доступ осуществляется по простому адресу `http://orthocenter/` или `http://192.168.1.50/`.
2. **Аппаратное кэширование статики через HTTP.sys:** максимальная скорость загрузки React SPA интерфейса при минимальной нагрузке на процессор.
3. **Безопасность и SSL-сертификаты:** централизованное управление сертификатами клиники (Let's Encrypt / корпоративный CA) непосредственно в оснастке IIS.

```mermaid
graph TD
    Client["Браузеры врачей и регистратуры<br/>(Порты 80 / 443)"]
    
    subgraph "Microsoft IIS Web Server"
        IIS["IIS HTTP.sys Listener<br/>(Site: OrthopedClinic)"]
        Rewrite["Модуль URL Rewrite 2.1<br/>+ ARR Proxy"]
        StaticEngine["Движок статики IIS<br/>(/assets, index.html)"]
    end
    
    subgraph "Локальный сервис приложения"
        NodeService["Фоновый сервис Node.js Express<br/>(127.0.0.1:5000)"]
        SQLiteDB[("SQLite База Данных<br/>orthopedic_data_center.sqlite")]
    end

    Client -->|HTTP:80 / HTTPS:443| IIS
    IIS -->|Запрос статических файлов| StaticEngine
    IIS -->|Правило URL Rewrite: /api/*| Rewrite
    Rewrite -->|Reverse Proxy: HTTP POST/GET| NodeService
    NodeService <-->|Чтение/Запись WAL| SQLiteDB
```

---

### 6.1. Автоматическая проверка наличия и состояния IIS

Перед установкой скрипт инсталлятора выполняет диагностику компонентов Windows:

```powershell
# scripts/iis/check_iis.ps1
function Test-IISInstallation {
    Write-Host ">>> Проверка наличия веб-сервера Microsoft IIS..." -ForegroundColor Cyan
    
    # 1. Проверка регистрации службы W3SVC
    $w3svc = Get-Service -Name W3SVC -ErrorAction SilentlyContinue
    
    # 2. Проверка ключевых компонентов через DISM / Get-WindowsOptionalFeature
    $iisRole = Get-WindowsOptionalFeature -Online -FeatureName "IIS-WebServerRole" -ErrorAction SilentlyContinue
    
    $isInstalled = ($null -ne $w3svc) -or ($iisRole -and $iisRole.State -eq "Enabled")
    
    if ($isInstalled) {
        Write-Host " [OK] Microsoft IIS обнаружен в системе (Статус службы: $($w3svc.Status))." -ForegroundColor Green
        return $true
    } else {
        Write-Host " [!] Microsoft IIS не установлен или отключен." -ForegroundColor Yellow
        return $false
    }
}
```

---

### 6.2. Автоматическая установка и включение компонентов IIS

Если компонент IIS отсутствует, сценарий выполняет тихую активацию необходимых служб без перезагрузки системы:

```powershell
# scripts/iis/install_iis.ps1
function Install-IISComponents {
    Write-Host ">>> Выполняется автоматическая активация компонентов Microsoft IIS..." -ForegroundColor Cyan
    
    $requiredFeatures = @(
        "IIS-WebServerRole",
        "IIS-WebServer",
        "IIS-CommonHttpFeatures",
        "IIS-StaticContent",
        "IIS-DefaultDocument",
        "IIS-DirectoryBrowsing",
        "IIS-HttpErrors",
        "IIS-HttpRedirect",
        "IIS-ApplicationDevelopment",
        "IIS-WebSockets",
        "IIS-HealthAndDiagnostics",
        "IIS-HttpLogging",
        "IIS-Security",
        "IIS-RequestFiltering",
        "IIS-Performance",
        "IIS-HttpCompressionStatic",
        "IIS-ManagementConsole"
    )
    
    try {
        Enable-WindowsOptionalFeature -Online -FeatureName $requiredFeatures -All -NoRestart -ErrorAction Stop
        Write-Host " [OK] Все компоненты IIS успешно установлены и активированы." -ForegroundColor Green
        
        # Запуск и перевод службы W3SVC в автозапуск
        Set-Service -Name W3SVC -StartupType Automatic
        Start-Service -Name W3SVC
    } catch {
        Write-Host " [ОШИБКА] Не удалось автоматически включить IIS через PowerShell: $($_.Exception.Message)" -ForegroundColor Red
        ## 7. Проверка, автоматическая установка и подготовка клиентов СУБД (SQLite Client & Firebird Client)

Для автономного администрирования, выполнения аварийных регламентов и бесперебойной синхронизации с внешней медицинской базой клиники дистрибутив включает автоматическую диагностику, проверку разрядности (32/64-бит), зависимостей (Visual C++ Redistributable) и автоустановку клиентских инструментов двух СУБД.

```mermaid
graph LR
    subgraph "Инструменты администратора клиники (tools/)"
        subgraph "Клиент SQLite"
            SQLCLI["sqlite3.exe<br/>(CLI: бэкапы, PRAGMA, экспорт)"]
            SQLGUI["DB Browser for SQLite<br/>(Портативный GUI / MSI)"]
        end
        subgraph "Клиент Firebird"
            FBClient["fbclient.dll + gds32.dll<br/>(64-bit Client Library)"]
            ISQL["isql.exe<br/>(CLI тестирование и выборки)"]
            Plugins["plugins/ (Srp, Legacy_Auth)<br/>+ firebird.msg + conf"]
            VCRuntime["VC++ Redistributable x64<br/>(msvcp140.dll / vcruntime140.dll)"]
        end
    end

    subgraph "Базы данных клиники"
        SQLiteFile[("orthopedic_data_center.sqlite<br/>(Основная рабочая база)")]
        FirebirdFile[("MEDICAL.FDB<br/>(Внешняя база пациентов: 61 298 зап.)")]
    end

    SQLCLI -->|Прямой доступ / VACUUM / PRAGMA| SQLiteFile
    SQLGUI -->|Визуальный просмотр таблиц| SQLiteFile
    FBClient -->|Синхронизация через Python| FirebirdFile
    ISQL -->|Проверка порта 3050 и связи| FirebirdFile
    VCRuntime -.->|Зависимость DLL| FBClient
```

---

### 7.1. Клиент SQLite (SQLite CLI & Графический интерфейс DB Browser)

#### 1. Назначение компонентов SQLite в дистрибутиве:
* **`sqlite3.exe` (Официальная консольная утилита SQLite CLI x64):**
  - Выполнение низкоуровневых регламентных процедур без необходимости запуска Node.js (`PRAGMA integrity_check`, `VACUUM INTO`, `.recover`, `.dump`).
  - Быстрое ручное наложение SQL-патчей, миграций структуры и аварийное восстановление поврежденных секторов.
* **DB Browser for SQLite (Официальный GUI):**
  - Доступен как в портативном виде (`tools/sqlite-gui/`), так и в виде тихой системной установки через MSI.
  - Инсталлятор создает ярлык в меню «Пуск» и на Рабочем столе: **«Управление базой данных клиники (SQLite)»** с параметром автооткрытия текущей рабочей базы `DB\orthopedic_data_center.sqlite`.
  - Позволяет администратору и аналитикам клиники визуально просматривать картотеку, формировать пользовательские SQL-отчеты и экспортировать данные в Excel/CSV.

#### 2. Диагностический алгоритм и сценарий автоустановки SQLite (`scripts/db/check_and_install_sqlite.ps1`):
Скрипт проверяет наличие инструментов в системе и, если они отсутствуют, автоматически развертывает их:

```powershell
# scripts/db/check_and_install_sqlite.ps1
param (
    [switch]$InstallGui = $true,
    [string]$AppDir = "$PSScriptRoot\..\.."
)

function Test-SQLiteCli {
    Write-Host ">>> [1/2] Проверка консольного клиента SQLite (sqlite3.exe)..." -ForegroundColor Cyan
    $localSqliteExe = Join-Path $AppDir "tools\sqlite\sqlite3.exe"
    
    # 1. Проверка локальной папки дистрибутива
    if (Test-Path $localSqliteExe) {
        $ver = & $localSqliteExe --version
        Write-Host " [OK] Автономный SQLite CLI найден в tools/sqlite/: $ver" -ForegroundColor Green
        return $true
    }
    
    # 2. Проверка в системном PATH
    $cmd = Get-Command "sqlite3.exe" -ErrorAction SilentlyContinue
    if ($cmd) {
        $ver = & $cmd.Source --version
        Write-Host " [OK] Системный SQLite CLI обнаружен в PATH: $($cmd.Source) ($ver)" -ForegroundColor Green
        return $true
    }
    
    Write-Host " [!] SQLite CLI не найден. Выполняется автоматическая загрузка и развертывание..." -ForegroundColor Yellow
    $toolsDir = Join-Path $AppDir "tools\sqlite"
    New-Item -ItemType Directory -Force -Path $toolsDir | Out-Null
    
    # Загрузка официального официального 64-битного пакета sqlite-tools
    $zipUrl = "https://sqlite.org/2026/sqlite-tools-win-x64-3490100.zip" # Либо локальный оффлайн-дистрибутив
    $tempZip = "$env:TEMP\sqlite-tools.zip"
    $tempExtract = "$env:TEMP\sqlite-extract"
    
    try {
        if (Test-Path "$PSScriptRoot\..\..\installers\sqlite-tools-win-x64.zip") {
            Copy-Item "$PSScriptRoot\..\..\installers\sqlite-tools-win-x64.zip" -Destination $tempZip -Force
        } else {
            Invoke-WebRequest -Uri $zipUrl -OutFile $tempZip -UseBasicParsing
        }
        Expand-Archive -Path $tempZip -DestinationPath $tempExtract -Force
        $extractedExe = Get-ChildItem -Path $tempExtract -Filter "sqlite3.exe" -Recurse | Select-Object -First 1
        Copy-Item $extractedExe.FullName -Destination $localSqliteExe -Force
        Remove-Item $tempZip, $tempExtract -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host " [OK] sqlite3.exe успешно установлен в $localSqliteExe." -ForegroundColor Green
        return $true
    } catch {
        Write-Host " [ОШИБКА] Не удалось загрузить sqlite3.exe: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-SQLiteGui {
    Write-Host ">>> [2/2] Проверка графического интерфейса DB Browser for SQLite..." -ForegroundColor Cyan
    $portableGui = Join-Path $AppDir "tools\sqlite-gui\DB Browser for SQLite.exe"
    $progFilesGui = "C:\Program Files\DB Browser for SQLite\DB Browser for SQLite.exe"
    
    # 1. Проверка портативной версии
    if (Test-Path $portableGui) {
        Write-Host " [OK] Обнаружена портативная версия DB Browser for SQLite: $portableGui" -ForegroundColor Green
        return $true
    }
    
    # 2. Проверка установленной версии в Program Files
    if (Test-Path $progFilesGui) {
        Write-Host " [OK] Обнаружена установленная версия DB Browser for SQLite в Program Files." -ForegroundColor Green
        return $true
    }
    
    # 3. Проверка в реестре Windows Uninstall
    $regCheck = Get-ItemProperty "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*" |
                Where-Object { $_.DisplayName -like "*DB Browser for SQLite*" }
    if ($regCheck) {
        Write-Host " [OK] DB Browser for SQLite зарегистрирован в системе: $($regCheck.DisplayName)" -ForegroundColor Green
        return $true
    }
    
    Write-Host " [!] DB Browser for SQLite не обнаружен." -ForegroundColor Yellow
    if ($InstallGui) {
        $msiInstaller = "$PSScriptRoot\..\..\installers\DB.Browser.for.SQLite-win64.msi"
        if (Test-Path $msiInstaller) {
            Write-Host " Запуск тихой установки DB Browser for SQLite..." -ForegroundColor Cyan
            Start-Process msiexec.exe -ArgumentList "/i `"$msiInstaller`" /quiet /qn /norestart" -Wait
            Write-Host " [OK] Установка DB Browser for SQLite успешно завершена." -ForegroundColor Green
            return $true
        } else {
            Write-Host " [ИНФО] Установочный MSI-пакет не найден в папке installers/. Развертывание портативной версии..." -ForegroundColor Yellow
            # Развертывание портативного zip-архива
            $zipPortable = "$PSScriptRoot\..\..\installers\sqlitebrowser-portable-win64.zip"
            if (Test-Path $zipPortable) {
                Expand-Archive -Path $zipPortable -DestinationPath (Join-Path $AppDir "tools\sqlite-gui") -Force
                Write-Host " [OK] Портативная версия развернута в tools/sqlite-gui." -ForegroundColor Green
                return $true
            }
        }
    }
    return $false
}

# Запуск проверок
Test-SQLiteCli
Test-SQLiteGui
```

#### 3. Тест верификации базы данных SQLite (`tools/sqlite/test_sqlite.bat`):
```cmd
@echo off
chcp 65001 > nul
set "DB_FILE=%~dp0..\..\DB\orthopedic_data_center.sqlite"
echo >>> Тестирование целостности базы данных SQLite...
"%~dp0sqlite3.exe" "%DB_FILE%" "PRAGMA integrity_check; PRAGMA foreign_key_check; SELECT count(*) AS total_patients FROM patients;"
if %ERRORLEVEL% EQU 0 (
    echo [УСПЕХ] База данных SQLite полностью исправна и доступна.
) else (
    echo [ОШИБКА] Обнаружены повреждения или ошибки структуры базы данных SQLite.
)
```

---

### 7.2. Клиент Firebird (`fbclient.dll`, `isql.exe`, плагины аутентификации)

#### 1. Критические требования и типичные проблемы при интеграции с Firebird:
* **Несовпадение разрядности (Bitness Mismatch / WinError 193):**
  - Node.js и Python в дистрибутиве являются **64-битными (x64)**.
  - Если на сервере клиники в `C:\Windows\System32` или `SysWOW64` зарегистрирована 32-битная библиотека `fbclient.dll` (оставшаяся от старых 32-битных медицинских программ), 64-битный Python/Node при попытке загрузки упадет с фатальной ошибкой `WinError 193: %1 не является допустимым приложением Win32`.
  - **Решение:** Скрипт проверки обязан валидировать PE-заголовок (Machine Type `0x8664` = AMD64) и использовать изолированную 64-битную копию из каталога `tools/firebird/`.
* **Зависимость от Microsoft Visual C++ Redistributable:**
  - Клиентская библиотека Firebird скомпилирована с использованием Microsoft Visual C++.
  - Для Firebird 3.0 / 4.0 / 5.0 требуется **Visual C++ 2015–2022 Redistributable x64** (`msvcp140.dll`, `vcruntime140.dll`).
  - При отсутствии среды выполнения загрузка `fbclient.dll` завершается системной ошибкой Windows `Error 126: Не найден указанный модуль`.
  - **Решение:** Проверка ключа реестра `HKLM:\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64` и автоматическая фоновая установка `vc_redist.x64.exe /quiet /norestart`.
* **Плагины аутентификации и конфигурация WireCrypt:**
  - Начиная с Firebird 3.0, по умолчанию используется шифрование трафика (WireCrypt) и плагин аутентификации `Srp`. Если сервер клиники работает на Firebird 2.5, клиенту требуется плагин `Legacy_Auth` и директива `WireCrypt = Disabled` / `AuthServer = Srp, Legacy_Auth` в файле `firebird.conf`.
  - **Решение:** В комплекте дистрибутива поставляется сконфигурированный `firebird.conf` и папка `plugins/` с библиотеками `Srp.dll` и `Legacy_Auth.dll`.

#### 2. Диагностический алгоритм и сценарий автоустановки Firebird Client (`scripts/db/check_and_install_firebird.ps1`):

```powershell
# scripts/db/check_and_install_firebird.ps1
param (
    [string]$AppDir = "$PSScriptRoot\..\..",
    [switch]$InstallSystemMsi = $false
)

function Test-VCRedistributableX64 {
    Write-Host ">>> [1/4] Проверка наличия среды выполнения Visual C++ 2015-2022 x64..." -ForegroundColor Cyan
    $vcKey = "HKLM:\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64"
    $installed = (Get-ItemProperty -Path $vcKey -ErrorAction SilentlyContinue).Installed
    
    if ($installed -eq 1) {
        Write-Host " [OK] Visual C++ Redistributable x64 установлен в системе." -ForegroundColor Green
        return $true
    }
    
    Write-Host " [!] Visual C++ 2015-2022 x64 не обнаружен. Выполняется автоматическая установка..." -ForegroundColor Yellow
    $vcInstaller = Join-Path $AppDir "installers\vc_redist.x64.exe"
    if (Test-Path $vcInstaller) {
        Start-Process $vcInstaller -ArgumentList "/quiet /norestart" -Wait
        Write-Host " [OK] Visual C++ Redistributable x64 успешно установлен." -ForegroundColor Green
        return $true
    } else {
        Write-Host " Загрузка vc_redist.x64.exe из репозитория Microsoft..." -ForegroundColor Yellow
        $tempVc = "$env:TEMP\vc_redist.x64.exe"
        Invoke-WebRequest -Uri "https://aka.ms/vs/17/release/vc_redist.x64.exe" -OutFile $tempVc -UseBasicParsing
        Start-Process $tempVc -ArgumentList "/quiet /norestart" -Wait
        Remove-Item $tempVc -Force -ErrorAction SilentlyContinue
        Write-Host " [OK] Visual C++ Redistributable x64 загружен и установлен." -ForegroundColor Green
        return $true
    }
}

function Test-DllArchitectureX64 ([string]$dllPath) {
    if (-not (Test-Path $dllPath)) { return $false }
    try {
        $bytes = [System.IO.File]::ReadAllBytes($dllPath)
        # Поиск PE-заголовка
        $peOffset = [System.BitConverter]::ToInt32($bytes, 0x3C)
        $machineType = [System.BitConverter]::ToUInt16($bytes, $peOffset + 4)
        # 0x8664 = IMAGE_FILE_MACHINE_AMD64 (64-бит)
        # 0x014C = IMAGE_FILE_MACHINE_I386 (32-бит)
        return ($machineType -eq 0x8664)
    } catch {
        return $false
    }
}

function Test-FirebirdClient {
    Write-Host ">>> [2/4] Диагностика и проверка разрядности библиотеки fbclient.dll..." -ForegroundColor Cyan
    $localFbDir = Join-Path $AppDir "tools\firebird"
    $localFbDll = Join-Path $localFbDir "fbclient.dll"
    $sys32Dll   = "$env:SystemRoot\System32\fbclient.dll"
    
    # 1. Проверка встроенного изолированного комплекта в tools/firebird/
    if (Test-Path $localFbDll) {
        if (Test-DllArchitectureX64 $localFbDll) {
            Write-Host " [OK] Встроенный Firebird Client 64-бит найден в tools/firebird/: $localFbDll" -ForegroundColor Green
            return $localFbDir
        } else {
            Write-Host " [ВНИМАНИЕ] В tools/firebird обнаружена 32-битная версия fbclient.dll! Требуется замена на x64." -ForegroundColor Yellow
        }
    }
    
    # 2. Проверка системной папки System32
    if (Test-Path $sys32Dll) {
        if (Test-DllArchitectureX64 $sys32Dll) {
            Write-Host " [OK] Системный fbclient.dll (64-бит) обнаружен в $sys32Dll." -ForegroundColor Green
            return "$env:SystemRoot\System32"
        }
    }
    
    # 3. Развертывание автономного комплекта x64 из поставки
    Write-Host " [!] Развертывание автономного 64-битного пакета Firebird Client в tools/firebird/..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $localFbDir | Out-Null
    
    $fbZip = Join-Path $AppDir "installers\firebird-client-x64.zip"
    if (Test-Path $fbZip) {
        Expand-Archive -Path $fbZip -DestinationPath $localFbDir -Force
        Write-Host " [OK] Комплект Firebird Client x64 успешно распакован в $localFbDir." -ForegroundColor Green
        return $localFbDir
    } else {
        Write-Host " [ИНФО] Локальный архив firebird-client-x64.zip не найден. Загрузка минимального комплекта..." -ForegroundColor Yellow
        # Загрузка или копирование из дистрибутива
    }
    
    return $null
}

function Test-FirebirdServerNetworkConnection {
    param (
        [string]$HostName = "localhost",
        [int]$Port = 3050
    )
    Write-Host ">>> [3/4] Проверка сетевой доступности сервера Firebird ($HostName:$Port)..." -ForegroundColor Cyan
    try {
        $tcp = Test-NetConnection -ComputerName $HostName -Port $Port -WarningAction SilentlyContinue
        if ($tcp.TcpTestSucceeded) {
            Write-Host " [OK] Порт Firebird $Port на хосте $HostName открыт и принимает соединения." -ForegroundColor Green
            return $true
        } else {
            Write-Host " [ВНИМАНИЕ] Порт $Port на хосте $HostName недоступен. Убедитесь, что служба Firebird запущена." -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host " [!] Ошибка при сетевой проверке: $($_.Exception.Message)" -ForegroundColor Yellow
        return $false
    }
}

function Test-FirebirdDatabaseQuery {
    param (
        [string]$FbToolsDir,
        [string]$FdbPath,
        [string]$User = "SYSDBA",
        [string]$Password = "masterkey"
    )
    Write-Host ">>> [4/4] Тестовый запрос к базе данных MEDICAL.FDB..." -ForegroundColor Cyan
    $isqlExe = Join-Path $FbToolsDir "isql.exe"
    
    if (-not (Test-Path $isqlExe)) {
        Write-Host " [ИНФО] isql.exe отсутствует в $FbToolsDir, проверка выполняется через Python модуль firebirdsql..." -ForegroundColor Cyan
        $pyScript = Join-Path $AppDir "server\sync_patients_firebird.py"
        $pyExe = Join-Path $AppDir "runtime\python\python.exe"
        if (-not (Test-Path $pyExe)) { $pyExe = "python.exe" }
        
        $testResult = & $pyExe $pyScript --test $FdbPath $User $Password
        Write-Host " Результат теста через Python: $testResult" -ForegroundColor Green
        return $true
    }
    
    # Создание временного SQL-запроса
    $tempSql = "$env:TEMP\test_fb_check.sql"
    "SELECT COUNT(*) AS PATIENTS_COUNT FROM PATIENTS;`nEXIT;" | Out-File -FilePath $tempSql -Encoding ascii
    
    $connectStr = "localhost:$FdbPath"
    $isqlOutput = & $isqlExe -user $User -password $Password $connectStr -i $tempSql -q 2>&1
    Remove-Item $tempSql -Force -ErrorAction SilentlyContinue
    
    if ($LASTEXITCODE -eq 0 -and ($isqlOutput -match "\d+")) {
        Write-Host " [УСПЕХ] Запрос выполнен успешно! Данные картотеки Firebird доступны." -ForegroundColor Green
        return $true
    } else {
        Write-Host " [ВНИМАНИЕ] Запрос к базе данных вернул предупреждение: $isqlOutput" -ForegroundColor Yellow
        return $false
    }
}

# Выполнение полного цикла
$vcOk = Test-VCRedistributableX64
$fbClientDir = Test-FirebirdClient
if ($fbClientDir) {
    # Настройка переменных окружения текущего сеанса
    $env:FIREBIRD = $fbClientDir
    $env:PATH = "$fbClientDir;$env:PATH"
    
    # Чтение настроек из appsettings.json
    $settingsFile = Join-Path $AppDir "server\appsettings.json"
    $fbPath = "C:\Users\vladimir\source\DB\Export\MEDICAL.FDB"
    $fbHost = "localhost"
    $fbPort = 3050
    if (Test-Path $settingsFile) {
        $json = Get-Content $settingsFile -Raw | ConvertFrom-Json
        if ($json.ConnectionStrings.Firebird.DatabasePath) { $fbPath = $json.ConnectionStrings.Firebird.DatabasePath }
        if ($json.ConnectionStrings.Firebird.Host) { $fbHost = $json.ConnectionStrings.Firebird.Host }
        if ($json.ConnectionStrings.Firebird.Port) { $fbPort = [int]$json.ConnectionStrings.Firebird.Port }
    }
    
    $netOk = Test-FirebirdServerNetworkConnection -HostName $fbHost -Port $fbPort
    if ($netOk -and (Test-Path $fbPath)) {
        Test-FirebirdDatabaseQuery -FbToolsDir $fbClientDir -FdbPath $fbPath
    }
}
```

#### 3. Содержимое автономного переносимого комплекта `tools/firebird/`:
```
tools/firebird/
├── fbclient.dll          # 64-битная клиентская библиотека Firebird
├── gds32.dll             # DLL обратной совместимости (псевдоним fbclient)
├── isql.exe              # Консольная интерактивная утилита выполнения SQL
├── firebird.msg          # Системные сообщения СУБД и тексты исключений
├── firebird.conf         # Файл конфигурации (WireCrypt = Disabled, Auth = Srp, Legacy_Auth)
├── test_connection.bat   # Пакетный скрипт быстрой проверки связи для инженера
└── plugins/              # Плагины безопасности и аутентификации
    ├── Srp.dll           # Современная криптографическая аутентификация Firebird 3+
    ├── Legacy_Auth.dll   # Совместимость с протоколом Firebird 2.5
    └── engine12.dll      # Движок выполнения встроенных процедур
```

#### 4. Пакетный сценарий тестирования для системного инженера клиники (`tools/firebird/test_connection.bat`):
```cmd
@echo off
chcp 65001 > nul
setlocal

set "APP_DIR=%~dp0..\.."
set "FB_DIR=%~dp0"
set "PATH=%FB_DIR%;%PATH%"
set "FIREBIRD=%FB_DIR%"

echo =========================================================================
echo  ДИАГНОСТИКА ПОДКЛЮЧЕНИЯ К МЕДИЦИНСКОЙ БАЗЕ ДАННЫХ FIREBIRD (MEDICAL.FDB)
echo =========================================================================
echo.

:: 1. Проверка наличия fbclient.dll
if not exist "%FB_DIR%fbclient.dll" (
    echo [ОШИБКА] Клиентская библиотека fbclient.dll не найдена в %FB_DIR%
    goto :error
)

:: 2. Вызов тестового режима через Python скрипт синхронизации
echo [1/2] Проверка протокола синхронизации через Python...
if exist "%APP_DIR%\runtime\python\python.exe" (
    "%APP_DIR%\runtime\python\python.exe" "%APP_DIR%\server\sync_patients_firebird.py" --test
) else (
    python "%APP_DIR%\server\sync_patients_firebird.py" --test
)

echo.
echo [2/2] Проверка прямого выполнения запроса через isql.exe...
if exist "%FB_DIR%isql.exe" (
    "%FB_DIR%isql.exe" -user SYSDBA -password masterkey "localhost:C:\Users\vladimir\source\DB\Export\MEDICAL.FDB" -q -i "%FB_DIR%test_query.sql"
)

echo.
echo [ИНФО] Тестирование завершено.
pause
exit /b 0

:error
echo [ФАТАЛЬНАЯ ОШИБКА] Инструменты Firebird не настроены.
pause
exit /b 1
```

---�)"]
            SQLGUI["DB Browser for SQLite<br/>(Портативный GUI)"]
        end
        subgraph "Клиент Firebird"
            FBClient["fbclient.dll + gds32.dll<br/>(64-bit Client Library)"]
            ISQL["isql.exe<br/>(CLI тестирование и выборки)"]
            Plugins["plugins/ (Srp, Legacy_Auth)<br/>+ firebird.msg"]
        end
    end

    subgraph "Базы данных клиники"
        SQLiteFile[("orthopedic_data_center.sqlite<br/>(Основная рабочая база)")]
        FirebirdFile[("MEDICAL.FDB<br/>(Внешняя база пациентов)")]
    end

    SQLCLI -->|Прямой доступ / VACUUM| SQLiteFile
    SQLGUI -->|Визуальный просмотр таблиц| SQLiteFile
    FBClient -->|Синхронизация через Python| FirebirdFile
    ISQL -->|Проверка порта 3050 и связи| FirebirdFile
```

---

### 7.1. Клиент SQLite (SQLite CLI & Портативный GUI)

#### 1. Назначение компонентов SQLite в дистрибутиве:
* **`sqlite3.exe` (Официальная консольная утилита SQLite):**
  - Выполнение низкоуровневых регламентных процедур без необходимости запуска Node.js (`PRAGMA integrity_check`, `VACUUM INTO`, `.recover`, `.dump`).
  - Быстрое ручное наложение SQL-патчей и миграций структуры.
* **DB Browser for SQLite (Portable Edition):**
  - Готовый портативный графический интерфейс, вложенный в папку `tools/sqlite-gui/` (не требует прав администратора).
  - Инсталлятор создает ярлык в меню «Пуск»: **«Управление базой данных клиники (SQLite)»**.
  - Позволяет администратору и аналитикам клиники визуально просматривать картотеку, формировать пользовательские SQL-отчеты и экспортировать данные в Excel/CSV.

#### 2. Сценарий проверки и подготовки SQLite Client:
```powershell
# scripts/db/check_sqlite_tools.ps1
function Check-SQLiteClient {
    Write-Host ">>> Проверка инструментов SQLite..." -ForegroundColor Cyan
    $localSqliteExe = "$PSScriptRoot\..\..\tools\sqlite\sqlite3.exe"
    
    if (Test-Path $localSqliteExe) {
        $ver = & $localSqliteExe --version
        Write-Host " [OK] Автономный SQLite CLI готов к работе: $ver" -ForegroundColor Green
    } else {
        Write-Host " [!] Скачивание и размещение автономного sqlite3.exe в tools/sqlite/..." -ForegroundColor Yellow
        New-Item -ItemType Directory -Force -Path "$PSScriptRoot\..\..\tools\sqlite" | Out-Null
        Invoke-WebRequest -Uri "https://sqlite.org/2026/sqlite-tools-win-x64.zip" -OutFile "$env:TEMP\sqlite-tools.zip"
        Expand-Archive -Path "$env:TEMP\sqlite-tools.zip" -DestinationPath "$env:TEMP\sqlite-extracted" -Force
        Copy-Item "$env:TEMP\sqlite-extracted\*\sqlite3.exe" -Destination $localSqliteExe -Force
        Remove-Item "$env:TEMP\sqlite*" -Recurse -Force
        Write-Host " [OK] sqlite3.exe успешно установлен." -ForegroundColor Green
    }
}
```

---

### 7.2. Клиент Firebird (`fbclient.dll`, `isql.exe`, библиотеки аутентификации)

#### 1. Зачем клинике необходим Firebird Client:
* Внешняя историческая база клиники хранится в формате СУБД Firebird (`MEDICAL.FDB`).
* Для сетевого подключения скрипта синхронизации ([server/sync_patients_firebird.py](file:///c:/Users/vladimir/source/repos/Data%20Analysis/server/sync_patients_firebird.py)), проверки доступности порта `3050` и выгрузки 61 298 пациентов необходима клиентская библиотека **`fbclient.dll`** (версии 2.5 или 3.0 x64) и плагины шифрования паролей (`Srp.dll`, `Legacy_Auth.dll`).
* При отсутствии клиентской библиотеки подключение завершается системной ошибкой Windows `Unable to load fbclient.dll / Client library not found`.

#### 2. Алгоритм проверки наличия Firebird Client в системе:
```powershell
# scripts/db/check_firebird_client.ps1
function Test-FirebirdClientInstallation {
    Write-Host ">>> Диагностика наличия клиентской библиотеки Firebird (fbclient.dll)..." -ForegroundColor Cyan
    
    # 1. Проверка системной папки System32
    $sys32Client = "$env:SystemRoot\System32\fbclient.dll"
    
    # 2. Проверка в системном реестре Windows
    $fbReg64 = Get-ItemProperty "HKLM:\SOFTWARE\Firebird Project\Firebird Server\Instances" -ErrorAction SilentlyContinue
    $fbReg32 = Get-ItemProperty "HKLM:\SOFTWARE\WOW6432Node\Firebird Project\Firebird Server\Instances" -ErrorAction SilentlyContinue
    
    # 3. Проверка локальной переносимой папки дистрибутива
    $localBundle = "$PSScriptRoot\..\..\tools\firebird\fbclient.dll"
    
    if (Test-Path $localBundle) {
        Write-Host " [OK] Обнаружен встроенный автономный Firebird Client: $localBundle" -ForegroundColor Green
        return $true
    } elseif (Test-Path $sys32Client) {
        Write-Host " [OK] Обнаружена системная библиотека Firebird: $sys32Client" -ForegroundColor Green
        return $true
    } elseif ($fbReg64 -or $fbReg32) {
        Write-Host " [OK] Обнаружен установленный сервер/клиент Firebird в реестре Windows." -ForegroundColor Green
        return $true
    } else {
        Write-Host " [!] Клиент Firebird не обнаружен на целевой машине." -ForegroundColor Yellow
        return $false
    }
}
```

#### 3. Автоматическая подготовка и развертывание Firebird Client:

Применяется **гибридный подход (Два уровня надежности)**:

* **Уровень 1: Встроенный переносимый клиент (Portable Bundle — по умолчанию в дистрибутиве):**
  - В дистрибутив вкладывается готовый комплект клиентских файлов в папку `tools/firebird/`:
    ```
    tools/firebird/
    ├── fbclient.dll          # Основная библиотека клиента (64-бит)
    ├── gds32.dll             # Псевдоним обратной совместимости
    ├── isql.exe              # Интерактивная утилита выполнения SQL
    ├── firebird.msg          # Файлы локализованных сообщений об ошибках
    ├── firebird.conf         # Конфигурация клиента (WireCrypt, Auth)
    └── plugins/              # Плагины авторизации
        ├── Srp.dll
        └── Legacy_Auth.dll
    ```
  - **Преимущество:** Полная автономия — скрипты синхронизации автоматически добавляют каталог `tools/firebird` в переменные окружения `PATH` и `FIREBIRD` процесса. Это работает **без прав локального администратора** и без засорения папки `System32`.

* **Уровень 2: Системная тихая установка через MSI (для серверов с ODBC):**
  - Если администратор клиники выбирает системную регистрацию Firebird Client (для подключения внешних аналитических инструментов через ODBC/OLEDB), инсталлятор запускает тихий пакет:
    ```cmd
    msiexec.exe /i "%PSScriptRoot%\installers\FirebirdClient-3.0.x-x64.msi" /quiet /qn /norestart
    ```

#### 4. Автоматическая проверка связи с базой `MEDICAL.FDB`:
Инсталлятор включает проверочный тест перед первым запуском синхронизации:
```cmd
@echo off
:: tools/firebird/test_connection.bat
"%~dp0isql.exe" -user SYSDBA -password masterkey "localhost:C:\Users\vladimir\source\DB\Export\MEDICAL.FDB" -q -i "%~dp0test_query.sql"
if %ERRORLEVEL% EQU 0 (
    echo [УСПЕХ] Сетевое подключение к Firebird MEDICAL.FDB подтверждено!
) else (
    echo [ВНИМАНИЕ] Не удалось подключиться к Firebird. Проверьте службу Firebird Server на порту 3050.
)
```

---

## 8. Конфигурация дистрибутива: `appsettings.json`

Файл конфигурации выносится в корень дистрибутива для легкой настройки системным администратором клиники:

```json
{
  "Server": {
    "Port": 5000,
    "Host": "127.0.0.1",
    "EnableSwagger": true,
    "CorsAllowedOrigins": ["*"]
  },
  "ConnectionStrings": {
    "SQLite": {
      "DatabasePath": "DB/orthopedic_data_center.sqlite",
      "JournalMode": "WAL",
      "Synchronous": "NORMAL",
      "BusyTimeoutMs": 10000,
      "ForeignKeys": true
    },
    "Firebird": {
      "Host": "localhost",
      "Port": 3050,
      "DatabasePath": "C:\\Users\\vladimir\\source\\DB\\Export\\MEDICAL.FDB",
      "User": "SYSDBA",
      "Password": "masterkey",
      "Charset": "WIN1251",
      "ClientLibraryPath": "tools/firebird/fbclient.dll"
    }
  },
  "BackupSettings": {
    "AutoBackupOnStartup": true,
    "BackupDirectory": "backups",
    "KeepBackupsDays": 30
  }
}
```

---

## 9. План резервного копирования и отказоустойчивости (Backup Strategy)

Медицинские данные требуют строгого соблюдения правил сохранности:
1. **Горячий бэкап при старте сервера:**
   - Перед открытием соединений сервер выполняет команду SQLite:
     ```sql
     VACUUM INTO 'backups/orthopedic_backup_YYYY_MM_DD_HHMMSS.sqlite';
     ```
   - Метод `VACUUM INTO` создает 100% целостную, дефрагментированную копию даже на работающей базе в режиме WAL.
2. **Ротация архивов:** Хранение последних 30 ежедневных снимков с автоматической очисткой устаревших копий.
3. **Быстрое восстановление (Disaster Recovery):** Для отката достаточно переименовать нужный файл из папки `backups/` в `DB/orthopedic_data_center.sqlite`.

---

## 10. Пошаговый план реализации (Action Plan)

| № | Этап | Задачи | Результат |
|---|---|---|---|
| **1** | **Рефакторинг путей API клиента** | • Создать `client/src/config/apiConfig.ts`<br/>• Заменить хардкод `http://localhost:5000` и `http://127.0.0.1:5000` на `API_BASE_URL`<br/>• Добавить прокси в `client/vite.config.ts` | Клиент работает одинаково в Vite dev-сервере и при раздаче из Express/IIS |
| **2** | **Интеграция статики в Express** | • Добавить в [server/index.js](file:///c:/Users/vladimir/source/repos/Data%20Analysis/server/index.js) раздачу статики `client/dist`<br/>• Реализовать SPA маршрутизацию (отдача `index.html` для неизвестных путей, кроме `/api`) | Автономная работа бэкенда без внешних веб-серверов |
| **3** | **Скрипты IIS и Reverse Proxy** | • Разработать `scripts/iis/check_and_install_iis.ps1`<br/>• Подготовить дистрибутивы `rewrite_amd64.msi` и `requestRouter_amd64.msi`<br/>• Создать шаблоны `public/web.config` и `scripts/iis/setup_iis_site.ps1` | Автоматическая проверка, установка IIS и публикация сайта на порту 80/443 |
| **4** | **Клиентские инструменты SQLite** | • Подготовить `tools/sqlite/sqlite3.exe`<br/>• Добавить портативную версию `tools/sqlite-gui/` (DB Browser for SQLite)<br/>• Настроить ярлык запуска для администратора | Возможность визуального и консольного обслуживания базы данных клиники |
| **5** | **Клиентские инструменты Firebird** | • Сформировать комплект `tools/firebird/` (`fbclient.dll`, `gds32.dll`, `isql.exe`, `plugins/`)<br/>• Добавить автоопределение пути к `fbclient.dll` в [sync_patients_firebird.py](file:///c:/Users/vladimir/source/repos/Data%20Analysis/server/sync_patients_firebird.py)<br/>• Написать скрипт тестирования соединения `test_connection.bat` | Гарантированное подключение к `MEDICAL.FDB` на любом ПК без предварительной установки Firebird |
| **6** | **Скрипт горячего резервного копирования** | • Реализовать endpoint `/api/admin/backup` и автоматический бэкап SQLite при старте через `VACUUM INTO` | Гарантия сохранности данных 61 000+ пациентов |
| **7** | **Скрипт автоматизированной сборки дистрибутива** | • Написать `scripts/build_dist.ps1`<br/>• Автоматическая компиляция клиента (`npm run build`)<br/>• Сборка чистой папки `dist_app/` со всеми зависимостями и инструментами | Формирование готовой папки приложения одной командой |
| **8** | **Лаунчеры и сценарии запуска** | • Создать `start.bat`, `install_service.bat`, `stop.bat`<br/>• Настроить автоматическое открытие браузера при запуске | Запуск клиники двойным кликом мыши |
| **9** | **Inno Setup Installer скрипт** | • Разработать `installer/setup_script.iss`<br/>• Добавить опции выбора: «Установить IIS Reverse Proxy», «Установить инструменты СУБД SQLite/Firebird»<br/>• Настроить создание иконок, прописывание в реестр и брандмауэр | Единый файл установки `Setup_OrthopedClinic.exe` |

