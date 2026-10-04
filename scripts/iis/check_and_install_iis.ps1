#requires -Version 5.1
<#
.SYNOPSIS
    Проверка, установка и настройка Microsoft IIS, URL Rewrite и ARR для Центра Ортопедии Добрушкина.
.DESCRIPTION
    Скрипт проверяет наличие компонентов IIS на Windows 10/11 / Windows Server,
    устанавливает недостающие модули обратного проксирования (URL Rewrite, Application Request Routing)
    и включает режим Reverse Proxy.
#>

[CmdletBinding()]
param (
    [switch]$SkipModuleInstall
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " Центр Ортопедии Добрушкина — Проверка и подготовка Microsoft IIS" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Проверка прав Администратора
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ОШИБКА] Данный скрипт требует запуска от имени Администратора!" -ForegroundColor Red
    Write-Host "Пожалуйста, перезапустите PowerShell с повышенными привилегиями (Запуск от имени администратора)." -ForegroundColor Yellow
    exit 1
}

# 2. Определение редакции Windows (Клиентская или Серверная)
$isServer = (Get-CimInstance -ClassName Win32_OperatingSystem).ProductType -ne 1

# 3. Проверка и установка базовых компонентов IIS
Write-Host "`n[1/4] Проверка службы Microsoft IIS..." -ForegroundColor Yellow

$iisInstalled = $false
if ($isServer) {
    Import-Module ServerManager -ErrorAction SilentlyContinue
    $iisFeature = Get-WindowsFeature -Name Web-Server -ErrorAction SilentlyContinue
    $iisInstalled = ($iisFeature -and $iisFeature.Installed)
} else {
    $iisFeature = Get-WindowsOptionalFeature -Online -FeatureName IIS-WebServer -ErrorAction SilentlyContinue
    $iisInstalled = ($iisFeature -and $iisFeature.State -eq 'Enabled')
}

if ($iisInstalled) {
    Write-Host "  -> Microsoft IIS уже установлен и готов к работе." -ForegroundColor Green
} else {
    Write-Host "  -> IIS не обнаружен. Начинаем установку необходимых компонентов..." -ForegroundColor Cyan
    if ($isServer) {
        Install-WindowsFeature -Name Web-Server, Web-Common-Http, Web-Static-Content, Web-Default-Doc, Web-Http-Errors, Web-Http-Redirect, Web-Filtering, Web-Http-Logging, Web-Stat-Compression, Web-Dyn-Compression -IncludeManagementTools
    } else {
        $clientFeatures = @(
            'IIS-WebServerRole',
            'IIS-WebServer',
            'IIS-CommonHttpFeatures',
            'IIS-StaticContent',
            'IIS-DefaultDocument',
            'IIS-HttpErrors',
            'IIS-HttpRedirect',
            'IIS-Security',
            'IIS-RequestFiltering',
            'IIS-HttpLogging',
            'IIS-HttpCompressionStatic',
            'IIS-HttpCompressionDynamic',
            'IIS-ManagementConsole'
        )
        foreach ($feat in $clientFeatures) {
            Write-Host "     Включение компонента $feat..." -ForegroundColor Gray
            Enable-WindowsOptionalFeature -Online -FeatureName $feat -All -NoRestart -ErrorAction SilentlyContinue | Out-Null
        }
    }
    Write-Host "  [OK] Базовые компоненты IIS успешно установлены." -ForegroundColor Green
}

# 4. Проверка модуля URL Rewrite
Write-Host "`n[2/4] Проверка модуля IIS URL Rewrite..." -ForegroundColor Yellow
$rewriteInstalled = Test-Path "$env:ProgramFiles\Reference Assemblies\Microsoft\IIS\Microsoft.Web.Iis.Rewrite.dll" -ErrorAction SilentlyContinue
if (-not $rewriteInstalled) {
    $rewriteInstalled = (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\IIS Extensions\URL Rewrite" -ErrorAction SilentlyContinue) -ne $null
}

if ($rewriteInstalled) {
    Write-Host "  -> Модуль URL Rewrite 2.1 обнаружен." -ForegroundColor Green
} else {
    Write-Host "  [ВНИМАНИЕ] Модуль URL Rewrite 2.1 не найден." -ForegroundColor Yellow
    $installerPath = Join-Path $PSScriptRoot "..\..\installers\rewrite_amd64_ru-RU.msi"
    $installerEn = Join-Path $PSScriptRoot "..\..\installers\rewrite_amd64.msi"

    $targetMsi = $null
    if (Test-Path $installerPath) { $targetMsi = $installerPath }
    elseif (Test-Path $installerEn) { $targetMsi = $installerEn }

    if ($targetMsi -and -not $SkipModuleInstall) {
        Write-Host "  -> Запуск тихой установки URL Rewrite: $targetMsi..." -ForegroundColor Cyan
        Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$targetMsi`" /quiet /qn /norestart" -Wait
        Write-Host "  [OK] URL Rewrite успешно установлен." -ForegroundColor Green
    } else {
        Write-Host "  -> Скачайте и установите URL Rewrite 2.1 x64 с официального сайта Microsoft:" -ForegroundColor Yellow
        Write-Host "     https://www.iis.net/downloads/microsoft/url-rewrite" -ForegroundColor White
    }
}

# 5. Проверка модуля Application Request Routing (ARR)
Write-Host "`n[3/4] Проверка модуля Application Request Routing (ARR)..." -ForegroundColor Yellow
$arrInstalled = Test-Path "$env:ProgramFiles\IIS\Application Request Routing\requestRouter.dll" -ErrorAction SilentlyContinue
if (-not $arrInstalled) {
    $arrInstalled = (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\IIS Extensions\Application Request Routing" -ErrorAction SilentlyContinue) -ne $null
}

if ($arrInstalled) {
    Write-Host "  -> Модуль ARR 3.0 обнаружен." -ForegroundColor Green
} else {
    Write-Host "  [ВНИМАНИЕ] Модуль Application Request Routing (ARR) не найден." -ForegroundColor Yellow
    $arrMsi = Join-Path $PSScriptRoot "..\..\installers\requestRouter_amd64.msi"
    if ((Test-Path $arrMsi) -and -not $SkipModuleInstall) {
        Write-Host "  -> Запуск тихой установки ARR: $arrMsi..." -ForegroundColor Cyan
        Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$arrMsi`" /quiet /qn /norestart" -Wait
        Write-Host "  [OK] ARR успешно установлен." -ForegroundColor Green
    } else {
        Write-Host "  -> Скачайте и установите ARR 3.0 x64 с официального сайта Microsoft:" -ForegroundColor Yellow
        Write-Host "     https://www.iis.net/downloads/microsoft/application-request-routing" -ForegroundColor White
    }
}

# 6. Включение функционала Proxy в ARR
Write-Host "`n[4/4] Настройка проксирования в IIS ARR..." -ForegroundColor Yellow
try {
    Import-Module WebAdministration -ErrorAction SilentlyContinue
    $appCmd = "$env:SystemRoot\system32\inetsrv\appcmd.exe"
    if (Test-Path $appCmd) {
        & $appCmd set config -section:system.webServer/proxy /enabled:"True" /commit:apphost | Out-Null
        Write-Host "  [OK] Режим Reverse Proxy (system.webServer/proxy) успешно активирован в IIS." -ForegroundColor Green
    } else {
        Write-Host "  [ВНИМАНИЕ] appcmd.exe не найден. Убедитесь, что IIS включен." -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [ВНИМАНИЕ] Не удалось автоматически включить proxy в ARR: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host " Проверка и настройка IIS успешно завершена!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
