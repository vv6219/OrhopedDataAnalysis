#requires -Version 5.1
<#
.SYNOPSIS
    Комплексная диагностика и устранение проблем с запуском служб и IIS (HTTP 502).
.DESCRIPTION
    1. Автоматически запрашивает права Администратора при необходимости.
    2. Исправляет параметры службы OrthopedClinicBackend в реестре (устраняет ошибку путей с пробелами).
    3. Синхронизирует исправленные .bat скрипты (start.bat, stop.bat, install_service.bat) в папки distributive и OrthoERP.
    4. Включает ARR Proxy в IIS на уровне сервера.
    5. Перезапускает службу OrthopedClinicBackend и тестирует порты 5000, 8080 и сетевой IP.
#>

[CmdletBinding()]
param ()

$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 1. Проверка и автоматический запрос прав Администратора
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "======================================================================" -ForegroundColor Yellow
    Write-Host " [ТРЕБУЮТСЯ ПРАВА АДМИНИСТРАТОРА] Запуск с повышением привилегий (UAC)..." -ForegroundColor Yellow
    Write-Host "======================================================================" -ForegroundColor Yellow
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " Центр Ортопедии Добрушкина — Диагностика и Восстановление Системы" -ForegroundColor Cyan
Write-Host " Устранение HTTP 502, исправление службы NSSM и проверка IIS (Порт 8080)" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

$scriptRoot = (Resolve-Path "$PSScriptRoot\..").Path
$serverDir = Join-Path $scriptRoot "server"
$logsDir = Join-Path $serverDir "logs"
$toolsDir = Join-Path $scriptRoot "tools"

if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

# 2. Определение путей к Node.js и NSSM
$nodeExe = Join-Path $toolsDir "node\node.exe"
if (-not (Test-Path $nodeExe)) {
    $nodeCmd = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($nodeCmd) { $nodeExe = $nodeCmd.Source }
}

$nssmExe = Join-Path $toolsDir "nssm\nssm.exe"
if (-not (Test-Path $nssmExe)) {
    $nssmCmd = Get-Command nssm.exe -ErrorAction SilentlyContinue
    if ($nssmCmd) { $nssmExe = $nssmCmd.Source }
}

Write-Host "`n[1/5] Проверка путей компонентов..." -ForegroundColor Yellow
Write-Host "  -> Корень проекта: $scriptRoot" -ForegroundColor Gray
Write-Host "  -> Node.js:        $nodeExe" -ForegroundColor Gray
Write-Host "  -> NSSM:           $nssmExe" -ForegroundColor Gray

# 3. Исправление конфигурации службы OrthopedClinicBackend
Write-Host "`n[2/5] Проверка и исправление системной службы OrthopedClinicBackend..." -ForegroundColor Yellow

if ((Test-Path "HKLM:\SYSTEM\CurrentControlSet\Services\OrthopedClinicBackend") -and (Test-Path $nssmExe)) {
    Write-Host "  -> Служба обнаружена в системе. Остановка перед настройкой..." -ForegroundColor Gray
    & $nssmExe stop OrthopedClinicBackend 2>$null

    # Устанавливаем AppDirectory и AppParameters без абсолютных путей с пробелами
    Write-Host "  -> Запись корректных параметров (AppParameters = 'index.js')..." -ForegroundColor Gray
    & $nssmExe set OrthopedClinicBackend AppDirectory "$serverDir"
    & $nssmExe set OrthopedClinicBackend AppParameters "index.js"
    & $nssmExe set OrthopedClinicBackend AppStdout "$logsDir\service_out.log"
    & $nssmExe set OrthopedClinicBackend AppStderr "$logsDir\service_err.log"
    & $nssmExe set OrthopedClinicBackend AppRotateFiles 1
    & $nssmExe set OrthopedClinicBackend AppRotateOnline 1
    & $nssmExe set OrthopedClinicBackend AppRotateBytes 10485760
    & $nssmExe set OrthopedClinicBackend AppThrottle 1500

    Write-Host "  -> Запуск обновленной службы OrthopedClinicBackend..." -ForegroundColor Gray
    & $nssmExe start OrthopedClinicBackend
    Start-Sleep -Seconds 2
    Write-Host "  [OK] Параметры службы успешно обновлены и служба запущена!" -ForegroundColor Green
} else {
    Write-Host "  -> Служба OrthopedClinicBackend не найдена. Создание через NSSM..." -ForegroundColor Gray
    if (Test-Path $nssmExe) {
        & $nssmExe install OrthopedClinicBackend "$nodeExe" "index.js"
        & $nssmExe set OrthopedClinicBackend AppDirectory "$serverDir"
        & $nssmExe set OrthopedClinicBackend Description "Сервер автоматизации и REST API Центра Ортопедии Добрушкина"
        & $nssmExe set OrthopedClinicBackend Start SERVICE_AUTO_START
        & $nssmExe set OrthopedClinicBackend AppStdout "$logsDir\service_out.log"
        & $nssmExe set OrthopedClinicBackend AppStderr "$logsDir\service_err.log"
        & $nssmExe set OrthopedClinicBackend AppRotateFiles 1
        & $nssmExe set OrthopedClinicBackend AppRotateOnline 1
        & $nssmExe set OrthopedClinicBackend AppRotateBytes 10485760
        & $nssmExe start OrthopedClinicBackend
        Start-Sleep -Seconds 2
        Write-Host "  [OK] Служба OrthopedClinicBackend создана и запущена!" -ForegroundColor Green
    } else {
        Write-Host "  [ВНИМАНИЕ] nssm.exe не найден. Пропуск автоматической настройки службы." -ForegroundColor Yellow
    }
}

# 4. Нормализация CRLF и синхронизация .bat файлов в distributive и OrthoERP
Write-Host "`n[3/5] Синхронизация исправленных .bat файлов..." -ForegroundColor Yellow
$batFiles = @("start.bat", "stop.bat", "install_service.bat", "fix_service.bat")
$targetDirs = @(
    (Join-Path $scriptRoot "distributive"),
    (Join-Path $scriptRoot "OrthoERP")
)

foreach ($tDir in $targetDirs) {
    if (Test-Path $tDir) {
        Write-Host "  -> Синхронизация с директорией: $tDir" -ForegroundColor Gray
        foreach ($b in $batFiles) {
            $src = Join-Path $scriptRoot $b
            if (Test-Path $src) {
                Copy-Item -Path $src -Destination (Join-Path $tDir $b) -Force
            }
        }
    }
}
Write-Host "  [OK] Скрипты синхронизированы." -ForegroundColor Green

# 5. Проверка и настройка IIS (ARR Proxy & Enabled Protocols)
Write-Host "`n[4/5] Проверка IIS, Enabled Protocols (http,https) и ARR..." -ForegroundColor Yellow
try {
    Import-Module WebAdministration -ErrorAction SilentlyContinue
    if (Get-Module WebAdministration) {
        Write-Host "  -> Активация функции проксирования (ARR Proxy) на уровне IIS..." -ForegroundColor Gray
        Set-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.webServer/proxy" -name "enabled" -value "True" -ErrorAction SilentlyContinue
        
        Write-Host "  -> Установка enabledProtocols: http,https..." -ForegroundColor Gray
        Set-ItemProperty "IIS:\Sites\OrthopedClinic" -Name "enabledProtocols" -Value "http,https" -ErrorAction SilentlyContinue
        Set-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -location "OrthopedClinic" -filter "system.applicationHost/sites/site[@name='OrthopedClinic']/application[@path='/']" -name "enabledProtocols" -value "http,https" -ErrorAction SilentlyContinue
        & "$env:SystemRoot\System32\inetsrv\appcmd.exe" set app "OrthopedClinic/" /enabledProtocols:"http,https" 2>$null
        Set-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.applicationHost/sites/site/application" -name "enabledProtocols" -value "http,https" -ErrorAction SilentlyContinue

        # Настройка HTTPS привязки на порту 8443
        $cert = Get-ChildItem Cert:\LocalMachine\My | Where-Object { $_.HasPrivateKey -and ($_.Subject -like "*localhost*" -or $_.Subject -like "*OrthopedClinic*" -or $_.Subject -like "*$env:COMPUTERNAME*") } | Select-Object -First 1
        if ($cert) {
            $httpsBinding = Get-WebBinding -Name "OrthopedClinic" -Protocol "https" -ErrorAction SilentlyContinue
            if (-not $httpsBinding) {
                New-WebBinding -Name "OrthopedClinic" -Port 8443 -Protocol "https" -IPAddress "*"
                $httpsBinding = Get-WebBinding -Name "OrthopedClinic" -Protocol "https" -Port 8443
            }
            $httpsBinding.AddSslCertificate($cert.Thumbprint, "My")
        }

        $orthoSite = Get-WebSite -Name "OrthopedClinic" -ErrorAction SilentlyContinue
        if ($orthoSite) {
            Write-Host "  -> Перезапуск сайта OrthopedClinic в IIS..." -ForegroundColor Gray
            Restart-WebSite -Name "OrthopedClinic" -ErrorAction SilentlyContinue
            Write-Host "  [OK] IIS сайт OrthopedClinic перезапущен с протоколами http,https." -ForegroundColor Green
        }
    } else {
        Write-Host "  [ИНФО] Модуль WebAdministration недоступен или IIS не активен." -ForegroundColor Gray
    }
} catch {
    Write-Host "  [ВНИМАНИЕ] Ошибка при настройке IIS: $($_.Exception.Message)" -ForegroundColor Gray
}

# 6. Проверка доступности сервисов и портов
Write-Host "`n[5/5] Финальное тестирование доступности портов..." -ForegroundColor Yellow

# Тест порта 5000 (Backend API)
$backendOk = $false
for ($i = 0; $i -lt 5; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "http://127.0.0.1:5000" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($resp.StatusCode -eq 200) {
            $backendOk = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if ($backendOk) {
    Write-Host "  [OK] Бэкенд на порту 5000: РАБОТАЕТ (HTTP 200)" -ForegroundColor Green
} else {
    Write-Host "  [ОШИБКА] Бэкенд на порту 5000 не ответил за 5 секунд!" -ForegroundColor Red
    Write-Host "  Проверьте лог ошибки: $logsDir\service_err.log" -ForegroundColor Yellow
}

# Тест порта 8080 (IIS HTTP)
$iisOk = $false
try {
    $resp8080 = Invoke-WebRequest -Uri "http://127.0.0.1:8080" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    if ($resp8080.StatusCode -eq 200) {
        $iisOk = $true
    }
} catch {
    $iisOk = $false
}

$lanIps = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" }).IPAddress

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host " Результаты диагностики и восстановления:" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "• Бэкенд Express API:   " -NoNewline
if ($backendOk) { Write-Host "🟢 АКТИВЕН (Порт 5000)" -ForegroundColor Green } else { Write-Host "🔴 ОШИБКА" -ForegroundColor Red }

Write-Host "• Веб-сервер IIS (8080):" -NoNewline
if ($iisOk) { Write-Host "🟢 АКТИВЕН (HTTP 502 УСТРАНЕН)" -ForegroundColor Green } else { Write-Host "🟡 ТРЕБУЕТ ПРОВЕРКИ" -ForegroundColor Yellow }

Write-Host "• Протоколы IIS:        " -NoNewline
Write-Host "🟢 HTTP и HTTPS (enabledProtocols: http,https)" -ForegroundColor Green

Write-Host "`nРабочие адреса для входа в систему:" -ForegroundColor White
Write-Host "  - Локально HTTP:          http://localhost:8080" -ForegroundColor Cyan
Write-Host "  - Локально HTTPS:         https://localhost:8443" -ForegroundColor Cyan
foreach ($ip in $lanIps) {
    Write-Host "  - Сеть клиники HTTP (LAN): http://${ip}:8080" -ForegroundColor Cyan
    Write-Host "  - Сеть клиники HTTPS (LAN):https://${ip}:8443" -ForegroundColor Cyan
}
Write-Host "  - Swagger документация:   http://localhost:5000/api-docs" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

Write-Host "`nНажмите любую клавишу для завершения..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
