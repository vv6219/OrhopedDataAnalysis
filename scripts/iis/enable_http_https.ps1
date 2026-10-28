#requires -Version 5.1
<#
.SYNOPSIS
    Установка Enabled Protocols в 'http,https' для IIS и добавление HTTPS привязки.
#>

[CmdletBinding()]
param (
    [string]$SiteName = "OrthopedClinic",
    [int]$HttpsPort = 8443
)

$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 1. Проверка прав Администратора
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ADMIN REQUIRED] Запуск с повышением привилегий (UAC)..." -ForegroundColor Yellow
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " Установка Enabled Protocols: http,https для Microsoft IIS" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

Import-Module WebAdministration -ErrorAction SilentlyContinue

# 2. Установка enabledProtocols на уровне приложения и сайта
Write-Host "`n[1/3] Настройка enabledProtocols = 'http,https'..." -ForegroundColor Yellow
try {
    # 1) Для целевого сайта OrthopedClinic
    Set-ItemProperty "IIS:\Sites\$SiteName" -Name "enabledProtocols" -Value "http,https" -ErrorAction SilentlyContinue
    Set-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -location "$SiteName" -filter "system.applicationHost/sites/site[@name='$SiteName']/application[@path='/']" -name "enabledProtocols" -value "http,https" -ErrorAction SilentlyContinue
    
    # 2) Через appcmd
    & "$env:SystemRoot\System32\inetsrv\appcmd.exe" set app "$SiteName/" /enabledProtocols:"http,https" 2>$null
    
    # 3) Для всех остальных сайтов IIS (включая Default Web Site)
    Set-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.applicationHost/sites/site/application" -name "enabledProtocols" -value "http,https" -ErrorAction SilentlyContinue
    
    Write-Host "  [OK] Enabled Protocols успешно установлены: http,https" -ForegroundColor Green
} catch {
    Write-Host "  [ВНИМАНИЕ] Ошибка установки enabledProtocols: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Настройка HTTPS привязки и SSL сертификата
Write-Host "`n[2/3] Настройка HTTPS привязки на порту $HttpsPort..." -ForegroundColor Yellow
try {
    $cert = Get-ChildItem Cert:\LocalMachine\My | Where-Object { $_.HasPrivateKey -and ($_.Subject -like "*localhost*" -or $_.Subject -like "*$SiteName*" -or $_.Subject -like "*$env:COMPUTERNAME*") } | Select-Object -First 1
    if (-not $cert) {
        Write-Host "  Генерация доверенного самоподписанного сертификата..." -ForegroundColor Gray
        $cert = New-SelfSignedCertificate -DnsName "localhost", $env:COMPUTERNAME -CertStoreLocation "Cert:\LocalMachine\My" -NotAfter (Get-Date).AddYears(5)
    }

    if ($cert) {
        $existingHttps = Get-WebBinding -Name $SiteName -Protocol "https" -ErrorAction SilentlyContinue
        if ($existingHttps) {
            $existingHttps | Remove-WebBinding -ErrorAction SilentlyContinue
        }
        New-WebBinding -Name $SiteName -Port $HttpsPort -Protocol "https" -IPAddress "*"
        $binding = Get-WebBinding -Name $SiteName -Protocol "https" -Port $HttpsPort
        $binding.AddSslCertificate($cert.Thumbprint, "My")
        Write-Host "  [OK] HTTPS привязка активна на порту $HttpsPort (SSL: $($cert.Subject))." -ForegroundColor Green
    }
} catch {
    Write-Host "  [ВНИМАНИЕ] Ошибка привязки HTTPS: $($_.Exception.Message)" -ForegroundColor Gray
}

# 4. Открытие порта в Windows Firewall
Write-Host "`n[3/3] Проверка брандмауэра Windows для порта HTTPS $HttpsPort..." -ForegroundColor Yellow
$firewallRuleHttps = "$SiteName Web Secure (HTTPS $HttpsPort)"
if (-not (Get-NetFirewallRule -DisplayName $firewallRuleHttps -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName $firewallRuleHttps -Direction Inbound -LocalPort $HttpsPort -Protocol TCP -Action Allow | Out-Null
    Write-Host "  [OK] Порт HTTPS $HttpsPort открыт в Windows Firewall." -ForegroundColor Green
} else {
    Write-Host "  [OK] Правило брандмауэра для порта HTTPS $HttpsPort уже существует." -ForegroundColor Green
}

# 5. Перезапуск сайта IIS
Restart-WebSite -Name $SiteName -ErrorAction SilentlyContinue

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host " Готово! Протоколы HTTP и HTTPS активированы в IIS:" -ForegroundColor Cyan
Write-Host "  • HTTP:   http://localhost:8080" -ForegroundColor Cyan
Write-Host "  • HTTPS:  https://localhost:$HttpsPort" -ForegroundColor Cyan
$lanIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress
if ($lanIp) {
    Write-Host "  • Сеть клиники HTTP (LAN):   http://${lanIp}:8080" -ForegroundColor Cyan
    Write-Host "  • Сеть клиники HTTPS (LAN):  https://${lanIp}:$HttpsPort" -ForegroundColor Cyan
}
Write-Host "======================================================================" -ForegroundColor Cyan

Start-Sleep -Seconds 2

