# HeartWave Release & Auto-Updater Packaging Script
param (
    [string]$Version = "1.0.1"
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
npx tauri build

# 4. Generate latest.json manifest for GitHub Release
$nsisSigPath = "src-tauri\target\release\bundle\nsis\HeartWave_${Version}_x64-setup.exe.sig"
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
    $manifestJson | Out-File -FilePath $outPath -Encoding utf8
    Write-Host " Generated updater manifest at: $outPath" -ForegroundColor Green
    Write-Host " Upload 'latest.json' and 'HeartWave_${Version}_x64-setup.exe' to GitHub Release v$Version." -ForegroundColor Cyan
}

Write-Host "Build and packaging completed successfully!" -ForegroundColor Green
