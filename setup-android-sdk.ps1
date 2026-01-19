# Android SDK Setup Script for TreeZam
# This script configures the Android SDK environment variables

$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Android SDK Setup for TreeZam" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if SDK exists
if (Test-Path $sdkPath) {
    Write-Host "✅ Android SDK found at: $sdkPath" -ForegroundColor Green
} else {
    Write-Host "❌ Android SDK not found at: $sdkPath" -ForegroundColor Red
    Write-Host "Please install Android Studio and the Android SDK first." -ForegroundColor Yellow
    exit 1
}

# Set ANDROID_HOME environment variable
Write-Host "Setting ANDROID_HOME environment variable..." -ForegroundColor Yellow
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', $sdkPath, 'User')
$env:ANDROID_HOME = $sdkPath
Write-Host "✅ ANDROID_HOME set to: $sdkPath" -ForegroundColor Green

# Add platform-tools to PATH
Write-Host "Adding platform-tools to PATH..." -ForegroundColor Yellow
$platformTools = "$sdkPath\platform-tools"
$currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')

if ($currentPath -notlike "*$platformTools*") {
    [System.Environment]::SetEnvironmentVariable('Path', "$currentPath;$platformTools", 'User')
    $env:PATH += ";$platformTools"
    Write-Host "✅ Added platform-tools to PATH" -ForegroundColor Green
} else {
    Write-Host "✅ platform-tools already in PATH" -ForegroundColor Green
}

# Check for platform-tools
if (Test-Path "$platformTools\adb.exe") {
    Write-Host "✅ ADB found at: $platformTools\adb.exe" -ForegroundColor Green
    Write-Host ""
    Write-Host "Testing ADB..." -ForegroundColor Yellow
    & "$platformTools\adb.exe" version
} else {
    Write-Host "⚠️  Platform-Tools not found. You need to install them:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Open Android Studio" -ForegroundColor Cyan
    Write-Host "2. Go to: Tools > SDK Manager" -ForegroundColor Cyan
    Write-Host "3. Click on 'SDK Tools' tab" -ForegroundColor Cyan
    Write-Host "4. Check 'Android SDK Platform-Tools'" -ForegroundColor Cyan
    Write-Host "5. Click 'Apply' to install" -ForegroundColor Cyan
    Write-Host ""
}

# Set ANDROID_SDK_ROOT (some tools use this)
[System.Environment]::SetEnvironmentVariable('ANDROID_SDK_ROOT', $sdkPath, 'User')
$env:ANDROID_SDK_ROOT = $sdkPath
Write-Host "✅ ANDROID_SDK_ROOT set to: $sdkPath" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT: Restart your terminal/IDE for changes to take effect!" -ForegroundColor Yellow
Write-Host ""
Write-Host "After restarting, you can test with:" -ForegroundColor Cyan
Write-Host "  cd mobile" -ForegroundColor White
Write-Host "  npm start" -ForegroundColor White
Write-Host "  Press 'a' for Android" -ForegroundColor White
