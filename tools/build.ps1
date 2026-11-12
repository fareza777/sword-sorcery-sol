param([switch]$SkipTests)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $projectRoot
try {
    if (-not $SkipTests) {
        & npm.cmd test
        if ($LASTEXITCODE -ne 0) { throw 'Game tests failed.' }
    }
    $version = (Get-Content -Raw -LiteralPath 'package.json' | ConvertFrom-Json).version
    # Signing material stays outside the repository. DPAPI protects the local password.
    $signingFolder = Join-Path $env:USERPROFILE '.codex\signing\sunward-oath'
    New-Item -ItemType Directory -Force -Path $signingFolder | Out-Null
    $signingFile = Join-Path $signingFolder 'sunward-oath.jks'
    $passwordFile = Join-Path $signingFolder 'password.dpapi'
    if (-not (Test-Path -LiteralPath $passwordFile)) {
        $randomBytes = New-Object byte[] 36
        [System.Security.Cryptography.RandomNumberGenerator]::Fill($randomBytes)
        $newPassword = [Convert]::ToBase64String($randomBytes)
        ConvertTo-SecureString -String $newPassword -AsPlainText -Force | ConvertFrom-SecureString | Set-Content -LiteralPath $passwordFile
    }
    $securePassword = Get-Content -LiteralPath $passwordFile | ConvertTo-SecureString
    $env:SUNWARD_SIGNING_PASSWORD = [System.Net.NetworkCredential]::new('', $securePassword).Password
    $env:SUNWARD_KEYSTORE = $signingFile
    if (-not (Test-Path -LiteralPath $signingFile)) {
        & keytool -genkeypair -keystore $signingFile -alias sunward -keyalg RSA -keysize 3072 -validity 10000 -dname 'CN=Sunward Oath, OU=Independent Games, O=Sunward' -storepass:env SUNWARD_SIGNING_PASSWORD -keypass:env SUNWARD_SIGNING_PASSWORD
        if ($LASTEXITCODE -ne 0) { throw 'Signing key generation failed.' }
    }
    & .\gradlew.bat :app:assembleDebug :app:assembleLocal :app:assembleRelease :app:lintRelease --console=plain
    if ($LASTEXITCODE -ne 0) { throw 'Android build or lint failed.' }
    New-Item -ItemType Directory -Force -Path dist | Out-Null
    Copy-Item -LiteralPath 'app\build\outputs\apk\local\app-local.apk' -Destination "dist\sunward-oath-$version.apk"
    Copy-Item -LiteralPath 'app\build\outputs\apk\release\app-release.apk' -Destination "dist\sunward-oath-$version-release.apk"
    $buildTools = Join-Path $env:ANDROID_HOME 'build-tools\35.0.0'
    & (Join-Path $buildTools 'apksigner.bat') verify --verbose "dist\sunward-oath-$version.apk"
    if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed.' }
    Get-FileHash -Algorithm SHA256 -LiteralPath "dist\sunward-oath-$version.apk" | Format-List
} finally {
    Remove-Item Env:SUNWARD_SIGNING_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:SUNWARD_KEYSTORE -ErrorAction SilentlyContinue
    Pop-Location
}
