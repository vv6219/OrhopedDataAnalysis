#requires -Version 5.1
[CmdletBinding()]
param (
    [string]$OutputDir = "$PSScriptRoot\..\distributive",
    [switch]$SkipClientBuild,
    [switch]$SkipNodeModulesInstall,
    [switch]$FreshInstallDependencies,
    [switch]$NoZip,
    [switch]$PreserveExistingDb
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
Write-Host " Distributive Build: Orthopedic Clinic Dobrushkin (v1.3.0)" -ForegroundColor Cyan
Write-Host " Full Standalone Zero-Dependency Installation Package" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Root Directory:   $rootDir" -ForegroundColor Gray
Write-Host "Output Directory: $OutputDir" -ForegroundColor Gray

# 1. Environment check
Write-Host "`n[1/7] Checking system environment..." -ForegroundColor Yellow
$nodeVer = & node -v 2>$null
if (-not $nodeVer) {
    Write-Host "[ERROR] Node.js was not found in PATH!" -ForegroundColor Red
    exit 1
}
Write-Host "  -> Node.js version: $nodeVer" -ForegroundColor Green

# 2. Build React SPA Client
Write-Host "`n[2/7] Building React SPA client (Vite + React 19 + MUI v9)..." -ForegroundColor Yellow
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

# 3. Prepare target directory layout
Write-Host "`n[3/7] Creating directory layout in $OutputDir..." -ForegroundColor Yellow
$backupDbTemp = $null
if (Test-Path $OutputDir) {
    Write-Host "  -> Cleaning existing target directory..." -ForegroundColor Gray
    $distDb = Join-Path $OutputDir "db\orthopedic_data_center.sqlite"
    if ($PreserveExistingDb -and (Test-Path $distDb)) {
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
Write-Host "`n[4/7] Copying application assets..." -ForegroundColor Yellow

# 4.1 Client static assets
$clientDist = Join-Path $clientDir "dist"
if (Test-Path $clientDist) {
    Copy-Item -Path "$clientDist\*" -Destination (Join-Path $OutputDir "client") -Recurse -Force
    $clientDistSubdir = Join-Path $OutputDir "client\dist"
    New-Item -ItemType Directory -Path $clientDistSubdir -Force | Out-Null
    Copy-Item -Path "$clientDist\*" -Destination $clientDistSubdir -Recurse -Force
    Write-Host "  -> Copied client SPA assets to client and client\dist" -ForegroundColor Gray
} else {
    Write-Host "  [WARNING] client/dist was not found!" -ForegroundColor Red
}

# 4.2 Web.config for IIS
$webConfig = Join-Path $publicDir "web.config"
if (Test-Path $webConfig) {
    Copy-Item -Path $webConfig -Destination (Join-Path $OutputDir "client\web.config") -Force
    Write-Host "  -> Copied IIS web.config to client/web.config" -ForegroundColor Gray
}

# 4.3 Server files
Get-ChildItem -Path $serverDir -Exclude "node_modules", "package-lock.json", ".git*", "*.sqlite*", "*.log" | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination (Join-Path $OutputDir "server") -Recurse -Force
}
Write-Host "  -> Copied Express API server files to server" -ForegroundColor Gray

# 4.4 SQLite Database with full data
$sourceDb = Join-Path $dbDir "orthopedic_data_center.sqlite"
if (-not (Test-Path $sourceDb)) {
    $sourceDb = Join-Path $rootDir "DB\orthopedic_data_center.sqlite"
}
$destDb = Join-Path $OutputDir "db\orthopedic_data_center.sqlite"

if ($backupDbTemp -and (Test-Path $backupDbTemp)) {
    Copy-Item -Path $backupDbTemp -Destination $destDb -Force
    Remove-Item $backupDbTemp -Force -ErrorAction SilentlyContinue
    Write-Host "  -> Restored existing database" -ForegroundColor Yellow
} elseif (Test-Path $sourceDb) {
    Copy-Item -Path $sourceDb -Destination $destDb -Force
    $dbSizeMb = (Get-Item $destDb).Length / 1MB
    Write-Host ("  -> Copied master SQLite database with data: " + [Math]::Round($dbSizeMb, 2) + " MB (61k+ records, v1.3.0 schemas)") -ForegroundColor Green
} else {
    Write-Host "  [WARNING] Master SQLite database not found!" -ForegroundColor Red
}

# 4.5 Configuration files
Copy-Item -Path (Join-Path $serverDir "appsettings.json") -Destination (Join-Path $OutputDir "appsettings.json") -Force
Copy-Item -Path (Join-Path $serverDir "appsettings.json") -Destination (Join-Path $OutputDir "server\appsettings.json") -Force

# 4.6 Tools (SQLite, Firebird & Portable Node.js Zero-Dependency runtime)
if (Test-Path $toolsDir) {
    Copy-Item -Path "$toolsDir\*" -Destination (Join-Path $OutputDir "tools") -Recurse -Force
    Write-Host "  -> Copied tools (SQLite, Firebird & Portable Node.js runtime) to tools" -ForegroundColor Gray
}

# 4.7 Offline System Installers (VC++, Node.js MSI, IIS modules)
$installersDir = Join-Path $rootDir "installers"
if (Test-Path $installersDir) {
    $destInstallers = Join-Path $OutputDir "installers"
    New-Item -ItemType Directory -Path $destInstallers -Force | Out-Null
    Copy-Item -Path "$installersDir\*" -Destination $destInstallers -Recurse -Force
    Write-Host "  -> Copied offline system installers to installers" -ForegroundColor Gray
}

# 4.8 IIS Scripts
Copy-Item -Path (Join-Path $PSScriptRoot "iis\*") -Destination (Join-Path $OutputDir "scripts\iis") -Force
Write-Host "  -> Copied IIS automation scripts to scripts\iis" -ForegroundColor Gray

# 4.9 Launchers & Guides
Copy-Item -Path (Join-Path $rootDir "start.bat") -Destination (Join-Path $OutputDir "start.bat") -Force
Copy-Item -Path (Join-Path $rootDir "stop.bat") -Destination (Join-Path $OutputDir "stop.bat") -Force
Copy-Item -Path (Join-Path $rootDir "install_service.bat") -Destination (Join-Path $OutputDir "install_service.bat") -Force
Copy-Item -Path (Join-Path $rootDir "setup_iis.bat") -Destination (Join-Path $OutputDir "setup_iis.bat") -Force
Copy-Item -Path (Join-Path $rootDir "install_prerequisites.bat") -Destination (Join-Path $OutputDir "install_prerequisites.bat") -Force
Copy-Item -Path (Join-Path $rootDir "create_desktop_shortcut.bat") -Destination (Join-Path $OutputDir "create_desktop_shortcut.bat") -Force
Copy-Item -Path (Join-Path $rootDir "README_INSTALL.txt") -Destination (Join-Path $OutputDir "README_INSTALL.txt") -Force
Write-Host "  -> Copied launchers (start, stop, service, iis, prerequisites, shortcut, README) to root" -ForegroundColor Gray

# 5. Server node_modules dependencies
Write-Host "`n[5/7] Preparing Node.js backend dependencies..." -ForegroundColor Yellow
$sourceNodeModules = Join-Path $serverDir "node_modules"
$destNodeModules = Join-Path $OutputDir "server\node_modules"

if ($FreshInstallDependencies) {
    Push-Location (Join-Path $OutputDir "server")
    try {
        Write-Host "  -> Installing fresh production dependencies (npm install --omit=dev)..." -ForegroundColor Gray
        & npm install --omit=dev --no-audit --no-fund
    } finally {
        Pop-Location
    }
    Write-Host "  [OK] Production dependencies installed." -ForegroundColor Green
} elseif (Test-Path $sourceNodeModules) {
    Write-Host "  -> Fast-copying pre-built production node_modules from server/node_modules..." -ForegroundColor Gray
    & robocopy $sourceNodeModules $destNodeModules /E /NFL /NDL /NJH /NJS /nc /ns /np
    if ($LASTEXITCODE -ge 8) {
        Write-Host "  -> Robocopy fallback to Copy-Item..." -ForegroundColor Yellow
        Copy-Item -Path $sourceNodeModules -Destination $destNodeModules -Recurse -Force
    }
    Write-Host "  [OK] Pre-compiled node_modules copied (zero-dependency ready)." -ForegroundColor Green
} else {
    Push-Location (Join-Path $OutputDir "server")
    try {
        Write-Host "  -> Running npm install --omit=dev..." -ForegroundColor Gray
        & npm install --omit=dev --no-audit --no-fund
    } finally {
        Pop-Location
    }
    Write-Host "  [OK] Production dependencies installed." -ForegroundColor Green
}

# 6. Verification and Summary
Write-Host "`n[6/7] Verifying distributive integrity..." -ForegroundColor Yellow
$distSize = (Get-ChildItem -Path $OutputDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " DISTRIBUTIVE FOLDER READY!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ("Distributive Path:  " + $OutputDir) -ForegroundColor White
Write-Host ("Total Package Size: " + [Math]::Round($distSize, 2) + " MB") -ForegroundColor White

# 7. Create distributive.zip archive
if (-not $NoZip) {
    Write-Host "`n[7/7] Compressing into standalone distributive.zip archive..." -ForegroundColor Yellow
    $zipPath = Join-Path $rootDir "distributive.zip"
    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force
    }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($OutputDir, $zipPath, [System.IO.Compression.CompressionLevel]::Optimal, $true)
    $zipSize = (Get-Item $zipPath).Length / 1MB
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host " STANDALONE DISTRIBUTIVE.ZIP CREATED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host ("Archive Path: " + $zipPath) -ForegroundColor White
    Write-Host ("Archive Size: " + [Math]::Round($zipSize, 2) + " MB") -ForegroundColor White
}

Write-Host "`nAll components ready for standalone offline deployment!" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
