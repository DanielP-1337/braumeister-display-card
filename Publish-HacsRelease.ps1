[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$repoName = 'DanielP-1337/braumeister-display-card'
function Invoke-Checked {
    param([string]$Program, [string[]]$Arguments)
    & $Program @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Program failed (exit $LASTEXITCODE)." }
}
Push-Location $PSScriptRoot
try {
    Invoke-Checked 'node' @('test.cjs')
    Invoke-Checked 'node' @('test-i18n.cjs')
    Invoke-Checked 'node' @('scripts/build.cjs')
    Invoke-Checked 'node' @('test-bundle.cjs')
    Invoke-Checked 'node' @('test-lighting.cjs')
    Invoke-Checked 'git' @('diff', '--exit-code')
    $dirty = & git status --porcelain
    if ($LASTEXITCODE -ne 0 -or $dirty) { throw 'Commit or move untracked/modified files before publishing.' }
    $branch = & git branch --show-current
    if ($LASTEXITCODE -ne 0 -or $branch.Trim() -ne 'main') { throw 'Switch to main first.' }
    $remote = & git remote get-url origin
    if ($LASTEXITCODE -ne 0 -or $remote -notmatch '^https://github\.com/DanielP-1337/braumeister-display-card(\.git)?/?$|^git@github\.com:DanielP-1337/braumeister-display-card(\.git)?$') { throw 'Unexpected origin repository.' }
    Invoke-Checked 'gh' @('repo','edit',$repoName,'--enable-issues','--add-topic','home-assistant','--add-topic','hacs','--add-topic','lovelace','--add-topic','braumeister')
    Invoke-Checked 'git' @('push','origin','main')
    $sha = (& git rev-parse HEAD).Trim()
    if ($LASTEXITCODE -ne 0) { throw 'Cannot determine commit.' }
    $run = $null
    for ($attempt=0; $attempt -lt 30; $attempt++) {
        $runsJson = & gh run list --repo $repoName --workflow validate.yml --commit $sha --event push --json databaseId --limit 1
        if ($LASTEXITCODE -ne 0) { throw 'Cannot query validation workflow.' }
        $runs = @($runsJson | ConvertFrom-Json)
        if ($runs.Count -gt 0) { $run = $runs[0].databaseId; break }
        Start-Sleep -Seconds 2
    }
    if (-not $run) { throw 'No validation run found. Check GitHub Actions before retrying.' }
    Invoke-Checked 'gh' @('run','watch',"$run",'--repo',$repoName,'--exit-status')
    Invoke-Checked 'gh' @('release','create','v0.6.0','dist/braumeister-display-card.js','--repo',$repoName,'--target',$sha,'--title','Braumeister Display Card 0.6.0','--notes-file','RELEASE-NOTES.md','--latest')
    Invoke-Checked 'gh' @('release','view','v0.6.0','--repo',$repoName,'--json','url,tagName,assets')
}
finally { Pop-Location }
