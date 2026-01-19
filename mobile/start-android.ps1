# Start Expo with Android environment variables set
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH = "$env:PATH;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Expo with Android Support" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if SDK exists
if (-not (Test-Path $env:ANDROID_HOME)) {
    Write-Host "❌ Android SDK not found at: $env:ANDROID_HOME" -ForegroundColor Red
    Write-Host "Please install Android Studio and the Android SDK first." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Android SDK configured:" -ForegroundColor Green
Write-Host "  ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Cyan
Write-Host "  ANDROID_SDK_ROOT: $env:ANDROID_SDK_ROOT" -ForegroundColor Cyan
Write-Host ""

# Check for platform-tools
$platformTools = "$env:ANDROID_HOME\platform-tools"
if (Test-Path $platformTools) {
    Write-Host "✅ Platform-tools found" -ForegroundColor Green
} else {
    Write-Host "⚠️  Platform-tools not found. Expo may still work, but you should install them:" -ForegroundColor Yellow
    Write-Host "   Android Studio > Tools > SDK Manager > SDK Tools > Android SDK Platform-Tools" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Starting Expo..." -ForegroundColor Green
Write-Host ""

# Start Expo with Android flag
npx expo start --android
