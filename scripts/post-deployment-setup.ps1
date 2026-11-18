param(
    [string]$DeploymentUrl = $env:VERCEL_URL
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($DeploymentUrl)) {
    $DeploymentUrl = Read-Host "Enter the deployed application URL"
}

if ([string]::IsNullOrWhiteSpace($DeploymentUrl)) {
    Write-Error "A deployment URL is required."
    exit 1
}

$DeploymentUrl = $DeploymentUrl.TrimEnd('/')

Write-Host "Checking deployment: $DeploymentUrl" -ForegroundColor Cyan

try {
    $healthResponse = Invoke-WebRequest -Uri "$DeploymentUrl/api/health" -UseBasicParsing
    if ($healthResponse.StatusCode -ne 200) {
        Write-Error "Health check returned HTTP $($healthResponse.StatusCode)."
        exit 1
    }
    Write-Host "Health check passed." -ForegroundColor Green
} catch {
    Write-Error "Health check failed: $($_.Exception.Message)"
    exit 1
}

Write-Host ""
Write-Host "Post-deployment checks complete." -ForegroundColor Green
Write-Host "Application: $DeploymentUrl"
Write-Host "Login:       $DeploymentUrl/login"
Write-Host "Health:      $DeploymentUrl/api/health"
Write-Host ""
Write-Host "Create and manage accounts from the authenticated admin interface."
