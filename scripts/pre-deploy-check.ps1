$ErrorActionPreference = "Stop"

$repositoryRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repositoryRoot

$errors = [System.Collections.Generic.List[string]]::new()
$warnings = [System.Collections.Generic.List[string]]::new()

function Test-RequiredPath {
    param(
        [string]$Path,
        [string]$Description
    )

    if (Test-Path -LiteralPath $Path) {
        Write-Host "[OK] $Description" -ForegroundColor Green
    } else {
        $errors.Add("Missing $Description ($Path)")
        Write-Host "[ERROR] Missing $Description" -ForegroundColor Red
    }
}

Write-Host "BH-EDU pre-deployment structure check" -ForegroundColor Cyan

Test-RequiredPath "web/package.json" "web package manifest"
Test-RequiredPath "web/package-lock.json" "npm lockfile"
Test-RequiredPath "web/.env.example" "environment template"
Test-RequiredPath "supabase/config.toml" "Supabase configuration"
Test-RequiredPath ".github/workflows/ci.yml" "CI workflow"
Test-RequiredPath "web/scripts/audit-production.mjs" "production security audit"
Test-RequiredPath "docs/deployment/DEPLOYMENT_GUIDE.md" "deployment guide"
Test-RequiredPath "docs/deployment/PRODUCTION_HARDENING.md" "production hardening guide"

$migrations = @(Get-ChildItem -LiteralPath "supabase/migrations" -Filter "*.sql" -File)
if ($migrations.Count -eq 0) {
    $errors.Add("No Supabase migrations found")
    Write-Host "[ERROR] No Supabase migrations found" -ForegroundColor Red
} else {
    Write-Host "[OK] Found $($migrations.Count) Supabase migrations" -ForegroundColor Green
}

if (Test-Path -LiteralPath "web/.env.local") {
    $warnings.Add("web/.env.local exists; confirm it remains ignored and is never staged")
}

$gitStatus = git status --porcelain
if ($gitStatus) {
    $warnings.Add("Working tree contains uncommitted changes")
}

foreach ($warning in $warnings) {
    Write-Host "[WARNING] $warning" -ForegroundColor Yellow
}

if ($errors.Count -gt 0) {
    Write-Host "Pre-deployment structure check failed with $($errors.Count) error(s)." -ForegroundColor Red
    exit 1
}

Write-Host "Structure check passed." -ForegroundColor Green
Write-Host "Before deployment, run these commands from web:" -ForegroundColor Cyan
Write-Host "  npm ci"
Write-Host "  npm run typecheck"
Write-Host "  npm run lint"
Write-Host "  npm test -- --runInBand"
Write-Host "  npm run build"
Write-Host "  npm run security:audit"
