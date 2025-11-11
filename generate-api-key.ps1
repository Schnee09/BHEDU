# Generate Internal API Key for HMAC Authentication
# Run this script to generate a secure random key for INTERNAL_API_KEY environment variable

Write-Host "Generating INTERNAL_API_KEY..." -ForegroundColor Cyan
Write-Host ""

$key = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

if ($key) {
    Write-Host "✅ Generated secure API key:" -ForegroundColor Green
    Write-Host ""
    Write-Host $key -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Copy this value and set it as INTERNAL_API_KEY in:" -ForegroundColor Cyan
    Write-Host "  • Vercel Dashboard → Project → Settings → Environment Variables" -ForegroundColor White
    Write-Host "  • Local .env.local file (for development)" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  KEEP THIS SECRET - Never commit it to git!" -ForegroundColor Red
    Write-Host ""
    
    # Copy to clipboard if possible
    try {
        $key | Set-Clipboard
        Write-Host "✓ Key copied to clipboard!" -ForegroundColor Green
    } catch {
        Write-Host "Note: Could not copy to clipboard automatically" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Failed to generate key. Ensure Node.js is installed." -ForegroundColor Red
    exit 1
}
