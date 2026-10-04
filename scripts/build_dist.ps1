#requires -Version 5.1
[CmdletBinding()]
param (
    [string]$OutputDir = "$PSScriptRoot\..\distributive",
    [switch]$SkipClientBuild,
    [switch]$SkipNodeModulesInstall
)

$ErrorActionPreference = 'Stop'

$rootDir = (Resolve-Path "$PSScriptRoot\..").Path
if (-not $OutputDir -or $OutputDir -like "*\..\distributive" -or $OutputDir -like "*\..\dist_app") {
    $OutputDir = Join-Path $rootDir "distributive"
}
$OutputDir = [System.IO.Path]::GetFullPath($OutputDir)

$clientDir = Join-Path $rootDir "client"
$serverDir = Join-Path $rootDir "server"
$dbDir = Join-Path $rootDir "db"
$toolsDir = Join-Path $rootDir "tools"
$publicDir = Join-Path $rootDir "public"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " Distributive Build: Orthopedic Clinic Dobrushkin" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Root Directory: $rootDir" -ForegroundColor Gray
Write-Host "Output Directory: $OutputDir" -ForegroundColor Gray

# 1. Environment check
Write-Host "`n[1/6] Checking system environment..." -ForegroundColor Yellow
$nodeVer = & node -v 2>$null
if (-not $nodeVer) {
    Write-Host "[ERROR] Node.js was not found in PATH!" -ForegroundColor Red
    exit 1
}
Write-Host "  -> Node.js version: $nodeVer" -ForegroundColor Green

# 2. Build React SPA Client
Write-Host "`n[2/6] Building React SPA client (Vite + React 19)..." -ForegroundColor Yellow
if (-not $SkipClientBuild) {
    Push-Location $clientDir
    try {
        Write-Host "  -> Running 'npm run build' in $clientDir..." -ForegroundColor Gray
        & npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] React client build failed!" -ForegroundColor Red
            exit $LASTEXITCODE
        }
    } finally {
        Pop-Location
    }
    Write-Host "  [OK] Client application built successfully into client/dist." -ForegroundColor Green
} else {
    Write-Host "  -> Skipped client build per -SkipClientBuild flag." -ForegroundColor Gray
}

# 3. Prepare target directory
Write-Host "`n[3/6] Creating directory layout in $OutputDir..." -ForegroundColor Yellow
$backupDbTemp = $null
if (Test-Path $OutputDir) {
    Write-Host "  -> Cleaning existing target directory..." -ForegroundColor Gray
    $distDb = Join-Path $OutputDir "db\orthopedic_data_center.sqlite"
    if (Test-Path $distDb) {
        $backupDbTemp = [System.IO.Path]::GetTempFileName()
        Copy-Item -Path $distDb -Destination $backupDbTemp -Force
    }
    Remove-Item -Path $OutputDir -Recurse -Force
}

New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $OutputDir "client") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $OutputDir "server") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $OutputDir "db") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $OutputDir "backups") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $OutputDir "tools") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $OutputDir "scripts\iis") -Force | Out-Null
Write-Host "  [OK] Target directories created." -ForegroundColor Green

# 4. Copy application components
Write-Host "`n[4/6] Copying application assets..." -ForegroundColor Yellow

# 4.1 Client static assets
$clientDist = Join-Path $clientDir "dist"
if (Test-Path $clientDist) {
    Copy-Item -Path "$clientDist\*" -Destination (Join-Path $OutputDir "client") -Recurse -Force
    Write-Host "  -> Copied client SPA assets to dist_app/client" -ForegroundColor Gray
} else {
    Write-Host "  [WARNING] client/dist was not found!" -ForegroundColor Red
}

# 4.2 Web.config for IIS
$webConfig = Join-Path $publicDir "web.config"
if (Test-Path $webConfig) {
    Copy-Item -Path $webConfig -Destination (Join-Path $OutputDir "client\web.config") -Force
    Write-Host "  -> Copied IIS web.config to dist_app/client/web.config" -ForegroundColor Gray
}

# 4.3 Server files
Get-ChildItem -Path $serverDir -Exclude "node_modules", "package-lock.json", ".git*" | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination (Join-Path $OutputDir "server") -Recurse -Force
}
Write-Host "  -> Copied Express API server files to dist_app/server" -ForegroundColor Gray

# 4.4 SQLite Database
$sourceDb = Join-Path $dbDir "orthopedic_data_center.sqlite"
$destDb = Join-Path $OutputDir "db\orthopedic_data_center.sqlite"
if ($backupDbTemp -and (Test-Path $backupDbTemp)) {
    Copy-Item -Path $backupDbTemp -Destination $destDb -Force
    Remove-Item $backupDbTemp -Force -ErrorAction SilentlyContinue
    Write-Host "  -> Preserved and restored existing database from dist_app/db" -ForegroundColor Green
} elseif (Test-Path $sourceDb) {
    Copy-Item -Path $sourceDb -Destination $destDb -Force
    Write-Host "  -> Copied master SQLite database (61k+ records) to dist_app/db" -ForegroundColor Gray
}

# 4.5 Configuration files
Copy-Item -Path (Join-Path $serverDir "appsettings.json") -Destination (Join-Path $OutputDir "appsettings.json") -Force
Copy-Item -Path (Join-Path $serverDir "appsettings.json") -Destination (Join-Path $OutputDir "server\appsettings.json") -Force

# 4.6 Tools (SQLite & Firebird)
if (Test-Path $toolsDir) {
    Copy-Item -Path "$toolsDir\*" -Destination (Join-Path $OutputDir "tools") -Recurse -Force
    Write-Host "  -> Copied tools (SQLite & Firebird) to dist_app/tools" -ForegroundColor Gray
}

# 4.7 IIS Scripts
Copy-Item -Path (Join-Path $PSScriptRoot "iis\*") -Destination (Join-Path $OutputDir "scripts\iis") -Force
Write-Host "  -> Copied IIS automation scripts to dist_app/scripts/iis" -ForegroundColor Gray

# 4.8 Launchers & Guides
Copy-Item -Path (Join-Path $rootDir "start.bat") -Destination (Join-Path $OutputDir "start.bat") -Force
Copy-Item -Path (Join-Path $rootDir "stop.bat") -Destination (Join-Path $OutputDir "stop.bat") -Force
Copy-Item -Path (Join-Path $rootDir "install_service.bat") -Destination (Join-Path $OutputDir "install_service.bat") -Force
Copy-Item -Path (Join-Path $rootDir "setup_iis.bat") -Destination (Join-Path $OutputDir "setup_iis.bat") -Force
Copy-Item -Path (Join-Path $rootDir "README_INSTALL.txt") -Destination (Join-Path $OutputDir "README_INSTALL.txt") -Force
Write-Host "  -> Copied launchers (start.bat, stop.bat, install_service.bat, setup_iis.bat, README_INSTALL.txt) to distributive root" -ForegroundColor Gray

# 5. Server node_modules dependencies
Write-Host "`n[5/6] Preparing Node.js backend dependencies..." -ForegroundColor Yellow
if (-not $SkipNodeModulesInstall) {
    Push-Location (Join-Path $OutputDir "server")
    try {
        Write-Host "  -> Installing production dependencies (npm install --omit=dev)..." -ForegroundColor Gray
        & npm install --omit=dev --no-audit --no-fund
    } finally {
        Pop-Location
    }
    Write-Host "  [OK] Production dependencies installed." -ForegroundColor Green
} else {
    Write-Host "  -> Copying existing node_modules from server/node_modules..." -ForegroundColor Gray
    $sourceNodeModules = Join-Path $serverDir "node_modules"
    if (Test-Path $sourceNodeModules) {
        Copy-Item -Path $sourceNodeModules -Destination (Join-Path $OutputDir "server\node_modules") -Recurse -Force
        Write-Host "  [OK] node_modules copied." -ForegroundColor Green
    }
}

# 6. Verification and Summary
Write-Host "`n[6/6] Verifying distributive integrity..." -ForegroundColor Yellow
$distSize = (Get-ChildItem -Path $OutputDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host " DISTRIBUTIVE BUILD FINISHED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ("Distributive Path: " + $OutputDir) -ForegroundColor White
Write-Host ("Total Package Size: " + [Math]::Round($distSize, 2) + " MB") -ForegroundColor White
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host " 1. Run Standalone: Launch start.bat in dist_app" -ForegroundColor White
Write-Host " 2. Publish to IIS: Run scripts\iis\setup_iis_site.ps1 as Administrator" -ForegroundColor White
Write-Host " 3. Firebird Test: Run tools\firebird\test_connection.bat" -ForegroundColor White
Write-Host " 4. Build Installer: Compile installer\setup_script.iss with Inno Setup" -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Cyan
