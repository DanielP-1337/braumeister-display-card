#Requires -Version 5.1
# Simulated ADB workflow. No device access or network requests.
$ErrorActionPreference = 'Stop'
$sourceRoot = Split-Path -Parent $PSScriptRoot
$fixture = Join-Path ([IO.Path]::GetTempPath()) ('fully-test-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path (Join-Path $fixture 'scripts') -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $sourceRoot 'scripts/Setup-Fully.ps1') -Destination (Join-Path $fixture 'scripts')
Copy-Item -LiteralPath (Join-Path $sourceRoot 'fully-ha-settings.json') -Destination $fixture
$apk = Join-Path $fixture 'test.apk'
New-Item -ItemType File -Path $apk | Out-Null
$env:FULLY_TEST_LOG = Join-Path $fixture 'commands.log'
$env:FULLY_TEST_IMPORT = Join-Path $fixture 'import.json'
$mock = Join-Path $fixture 'adb-mock.ps1'
@'
$global:LASTEXITCODE = 0
if ($args[0] -ne '-s' -or $args[1] -ne 'TEST123') { throw 'Wrong device' }
$commandArgs = @($args | Select-Object -Skip 2)
$command = $commandArgs -join ' '
Add-Content -LiteralPath $env:FULLY_TEST_LOG -Value $command
switch -Regex ($command) {
    '^shell if \[ -e .*EXISTS' {
        if ($env:FULLY_TEST_CASE -eq 'conflict') { 'EXISTS' } else { 'ABSENT' }
    }
    '^shell if \[ -e .*PENDING' { 'CONSUMED' }
    'shell dumpsys package de.ozerov.fully' {
        if ($env:FULLY_TEST_CASE -ne 'missing_app') { 'versionName=1.61.4' }
    }
    '^install -r ' {
        if ($env:FULLY_TEST_CASE -eq 'install_failure') { $global:LASTEXITCODE = 1; 'Failure' } else { 'Success' }
    }
    'shell getprop ro.build.version.sdk' { '36' }
    'shell appops set --uid de.ozerov.fully MANAGE_EXTERNAL_STORAGE allow' { }
    'shell appops get --uid de.ozerov.fully MANAGE_EXTERNAL_STORAGE' {
        if ($env:FULLY_TEST_CASE -eq 'permission_failure') { 'default' } else { 'allow' }
    }
    'shell am force-stop de.ozerov.fully' { }
    '^push ' {
        if ($commandArgs[2] -ne '/sdcard/fully-once-settings.json') { throw 'Wrong import path' }
        Copy-Item -LiteralPath $commandArgs[1] -Destination $env:FULLY_TEST_IMPORT -Force
        Set-Content -LiteralPath ($env:FULLY_TEST_IMPORT + '.path') -Value $commandArgs[1]
    }
    'shell am start -W -n de.ozerov.fully/.MainActivity' { 'Status: ok' }
    default { throw "Unexpected ADB command: $command" }
}
'@ | Set-Content -LiteralPath $mock -Encoding UTF8
function Run-Import {
    param([string]$Layout, [switch]$OnlyLayout)
    Set-Content -LiteralPath $env:FULLY_TEST_LOG -Value ''
    $options = @{ Adb = $mock; Serial = 'TEST123'; Layout = $Layout; LayoutOnly = $OnlyLayout }
    if (-not $OnlyLayout) { $options.ApkPath = $apk }
    & (Join-Path $fixture 'scripts/Setup-Fully.ps1') @options 6>$null
}
$original = Get-Content -LiteralPath (Join-Path $fixture 'fully-ha-settings.json') -Raw | ConvertFrom-Json
foreach ($layout in @('compact', 'fullscreen')) {
    foreach ($onlyLayout in @($false, $true)) {
        Run-Import -Layout $layout -OnlyLayout:$onlyLayout
        $imported = Get-Content -LiteralPath $env:FULLY_TEST_IMPORT -Raw | ConvertFrom-Json
        $expectedCode = $original.injectJsCode.Replace("const layout = 'compact';", "const layout = '$layout';")
        if ($imported.injectJsCode -cne $expectedCode) { throw 'Wrong layout JavaScript imported' }
        $log = Get-Content -LiteralPath $env:FULLY_TEST_LOG -Raw
        if ($onlyLayout) {
            if (@($imported.PSObject.Properties).Count -ne 1 -or $log -match '(?m)^install ') { throw 'Layout-only import changed unrelated settings/app' }
        } else {
            foreach ($property in $original.PSObject.Properties) {
                if ($property.Name -ne 'injectJsCode' -and $imported.($property.Name) -cne $property.Value) { throw "Setting changed: $($property.Name)" }
            }
            if ($log -notmatch '(?m)^install -r ') { throw 'App not installed in setup mode' }
        }
        $tempPath = (Get-Content -LiteralPath ($env:FULLY_TEST_IMPORT + '.path') -Raw).Trim()
        if (Test-Path -LiteralPath $tempPath) { throw 'Temporary import not removed' }
    }
}
foreach ($scenario in @('conflict', 'install_failure', 'permission_failure', 'missing_app')) {
    $env:FULLY_TEST_CASE = $scenario
    $failed = $false
    try { Run-Import -Layout compact -OnlyLayout:($scenario -eq 'missing_app') } catch { $failed = $true }
    if (-not $failed) { throw "Unexpected success: $scenario" }
    if ((Get-Content -LiteralPath $env:FULLY_TEST_LOG -Raw) -match '(?m)^push ') { throw 'Imported settings after failed preflight' }
}
Remove-Item Env:FULLY_TEST_CASE
Write-Output "PASS: PowerShell setup/layout-only, both layouts, JSON contents, cleanup, failures. Fixtures: $fixture"
