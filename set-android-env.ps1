# Set Android SDK Environment Variables
# Run this script before starting Expo

$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"

Write-Host "Setting Android SDK environment variables..." -ForegroundColor Yellow

# Set environment variables for current session
$env:ANDROID_HOME = $sdkPath
$env:ANDROID_SDK_ROOT = $sdkPath

# Add to PATH for current session
$platformTools = "$sdkPath\platform-tools"
if ($env:PATH -notlike "*$platformTools*") {
    $env:PATH = "$env:PATH;$platformTools"
}

Write-Host "✅ ANDROID_HOME set to: $env:ANDROID_HOME" -ForegroundColor Green
Write-Host "✅ ANDROID_SDK_ROOT set to: $env:ANDROID_SDK_ROOT" -ForegroundColor Green
Write-Host ""

# Verify SDK exists
if (Test-Path $sdkPath) {
    Write-Host "✅ Android SDK found" -ForegroundColor Green
} else {
    Write-Host "❌ Android SDK not found at: $sdkPath" -ForegroundColor Red
    Write-Host "Please install Android Studio first." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Environment variables are set for this session." -ForegroundColor Cyan
Write-Host "Now you can run: cd mobile && npm start" -ForegroundColor Cyan
