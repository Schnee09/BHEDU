# Fix Supabase Port Conflict - Run as Administrator
# This script temporarily stops Windows NAT to allow Supabase to start

Write-Host "=== Supabase Port Fix Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To run as admin:" -ForegroundColor Yellow
    Write-Host "1. Right-click PowerShell" -ForegroundColor Yellow
    Write-Host "2. Select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host "3. Navigate to: cd e:\TTGDBH\BH-EDU" -ForegroundColor Yellow
    Write-Host "4. Run: .\fix-supabase-port.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Running as Administrator" -ForegroundColor Green
Write-Host ""

# Step 1: Stop Windows NAT
Write-Host "Step 1: Stopping Windows NAT (WinNat)..." -ForegroundColor Cyan
try {
    net stop winnat
    Write-Host "✓ WinNat stopped successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠ Warning: Could not stop WinNat (it might not be running)" -ForegroundColor Yellow
}
Write-Host ""

# Step 2: Start Supabase
Write-Host "Step 2: Starting Supabase..." -ForegroundColor Cyan
Write-Host "This may take 30-60 seconds..." -ForegroundColor Gray
Write-Host ""

try {
    npx supabase start
    $supabaseStarted = $LASTEXITCODE -eq 0
} catch {
    $supabaseStarted = $false
}

Write-Host ""

# Step 3: Restart Windows NAT
Write-Host "Step 3: Restarting Windows NAT..." -ForegroundColor Cyan
try {
    net start winnat
    Write-Host "✓ WinNat restarted successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠ Warning: Could not restart WinNat" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "=== Summary ===" -ForegroundColor Cyan
if ($supabaseStarted) {
    Write-Host "✓ Supabase started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Apply migration: npx supabase db push" -ForegroundColor White
    Write-Host "2. Open Studio: http://localhost:54323" -ForegroundColor White
    Write-Host "3. Verify ENUMs and indexes were created" -ForegroundColor White
} else {
    Write-Host "✗ Supabase failed to start" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check Docker Desktop is running" -ForegroundColor White
    Write-Host "2. Try: npx supabase stop" -ForegroundColor White
    Write-Host "3. Then run this script again" -ForegroundColor White
}
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
