#requires -Version 5.1
<#
.SYNOPSIS
    Создание и публикация веб-сайта клиники в Microsoft IIS в режиме Reverse Proxy.
.DESCRIPTION
    Настраивает пул приложений без управляемого кода (.NET CLR Version: No Managed Code),
    создает сайт в IIS, прописывает web.config и открывает порт в Windows Firewall для локальной сети.
#>

[CmdletBinding()]
param (
    [string]$SiteName = "OrthopedClinic",
    [int]$Port = 80,
    [string]$PhysicalPath = "$PSScriptRoot\..\..\dist_app\client",
    [int]$BackendPort = 5000
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " Публикация веб-сайта '$SiteName' в Microsoft IIS (Порт $Port)" -ForegroundColor Cyan
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
    # Создать директорию, если ее еще нет
    New-Item -ItemType Directory -Path $PhysicalPath -Force | Out-Null
    $resolvedPhysicalPath = (Resolve-Path $PhysicalPath)
}
$siteRoot = $resolvedPhysicalPath.Path
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

# 6. Создание или перенастройка IIS Website
if (Test-Path "IIS:\Sites\$SiteName") {
    Write-Host "Сайт $SiteName уже существует, обновляем настройки..." -ForegroundColor Yellow
    Set-ItemProperty "IIS:\Sites\$SiteName" -Name "physicalPath" -Value $siteRoot
    Set-ItemProperty "IIS:\Sites\$SiteName" -Name "applicationPool" -Value $poolName
} else {
    Write-Host "Создание нового сайта $SiteName на порту $Port..." -ForegroundColor Yellow
    New-Item "IIS:\Sites\$SiteName" -bindings @{protocol="http";bindingInformation="*:$Port:"} -physicalPath $siteRoot
    Set-ItemProperty "IIS:\Sites\$SiteName" -Name "applicationPool" -Value $poolName
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

# 8. Открытие порта в Windows Firewall
$firewallRuleName = "$SiteName Web (HTTP $Port)"
$existingRule = Get-NetFirewallRule -DisplayName $firewallRuleName -ErrorAction SilentlyContinue
if (-not $existingRule) {
    Write-Host "Добавление правила брандмауэра для входящих подключений на порт $Port..." -ForegroundColor Yellow
    New-NetFirewallRule -DisplayName $firewallRuleName -Direction Inbound -LocalPort $Port -Protocol TCP -Action Allow | Out-Null
    Write-Host "  [OK] Порт $Port успешно открыт в Windows Firewall." -ForegroundColor Green
} else {
    Write-Host "Правило брандмауэра для порта $Port уже существует." -ForegroundColor Green
}

# 9. Перезапуск веб-сайта
Start-WebSite -Name $SiteName
Write-Host "`n[УСПЕХ] Веб-сайт клиники успешно развернут в IIS!" -ForegroundColor Green
Write-Host "Локальный адрес: http://localhost:$Port" -ForegroundColor Cyan
$lanIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress
if ($lanIp) {
    Write-Host "Сетевой адрес в клинике (LAN): http://${lanIp}:$Port" -ForegroundColor Cyan
}
Write-Host "======================================================================" -ForegroundColor Cyan
