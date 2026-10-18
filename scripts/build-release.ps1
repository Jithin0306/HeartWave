# HeartWave Release & Auto-Updater Packaging Script
param (
    [string]$Version = "1.3.24"
)

$ErrorActionPreference = "Stop"
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " Building HeartWave v$Version with Auto-Updater" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Ensure Cargo is in PATH
$env:PATH = "$env:USERPROFILE\.cargo\bin;" + $env:PATH

# 2. Configure Signing Keys
$keyPath = "src-tauri/heartwave.key"
if (Test-Path $keyPath) {
    $env:TAURI_SIGNING_PRIVATE_KEY = Get-Content $keyPath -Raw
    $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "HeartWaveRelease2026"
    Write-Host " Cryptographic signing keys loaded." -ForegroundColor Green
} else {
    Write-Warning "Private key not found at $keyPath. Binaries will not be cryptographically signed for auto-updates."
}

# 3. Build Production Bundle
Write-Host " Running Tauri build..." -ForegroundColor Yellow
$env:CARGO_BUILD_JOBS = "2"
npx tauri build

# 4. Sign installer if not already signed
$nsisExe = "src-tauri\target\release\bundle\nsis\HeartWave_${Version}_x64-setup.exe"
$nsisSigPath = "$nsisExe.sig"
if ((Test-Path $nsisExe) -and (-not (Test-Path $nsisSigPath))) {
    Write-Host " Cryptographically signing NSIS installer..." -ForegroundColor Yellow
    npx tauri signer sign -f src-tauri/heartwave.key -p "HeartWaveRelease2026" $nsisExe
}

# 5. Generate latest.json manifest for GitHub Release
if (Test-Path $nsisSigPath) {
    $signature = (Get-Content $nsisSigPath -Raw).Trim()
    $isoDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    
    $manifest = @{
        version = $Version
        notes = "HeartWave v$Version release with native Rust zero-copy broadcasting and in-app auto-updates."
        pub_date = $isoDate
        platforms = @{
            "windows-x86_64" = @{
                signature = $signature
                url = "https://github.com/Jithin0306/HeartWave/releases/download/v$Version/HeartWave_${Version}_x64-setup.exe"
            }
        }
    }

    $manifestJson = $manifest | ConvertTo-Json -Depth 5
    $outPath = "src-tauri\target\release\bundle\latest.json"
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($outPath, $manifestJson, $utf8NoBom)
    Write-Host " Generated updater manifest (UTF-8 without BOM) at: $outPath" -ForegroundColor Green
    Write-Host " Upload 'latest.json' and 'HeartWave_${Version}_x64-setup.exe' to GitHub Release v$Version." -ForegroundColor Cyan
}

# 6. Copy artifacts to release-$Version directory
$releaseFolder = "release-$Version"
if (-not (Test-Path $releaseFolder)) {
    New-Item -ItemType Directory -Path $releaseFolder | Out-Null
}
$msiExe = "src-tauri\target\release\bundle\msi\HeartWave_${Version}_x64_en-US.msi"
$rawExe = "src-tauri\target\release\heartwave.exe"
if (Test-Path $nsisExe) { Copy-Item $nsisExe -Destination $releaseFolder -Force }
if (Test-Path $nsisSigPath) { Copy-Item $nsisSigPath -Destination $releaseFolder -Force }
if (Test-Path $msiExe) { Copy-Item $msiExe -Destination $releaseFolder -Force }
if (Test-Path $rawExe) { Copy-Item $rawExe -Destination "$releaseFolder\HeartWave-Portable.exe" -Force }
$manifestPath = "src-tauri\target\release\bundle\latest.json"
if (Test-Path $manifestPath) { Copy-Item $manifestPath -Destination $releaseFolder -Force }
Write-Host " Artifacts copied to: $releaseFolder" -ForegroundColor Green

Write-Host "Build and packaging completed successfully!" -ForegroundColor Green
