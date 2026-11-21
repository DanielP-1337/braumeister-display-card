#Requires -Version 5.1
<#
.SYNOPSIS
Richtet Android Platform Tools unter Windows ein und prueft ein Android-Tablet.
.EXAMPLE
.\Setup-Android-ADB.ps1
.EXAMPLE
.\Setup-Android-ADB.ps1 -InstallOnly
.EXAMPLE
.\Setup-Android-ADB.ps1 -Serial G000000000000000 -TimeoutSeconds 120
#>
[CmdletBinding()]
param(
    [string]$ToolsDirectory,
    [string]$Serial,
    [ValidateRange(0, 600)][int]$TimeoutSeconds = 90,
    [switch]$InstallOnly,
    [switch]$SetupFully,
    [switch]$BatteryProtection80,
    [string]$FullyApkPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
# Native stderr is diagnostic output, not a PowerShell exception.
if (Test-Path variable:PSNativeCommandUseErrorActionPreference) {
    $PSNativeCommandUseErrorActionPreference = $false
}

try {
    if ($InstallOnly -and ($SetupFully -or $BatteryProtection80)) { throw '-InstallOnly kann nicht mit Geraeteeinrichtung kombiniert werden.' }
    if ($FullyApkPath -and -not $SetupFully) { throw '-FullyApkPath benoetigt -SetupFully.' }
    if ($env:OS -ne 'Windows_NT') { throw 'Dieses Skript benoetigt Windows.' }
    if (-not $ToolsDirectory) {
        $ToolsDirectory = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'tools'
    }
    $ToolsDirectory = [IO.Path]::GetFullPath($ToolsDirectory)
    $platformDirectory = Join-Path $ToolsDirectory 'platform-tools'
    $adb = Join-Path $platformDirectory 'adb.exe'

    if (-not (Test-Path -LiteralPath $adb -PathType Leaf)) {
        if (Test-Path -LiteralPath $platformDirectory) {
            throw "Unvollstaendige Installation in $platformDirectory. Bitte einen anderen -ToolsDirectory angeben oder den Ordner manuell pruefen."
        }
        New-Item -ItemType Directory -Path $ToolsDirectory -Force | Out-Null
        $staging = Join-Path $ToolsDirectory ('adb-download-' + [guid]::NewGuid().ToString('N'))
        New-Item -ItemType Directory -Path $staging | Out-Null
        $zip = Join-Path $staging 'platform-tools.zip'
        Write-Host 'Lade Android Platform Tools von Google herunter ...'
        $previousTls = [Net.ServicePointManager]::SecurityProtocol
        try {
            [Net.ServicePointManager]::SecurityProtocol = $previousTls -bor [Net.SecurityProtocolType]::Tls12
            Invoke-WebRequest -Uri 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip' -OutFile $zip -UseBasicParsing -TimeoutSec 180
        } finally {
            [Net.ServicePointManager]::SecurityProtocol = $previousTls
        }
        Expand-Archive -LiteralPath $zip -DestinationPath $staging
        $extracted = Join-Path $staging 'platform-tools'
        foreach ($file in @('adb.exe', 'AdbWinApi.dll', 'AdbWinUsbApi.dll')) {
            if (-not (Test-Path -LiteralPath (Join-Path $extracted $file) -PathType Leaf)) {
                throw "Download unvollstaendig: $file fehlt. Download liegt in $staging."
            }
        }
        # Only move the newly created staging folder, never replace existing tools.
        Move-Item -LiteralPath $extracted -Destination $platformDirectory
        Write-Host "Downloadarchiv aufbewahrt: $zip"
    }

    & $adb version
    if ($LASTEXITCODE -ne 0) { throw 'adb.exe konnte nicht gestartet werden.' }
    Write-Host "ADB-Pfad: $adb"
    if ($InstallOnly) {
        Write-Host 'Platform Tools bereit. Geraetepruefung uebersprungen.'
        exit 0
    }

    Write-Host @'

Am Android-Tablet (Menues unterscheiden sich je nach Hersteller):
1. Einstellungen > Ueber das Tablet / Tablet-Info > Softwareinformationen oeffnen.
2. Buildnummer siebenmal antippen, falls Entwickleroptionen noch fehlen.
   Bei Amazon Fire: Geraeteoptionen > Ueber das Fire-Tablet > Seriennummer.
3. Unter Entwickleroptionen USB-Debugging / ADB aktivieren.
4. Mit einem USB-Datenkabel verbinden und das Tablet entsperren.
5. Den Dialog "USB-Debugging zulassen" fuer diesen Computer bestaetigen.

'@
    & $adb start-server
    if ($LASTEXITCODE -ne 0) { throw 'Der ADB-Server konnte nicht gestartet werden.' }
    $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
    $lastStatus = ''
    do {
        $lines = @(& $adb devices -l)
        if ($LASTEXITCODE -ne 0) { throw 'Die ADB-Geraeteliste konnte nicht gelesen werden.' }
        $devices = @(
            foreach ($line in $lines) {
                if ($line -match '^(\S+)\s+(device|unauthorized|offline|recovery|sideload|bootloader|no permissions)\b') {
                    [pscustomobject]@{ Serial = $Matches[1]; State = $Matches[2] }
                }
            }
        )
        if ($Serial) {
            $devices = @($devices | Where-Object { $_.Serial -ceq $Serial })
        }
        if ($devices.Count -gt 1) {
            $lines | ForEach-Object { Write-Host $_ }
            throw 'Mehrere Geraete gefunden. Erneut mit -Serial <Seriennummer> starten.'
        }
        if ($devices.Count -eq 1 -and $devices[0].State -eq 'device') {
            $target = $devices[0].Serial
            $manufacturer = @(& $adb -s $target shell getprop ro.product.manufacturer) -join ''
            if ($LASTEXITCODE -ne 0) { throw 'Hersteller konnte nicht gelesen werden.' }
            $model = @(& $adb -s $target shell getprop ro.product.model) -join ''
            if ($LASTEXITCODE -ne 0) { throw 'Modell konnte nicht gelesen werden.' }
            $manufacturer = $manufacturer.Trim()
            $model = $model.Trim()
            # Official mapping: https://developer.amazon.com/docs/device-specs/ft-identify-tablet-devices
            $modelName = "$manufacturer $model"
            if ($manufacturer -ieq 'Amazon' -and $model -eq 'KFTUWI') {
                $modelName = 'Amazon Fire HD 10 (2023, 13. Generation)'
            }
            # https://www.samsung.com/de/support/model/SM-X210NZAAEUB/
            if ($manufacturer -ieq 'Samsung' -and $model -eq 'SM-X210') {
                $modelName = 'Samsung Galaxy Tab A9+ (Wi-Fi)'
            }
            $versions = [ordered]@{}
            foreach ($property in @('ro.build.version.name', 'ro.build.version.release', 'ro.build.version.sdk', 'ro.build.display.id')) {
                $value = @(& $adb -s $target shell getprop $property) -join ''
                if ($LASTEXITCODE -ne 0) { throw "Systemeigenschaft $property konnte nicht gelesen werden." }
                $versions[$property] = $value.Trim()
            }
            $fireOs = $versions['ro.build.version.name']
            if ($fireOs -notmatch '^Fire OS\s') {
                $fireOs = 'Nicht vom Geraet gemeldet'
            }
            $android = $versions['ro.build.version.release']
            if (-not $android) { $android = 'Nicht vom Geraet gemeldet' }
            Write-Host "ADB-Verbindung erfolgreich: $manufacturer $model ($target)" -ForegroundColor Green
            Write-Host "Modell:          $modelName"
            Write-Host "Modellkennung:  $model"
            if ($manufacturer -ieq 'Amazon' -or $fireOs -match '^Fire OS\s') {
                Write-Host "Fire OS:        $fireOs"
            }
            Write-Host "Android:        $android"
            if ($versions['ro.build.version.sdk']) {
                Write-Host ("API-Level:      {0}" -f $versions['ro.build.version.sdk'])
            }
            if ($versions['ro.build.display.id']) {
                Write-Host ("Build-ID:       {0}" -f $versions['ro.build.display.id'])
            }
            $reportPath = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'Android-Geraeteinformationen.txt'
            $report = @(
                'ADB-Geraeteinformationen'
                ('Ausgelesen (UTC): {0}' -f [DateTime]::UtcNow.ToString('yyyy-MM-dd HH:mm:ss'))
                "Hersteller:      $manufacturer"
                "Modell:          $modelName"
                "Modellkennung:   $model"
                "Seriennummer:    $target"
                if ($manufacturer -ieq 'Amazon' -or $fireOs -match '^Fire OS\s') {
                    "Fire OS:         $fireOs"
                }
                "Android:         $android"
                ('API-Level:       {0}' -f $versions['ro.build.version.sdk'])
                ('Build-ID:        {0}' -f $versions['ro.build.display.id'])
            )
            $report | Set-Content -LiteralPath $reportPath -Encoding UTF8
            Write-Host "Geraeteinformationen gespeichert: $reportPath"
            if ($BatteryProtection80 -or $SetupFully) {
                $batteryResult = 'Akkuschutz 80 %: uebersprungen (keine unterstuetzte Samsung-Schnittstelle).'
                if ($manufacturer -ieq 'Samsung') {
                    $oldMode = @(& $adb -s $target shell settings get global protect_battery) -join ''
                    if ($LASTEXITCODE -ne 0) { throw 'Akkuschutz-Modus konnte nicht gelesen werden.' }
                    $oldLimit = @(& $adb -s $target shell settings get global battery_protection_threshold) -join ''
                    if ($LASTEXITCODE -ne 0) { throw 'Akkuschutz-Limit konnte nicht gelesen werden.' }
                    $batteryService = @(& $adb -s $target shell dumpsys battery) -join "`n"
                    if ($LASTEXITCODE -ne 0) { throw 'Akkudienst konnte nicht gelesen werden.' }
                    if ($oldMode.Trim() -match '^[0-4]$' -and $oldLimit.Trim() -match '^(80|85|90|95)$' -and $batteryService -match 'mMaximumProtectionThreshold:') {
                        & $adb -s $target shell settings put global protect_battery 1
                        if ($LASTEXITCODE -ne 0) { throw 'Akkuschutz konnte nicht aktiviert werden.' }
                        & $adb -s $target shell settings put global battery_protection_threshold 80
                        if ($LASTEXITCODE -ne 0) { throw 'Akkuschutz-Limit konnte nicht gesetzt werden.' }
                        Start-Sleep -Seconds 2
                        $mode = @(& $adb -s $target shell settings get global protect_battery) -join ''
                        if ($LASTEXITCODE -ne 0) { throw 'Akkuschutz-Pruefung fehlgeschlagen.' }
                        $limit = @(& $adb -s $target shell settings get global battery_protection_threshold) -join ''
                        if ($LASTEXITCODE -ne 0) { throw 'Akkuschutz-Pruefung fehlgeschlagen.' }
                        $batteryService = @(& $adb -s $target shell dumpsys battery) -join "`n"
                        if ($LASTEXITCODE -ne 0 -or $mode.Trim() -ne '1' -or $limit.Trim() -ne '80' -or $batteryService -notmatch '(?m)^\s*mProtectBatteryMode:\s*1\s*$' -or $batteryService -notmatch '(?m)^\s*mMaximumProtectionThreshold:\s*80\s*$') {
                            throw 'Akkuschutz geschrieben, aber nicht bestaetigt. Einstellungen > Akku > Akkuschutz am Tablet pruefen.'
                        }
                        $batteryResult = 'Akkuschutz: Maximum, 80 % (Einstellungen und Akkudienst bestaetigt).'
                    }
                }
                Write-Host $batteryResult
                Add-Content -LiteralPath $reportPath -Value $batteryResult -Encoding UTF8
            }
            if ($SetupFully) {
                & (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'scripts/Setup-Fully.ps1') -Adb $adb -Serial $target -ApkPath $FullyApkPath
            }
            Write-Host 'Weitere Befehle in PowerShell:'
            Write-Host ('& "{0}" -s "{1}" shell getprop ro.build.display.id' -f $adb, $target)
            exit 0
        }
        $status = if ($devices.Count -eq 0) { 'missing' } else { $devices[0].State }
        if ($status -ne $lastStatus) {
            switch ($status) {
                'missing' { Write-Host 'Kein passendes Geraet: Kabel, USB-Port und USB-Debugging pruefen.' }
                'unauthorized' { Write-Host 'Freigabe fehlt: Tablet entsperren und RSA-Dialog bestaetigen.' }
                'offline' { Write-Host 'Geraet offline: USB-Kabel neu verbinden.' }
                default { Write-Host "Geraetestatus: $status. Tablet normal starten." }
            }
            $lastStatus = $status
        }
        if ([DateTime]::UtcNow -ge $deadline) { break }
        Start-Sleep -Seconds 2
    } while ($true)

    throw @'
Keine einsatzbereite ADB-Verbindung innerhalb der Wartezeit.
USB-Datenkabel verwenden; bei Bedarf Dateiuebertragung (MTP) waehlen.
Bei fehlendem Windows-Treiber den passenden USB-Treiber des Tablet-Herstellers installieren.
Hinweise: https://developer.android.com/studio/run/oem-usb
Bei unauthorized: USB-Debugging-Autorisierungen am Tablet widerrufen und neu verbinden.
Danach dieses Skript erneut starten.
'@
} catch {
    Write-Error -Message $_.Exception.Message -ErrorAction Continue
    exit 1
}
