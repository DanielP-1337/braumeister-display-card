#Requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)][string]$Adb,
    [Parameter(Mandatory=$true)][string]$Serial,
    [string]$ApkPath,
    [Parameter(Mandatory=$true)][ValidateSet('compact', 'fullscreen')][string]$Layout,
    [switch]$LayoutOnly
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$settingsPath = Join-Path $root 'fully-ha-settings.json'
$settings = Get-Content -LiteralPath $settingsPath -Raw | ConvertFrom-Json
if ($settings.startURL -notmatch '^https?://') { throw 'Gueltige startURL fehlt in fully-ha-settings.json.' }
$Layout = $Layout.ToLowerInvariant()
if ($LayoutOnly -and $ApkPath) { throw '-ApkPath kann nicht mit -LayoutOnly kombiniert werden.' }
$layoutMarker = "const layout = 'compact';"
if ([regex]::Matches($settings.injectJsCode, [regex]::Escape($layoutMarker)).Count -ne 1) {
    throw 'Layout-Vorlage fehlt oder ist mehrdeutig in fully-ha-settings.json. Aktuelles Profil verwenden.'
}
$settings.injectJsCode = $settings.injectJsCode.Replace($layoutMarker, "const layout = '$Layout';")
$importSettings = if ($LayoutOnly) { [ordered]@{ injectJsCode = $settings.injectJsCode } } else { $settings }
$package = 'de.ozerov.fully'
function Invoke-Device {
    param([string[]]$Arguments)
    $result = @(& $Adb -s $Serial @Arguments)
    if ($LASTEXITCODE -ne 0) { throw "ADB-Schritt fehlgeschlagen: $($Arguments -join ' ')" }
    return ($result -join "`n")
}

$importPath = [IO.Path]::GetTempFileName()
try {
    [IO.File]::WriteAllText($importPath, ($importSettings | ConvertTo-Json -Depth 5), (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "Fully-Darstellung: $Layout"
    # Do not overwrite unrelated deployment files or allow persistent imports to undo ours.
    foreach ($remoteFile in @('/sdcard/fully-once-settings.json', '/sdcard/fully-auto-settings.json')) {
        $exists = Invoke-Device -Arguments @('shell', "if [ -e $remoteFile ]; then echo EXISTS; else echo ABSENT; fi")
        if ($exists.Trim() -ne 'ABSENT') { throw "Importdatei vorhanden oder Status unklar: $remoteFile. Datei vor erneutem Setup pruefen." }
    }
    $before = Invoke-Device -Arguments @('shell', 'dumpsys', 'package', $package)
    $beforeVersion = [regex]::Match($before, 'versionName=([^\s]+)').Groups[1].Value
    Write-Host "Fully vorher: $(if ($beforeVersion) { $beforeVersion } else { 'nicht installiert' })"
    if ($LayoutOnly -and -not $beforeVersion) { throw 'Fully ist nicht installiert. Zuerst -SetupFully mit -FullyLayout verwenden.' }

    if (-not $LayoutOnly) {
        if (-not $ApkPath) {
            $downloadDir = Join-Path $root ('tools/fully-download-' + [guid]::NewGuid().ToString('N'))
            New-Item -ItemType Directory -Path $downloadDir -Force | Out-Null
            $previousTls = [Net.ServicePointManager]::SecurityProtocol
            try {
                [Net.ServicePointManager]::SecurityProtocol = $previousTls -bor [Net.SecurityProtocolType]::Tls12
                $page = Invoke-WebRequest -UseBasicParsing -Uri 'https://www.fully-kiosk.com/docs/en/getting-started/downloads' -TimeoutSec 60
                $match = [regex]::Match($page.Content, 'https://www\.fully-kiosk\.com/files/[0-9]{4}/[0-9]{2}/Fully-Kiosk-Browser-v[0-9.]+\.apk')
                if (-not $match.Success) { throw 'Offizieller APK-Link nicht gefunden. -FullyApkPath mit heruntergeladener regulaerer APK verwenden.' }
                $ApkPath = Join-Path $downloadDir 'Fully-Kiosk-Browser.apk'
                Write-Host "Offizieller Download: $($match.Value)"
                Invoke-WebRequest -UseBasicParsing -Uri $match.Value -OutFile $ApkPath -TimeoutSec 180
            } finally { [Net.ServicePointManager]::SecurityProtocol = $previousTls }
        }
        $ApkPath = (Resolve-Path -LiteralPath $ApkPath).Path
        Write-Host 'Fully installieren/aktualisieren (bestehende App-Daten bleiben erhalten) ...'
        $install = Invoke-Device -Arguments @('install', '-r', $ApkPath)
        if ($install -notmatch '(?m)^Success\s*$') { throw "Installation nicht bestaetigt: $install" }
        $after = Invoke-Device -Arguments @('shell', 'dumpsys', 'package', $package)
        $afterVersion = [regex]::Match($after, 'versionName=([^\s]+)').Groups[1].Value
        if (-not $afterVersion) { throw 'Regulaere Fully-App nach Installation nicht gefunden. APK-Edition pruefen.' }
        Write-Host "Fully jetzt: $afterVersion"
    }

    # File import needs storage access. No camera, microphone, admin, or accessibility grants.
    $sdk = [int](Invoke-Device -Arguments @('shell', 'getprop', 'ro.build.version.sdk')).Trim()
    if ($sdk -ge 30) {
        Invoke-Device -Arguments @('shell', 'appops', 'set', '--uid', $package, 'MANAGE_EXTERNAL_STORAGE', 'allow') | Out-Null
        $access = Invoke-Device -Arguments @('shell', 'appops', 'get', '--uid', $package, 'MANAGE_EXTERNAL_STORAGE')
        if ($access -notmatch 'allow') { throw 'Speicherzugriff nicht erteilt. In Android Alle Dateien verwalten fuer Fully zulassen.' }
    } elseif ($sdk -ge 23) {
        foreach ($permission in @('android.permission.READ_EXTERNAL_STORAGE', 'android.permission.WRITE_EXTERNAL_STORAGE')) {
            Invoke-Device -Arguments @('shell', 'pm', 'grant', $package, $permission) | Out-Null
        }
    }
    Invoke-Device -Arguments @('shell', 'am', 'force-stop', $package) | Out-Null
    Invoke-Device -Arguments @('push', $importPath, '/sdcard/fully-once-settings.json') | Write-Host
    $start = Invoke-Device -Arguments @('shell', 'am', 'start', '-W', '-n', 'de.ozerov.fully/.MainActivity')
    if ($start -match 'Error:|Exception') { throw "Fully konnte nicht gestartet werden: $start" }
    Write-Host 'Warte auf einmaligen Einstellungsimport; eventuell Dialoge am Tablet bestaetigen ...'
    $imported = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        $pending = Invoke-Device -Arguments @('shell', 'if [ -e /sdcard/fully-once-settings.json ]; then echo PENDING; else echo CONSUMED; fi')
        if ($pending.Trim() -eq 'CONSUMED') { $imported = $true; break }
        Start-Sleep -Seconds 2
    }
    if (-not $imported) {
        throw 'Fully-Import noch offen. Speicherzugriff und Other Settings > Enable Settings Auto-Import pruefen, Fully neu starten. Alternativ die bereitgestellte JSON-Datei in Fully manuell importieren. Nicht als abgeschlossen werten.'
    }
    Write-Host "Fully hat die Importdatei verarbeitet. Darstellung: $Layout" -ForegroundColor Green
    if (-not $LayoutOnly) { Write-Host "Dashboard: $($settings.startURL)" }
    Write-Host 'Falls die HA-Anmeldeseite erscheint: direkt am Tablet anmelden. PLUS-Funktionen benoetigen eine eigene Lizenz.'
} finally {
    Remove-Item -LiteralPath $importPath -Force
}
