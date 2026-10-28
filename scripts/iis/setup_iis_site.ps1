#requires -Version 5.1
<#
.SYNOPSIS
    Создание и публикация веб-сайта клиники в Microsoft IIS в режиме Reverse Proxy (HTTP и HTTPS).
.DESCRIPTION
    Настраивает пул приложений без управляемого кода (.NET CLR Version: No Managed Code),
    создает сайт в IIS, включает ARR Proxy, устанавливает enabledProtocols="http,https",
    настраивает привязки HTTP и HTTPS с SSL сертификатом, прописывает web.config и открывает порты в Windows Firewall.
#>

[CmdletBinding()]
param (
    [string]$SiteName = "OrthopedClinic",
    [int]$Port = 8080,
    [int]$HttpsPort = 8443,
    [string]$PhysicalPath = "$PSScriptRoot\..\..\dist_app\client",
    [int]$BackendPort = 5000
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " Публикация веб-сайта '$SiteName' в Microsoft IIS (HTTP $Port, HTTPS $HttpsPort)" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Проверка прав Администратора
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ОШИБКА] Данный скрипт требует запуска от имени Администратора!" -ForegroundColor Red
    exit 1
}

# 2. Подключение модуля WebAdministration
Import-Module WebAdministration -ErrorAction Stop

# 3. Разрешение физического пути
$resolvedPhysicalPath = (Resolve-Path $PhysicalPath -ErrorAction SilentlyContinue)
if (-not $resolvedPhysicalPath) {
    New-Item -ItemType Directory -Path $PhysicalPath -Force | Out-Null
    $resolvedPhysicalPath = (Resolve-Path $PhysicalPath)
}
$siteRoot = $resolvedPhysicalPath.Path
if (Test-Path (Join-Path $siteRoot "dist\index.html")) {
    $siteRoot = (Resolve-Path (Join-Path $siteRoot "dist")).Path
    Write-Host "Обнаружен скомпилированный каталог dist, используем: $siteRoot" -ForegroundColor Gray
}
Write-Host "Физический каталог сайта: $siteRoot" -ForegroundColor Gray

# 4. Настройка прав доступа для IIS_IUSRS
Write-Host "Настройка прав доступа для группы IIS_IUSRS..." -ForegroundColor Yellow
$acl = Get-Acl $siteRoot
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule("BUILTIN\IIS_IUSRS", "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow")
$acl.SetAccessRule($rule)
Set-Acl $siteRoot $acl

# 5. Создание / Обновление Application Pool
$poolName = "${SiteName}Pool"
if (-not (Test-Path "IIS:\AppPools\$poolName")) {
    Write-Host "Создание пула приложений: $poolName..." -ForegroundColor Yellow
    $appPool = New-Item "IIS:\AppPools\$poolName"
    $appPool | Set-ItemProperty -Name "managedRuntimeVersion" -Value ""
    $appPool | Set-ItemProperty -Name "managedPipelineMode" -Value 0
    $appPool | Set-ItemProperty -Name "processModel.idleTimeout" -Value ([TimeSpan]::FromMinutes(0))
} else {
    Write-Host "Пул приложений $poolName уже существует." -ForegroundColor Green
    Set-ItemProperty "IIS:\AppPools\$poolName" -Name "managedRuntimeVersion" -Value ""
}

# 5.1 Включение функционала Application Request Routing (Proxy)
try {
    Write-Host "Включение проксирования в ARR на уровне IIS..." -ForegroundColor Yellow
    Set-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.webServer/proxy" -name "enabled" -value "True" -ErrorAction SilentlyContinue
} catch {
    Write-Host "  [ВНИМАНИЕ] Не удалось активировать ARR proxy на уровне сервера: $($_.Exception.Message)" -ForegroundColor Gray
}

# 6. Создание или перенастройка IIS Website
if (Test-Path "IIS:\Sites\$SiteName") {
    Write-Host "Сайт $SiteName уже существует, обновляем настройки..." -ForegroundColor Yellow
    Set-ItemProperty "IIS:\Sites\$SiteName" -Name "physicalPath" -Value $siteRoot
    Set-ItemProperty "IIS:\Sites\$SiteName" -Name "applicationPool" -Value $poolName
} else {
    Write-Host "Создание нового сайта $SiteName..." -ForegroundColor Yellow
    New-Item "IIS:\Sites\$SiteName" -bindings @{protocol="http";bindingInformation="*:$($Port):"} -physicalPath $siteRoot
    Set-ItemProperty "IIS:\Sites\$SiteName" -Name "applicationPool" -Value $poolName
}

# 6.1 Установка протоколов http и https (Enabled Protocols)
Write-Host "Включение протоколов http и https (Enabled Protocols: http,https)..." -ForegroundColor Yellow
try {
    Set-ItemProperty "IIS:\Sites\$SiteName" -Name "enabledProtocols" -Value "http,https" -ErrorAction SilentlyContinue
    Set-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -location "$SiteName" -filter "system.applicationHost/sites/site[@name='$SiteName']/application[@path='/']" -name "enabledProtocols" -value "http,https" -ErrorAction SilentlyContinue
    & "$env:SystemRoot\System32\inetsrv\appcmd.exe" set app "$SiteName/" /enabledProtocols:"http,https" 2>$null
    Write-Host "  [OK] Enabled Protocols успешно установлены в 'http,https'." -ForegroundColor Green
} catch {
    Write-Host "  [ВНИМАНИЕ] Не удалось установить enabledProtocols: $($_.Exception.Message)" -ForegroundColor Gray
}

# 6.2 Настройка HTTP привязки
Write-Host "Настройка HTTP привязки (Порт $Port)..." -ForegroundColor Yellow
$httpBinding = Get-WebBinding -Name $SiteName -Protocol "http" -ErrorAction SilentlyContinue
if (-not $httpBinding) {
    New-WebBinding -Name $SiteName -Port $Port -Protocol "http" -IPAddress "*"
} else {
    Get-WebBinding -Name $SiteName -Protocol "http" | Remove-WebBinding -ErrorAction SilentlyContinue
    New-WebBinding -Name $SiteName -Port $Port -Protocol "http" -IPAddress "*"
}
Write-Host "  [OK] HTTP привязка активна на порту $Port." -ForegroundColor Green

# 6.3 Настройка HTTPS привязки и SSL сертификата
Write-Host "Настройка HTTPS привязки (Порт $HttpsPort)..." -ForegroundColor Yellow
try {
    $siteFilter = "*$SiteName*"
    $compFilter = "*$env:COMPUTERNAME*"
    $cert = Get-ChildItem -Path Cert:\LocalMachine\My | Where-Object { 
        $_.HasPrivateKey -and ($_.Subject -like "*localhost*" -or $_.Subject -like $siteFilter -or $_.Subject -like $compFilter) 
    } | Select-Object -First 1

    if (-not $cert) {
        Write-Host "  Создание самоподписанного SSL сертификата..." -ForegroundColor Gray
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

# 7. Генерация и копирование web.config с целевым портом бэкенда
$webConfigTemplate = @"
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <staticContent>
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="30.00:00:00" />
      <remove fileExtension=".woff" />
      <mimeMap fileExtension=".woff" mimeType="font/woff" />
      <remove fileExtension=".woff2" />
      <mimeMap fileExtension=".woff2" mimeType="font/woff2" />
      <remove fileExtension=".json" />
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <remove fileExtension=".webp" />
      <mimeMap fileExtension=".webp" mimeType="image/webp" />
    </staticContent>
    <defaultDocument>
      <files>
        <clear />
        <add value="index.html" />
      </files>
    </defaultDocument>
    <rewrite>
      <rules>
        <rule name="ReverseProxyToBackend" stopProcessing="true">
          <match url="(.*)" />
          <conditions logicalGrouping="MatchAll" trackAllCaptures="false">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
          </conditions>
          <action type="Rewrite" url="http://127.0.0.1:$BackendPort/{R:1}" />
        </rule>
      </rules>
    </rewrite>
    <httpProtocol>
      <customHeaders>
        <add name="X-Frame-Options" value="SAMEORIGIN" />
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="X-XSS-Protection" value="1; mode=block" />
        <add name="Arr-Disable-Session-Affinity" value="True" />
      </customHeaders>
    </httpProtocol>
    <security>
      <requestFiltering>
        <requestLimits maxAllowedContentLength="104857600" />
      </requestFiltering>
    </security>
    <httpErrors existingResponse="PassThrough" />
  </system.webServer>
</configuration>
"@

$webConfigPath = Join-Path $siteRoot "web.config"
[System.IO.File]::WriteAllText($webConfigPath, $webConfigTemplate, [System.Text.Encoding]::UTF8)
Write-Host "Конфигурационный файл web.config сохранен: $webConfigPath" -ForegroundColor Green

# 8. Открытие портов в Windows Firewall
$firewallRuleHttp = "$SiteName Web (HTTP $Port)"
if (-not (Get-NetFirewallRule -DisplayName $firewallRuleHttp -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName $firewallRuleHttp -Direction Inbound -LocalPort $Port -Protocol TCP -Action Allow | Out-Null
    Write-Host "  [OK] Порт HTTP $Port открыт в Windows Firewall." -ForegroundColor Green
}

$firewallRuleHttps = "$SiteName Web Secure (HTTPS $HttpsPort)"
if (-not (Get-NetFirewallRule -DisplayName $firewallRuleHttps -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName $firewallRuleHttps -Direction Inbound -LocalPort $HttpsPort -Protocol TCP -Action Allow | Out-Null
    Write-Host "  [OK] Порт HTTPS $HttpsPort открыт в Windows Firewall." -ForegroundColor Green
}

# 10. Запуск веб-сайта
try {
    Start-WebSite -Name $SiteName -ErrorAction Stop
    Write-Host "`n[УСПЕХ] Веб-сайт клиники успешно развернут и запущен в IIS!" -ForegroundColor Green
    Write-Host "  Локальный HTTP:       http://localhost:$Port" -ForegroundColor Cyan
    Write-Host "  Локальный HTTPS:      https://localhost:$HttpsPort" -ForegroundColor Cyan
    $lanIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress
    if ($lanIp) {
        Write-Host "  Сетевой HTTP (LAN):   http://$($lanIp):$Port" -ForegroundColor Cyan
        Write-Host "  Сетевой HTTPS (LAN):  https://$($lanIp):$HttpsPort" -ForegroundColor Cyan
    }
} catch {
    Write-Host "`n[ПРЕДУПРЕЖДЕНИЕ] Не удалось запустить сайт $SiteName : $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host "======================================================================" -ForegroundColor Cyan
