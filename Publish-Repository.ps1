[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$repoName = 'DanielP-1337/braumeister-display-card'
function Invoke-Checked {
    param([string]$Program, [string[]]$Arguments)
    & $Program @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Program failed (exit $LASTEXITCODE). Publication stopped." }
}
Push-Location $PSScriptRoot
try {
    foreach ($tool in @('git', 'gh', 'node')) {
        if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
            throw "Required command missing: $tool"
        }
    }
    Invoke-Checked 'gh' @('auth', 'status')
    $login = & gh api user --jq .login
    if ($LASTEXITCODE -ne 0 -or $login.Trim() -ne 'DanielP-1337') {
        throw 'Please select your DanielP-1337 GitHub CLI account first.'
    }
    Invoke-Checked 'node' @('--check', 'braumeister-display-card.js')
    Invoke-Checked 'node' @('test.cjs')
    Invoke-Checked 'node' @('test-i18n.cjs')
    if (Test-Path -LiteralPath '.git') {
        throw 'This folder already has a Git repository. Inspect its status before publishing manually.'
    }
    Invoke-Checked 'git' @('init', '-b', 'main')
    Invoke-Checked 'git' @('add', '.')
    Invoke-Checked 'git' @('commit', '-m', 'feat: extract standalone Braumeister display card 0.4.2', '-m', 'Assisted-by: ChatGPT6-Astra')
    Invoke-Checked 'gh' @('repo', 'create', $repoName, '--public', '--source', '.', '--remote', 'origin', '--push', '--description', 'Multilingual Home Assistant display card for the Speidel Braumeister')
    Invoke-Checked 'gh' @('repo', 'view', $repoName, '--json', 'url,isPrivate,defaultBranchRef')
    Write-Host 'Repository created and pushed. Home Assistant was not modified.' -ForegroundColor Green
}
finally { Pop-Location }
