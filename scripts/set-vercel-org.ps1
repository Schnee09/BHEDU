# set-vercel-org.ps1
# Interactive script to fetch Vercel org (team) id and optionally set GitHub repo secret VERCEL_ORG_ID
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\set-vercel-org.ps1

param()

Write-Host "This script will fetch your Vercel org (team) id and optionally set the GitHub Actions secret VERCEL_ORG_ID for repo 'Schnee09/BHEDU'."
Write-Host "You will be prompted for a Vercel Personal Token. Do NOT paste tokens into chat. Run this script locally."

# --- Prompt for Vercel token ---
$vercelToken = Read-Host "Paste your Vercel personal token (input hidden)" -AsSecureString
if (-not $vercelToken) {
  Write-Host "No token provided. Exiting." -ForegroundColor Red
  exit 1
}
$vercelTokenPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($vercelToken))
$headers = @{ Authorization = "Bearer $vercelTokenPlain" }

# --- Try to list teams ---
Write-Host "Querying Vercel teams..."
$teams = $null
try {
  $teams = Invoke-RestMethod -Uri "https://api.vercel.com/v1/teams" -Headers $headers -Method Get -ErrorAction Stop
} catch {
  Write-Host "Warning: Could not list teams (personal account or insufficient token permissions). Will offer a project-id fallback." -ForegroundColor Yellow
}

$orgId = $null

if ($teams -and $teams.Count -gt 0) {
  Write-Host "`nFound the following teams/orgs:" -ForegroundColor Cyan
  $i = 0
  foreach ($t in $teams) {
    $i++
    Write-Host "[$i] $($t.name)  id=$($t.id)  slug=$($t.slug)"
  }
  $sel = Read-Host "Enter the number of the organization to use (or press Enter to skip)"
  if ($sel -and ($sel -as [int]) -ge 1 -and ($sel -as [int]) -le $teams.Count) {
    $orgId = $teams[($sel -as [int]) - 1].id
  } else {
    Write-Host "No selection. Falling back to project inspection (if you provide a project id)." -ForegroundColor Yellow
  }
}

if (-not $orgId) {
  $proj = Read-Host "If you know the Vercel project id (e.g. prj_xxx) paste it now (or press Enter to skip)"
  if ($proj) {
    Write-Host "Fetching project info..."
    try {
      $projInfo = Invoke-RestMethod -Uri "https://api.vercel.com/v1/projects/$proj" -Headers $headers -Method Get -ErrorAction Stop
      if ($projInfo.teamId) { $orgId = $projInfo.teamId }
      elseif ($projInfo.team) { $orgId = $projInfo.team.id }
      elseif ($projInfo.owner) { $orgId = $projInfo.owner.id }
      else { $orgId = $null }
    } catch {
      Write-Host "Failed to fetch project info: $($_.Exception.Message)" -ForegroundColor Red
    }
  }
}

if (-not $orgId) {
  Write-Host "`nCould not determine an org id automatically." -ForegroundColor Red
  Write-Host "Options: 1) Use the Vercel dashboard to find org/team id, or 2) re-run and provide a valid project id when prompted." -ForegroundColor Yellow
  exit 1
}

Write-Host "`nFound Vercel org id:`n$orgId`n" -ForegroundColor Green

# --- Optionally set GitHub secret via gh CLI ---
$repo = "Schnee09/BHEDU"
$useGh = $false
try {
  if (Get-Command gh -ErrorAction SilentlyContinue) { $useGh = $true }
} catch {}

if ($useGh) {
  Write-Host "Detected GitHub CLI (gh). Will set repo secret $repo -> VERCEL_ORG_ID." -ForegroundColor Cyan
  $confirm = Read-Host "Proceed to set secret on repo $repo using gh? (y/N)"
  if ($confirm -match '^[Yy]') {
    gh secret set VERCEL_ORG_ID --body $orgId --repo $repo
    if ($LASTEXITCODE -eq 0) {
      Write-Host "Successfully set VERCEL_ORG_ID in $repo." -ForegroundColor Green
    } else {
      Write-Host "gh secret set exited with code $LASTEXITCODE. You may need to run 'gh auth login' first." -ForegroundColor Yellow
    }
  } else {
    Write-Host "Skipped setting secret. The org id is:`n$orgId" -ForegroundColor Yellow
  }
} else {
  Write-Host "GitHub CLI (gh) not found. Please add the secret manually in GitHub UI." -ForegroundColor Yellow
  Write-Host "Repo: $repo" -ForegroundColor Cyan
  Write-Host "Secret name: VERCEL_ORG_ID" -ForegroundColor Cyan
  Write-Host "Value: $orgId" -ForegroundColor Green
}

# Clean up plaintext token variable in memory
$vercelTokenPlain = $null
[GC]::Collect(); [GC]::WaitForPendingFinalizers()

Write-Host "Done." -ForegroundColor Green
