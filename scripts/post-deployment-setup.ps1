# Post-Deployment Setup Script for BH-EDU
# Run this after deploying to Vercel

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 BH-EDU Post-Deployment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get Vercel URL
Write-Host "📍 Step 1: Enter your Vercel deployment URL" -ForegroundColor Yellow
Write-Host "   Example: https://bhedu-abc123.vercel.app" -ForegroundColor Gray
$VERCEL_URL = Read-Host "   Enter URL"

if ([string]::IsNullOrWhiteSpace($VERCEL_URL)) {
    Write-Host "❌ Error: Vercel URL is required!" -ForegroundColor Red
    exit 1
}

# Remove trailing slash if present
$VERCEL_URL = $VERCEL_URL.TrimEnd('/')

Write-Host "✅ Using URL: $VERCEL_URL" -ForegroundColor Green
Write-Host ""

# Step 2: Test Health Endpoint
Write-Host "📍 Step 2: Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "$VERCEL_URL/api/health" -Method GET -UseBasicParsing
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "✅ Health endpoint is working!" -ForegroundColor Green
        Write-Host "   Response: $($healthResponse.Content)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Unexpected status: $($healthResponse.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Health endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Make sure your deployment is complete and accessible." -ForegroundColor Gray
}
Write-Host ""

# Step 3: Check if INTERNAL_API_KEY is set
Write-Host "📍 Step 3: Checking INTERNAL_API_KEY..." -ForegroundColor Yellow
$envPath = "backend\.env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    if ($envContent -match "INTERNAL_API_KEY=([^\s]+)") {
        $apiKey = $matches[1]
        if ($apiKey -ne "changeme-generate-secure-key-here" -and $apiKey.Length -ge 32) {
            Write-Host "✅ INTERNAL_API_KEY is configured" -ForegroundColor Green
            $env:INTERNAL_API_KEY = $apiKey
        } else {
            Write-Host "⚠️  INTERNAL_API_KEY needs to be updated with a secure key" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "⚠️  backend\.env file not found" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Create Admin User
Write-Host "📍 Step 4: Create Admin User" -ForegroundColor Yellow
Write-Host "   You need to create an admin user to access the system." -ForegroundColor Gray
Write-Host ""
Write-Host "   Option A: Sign up via web interface" -ForegroundColor Cyan
Write-Host "   1. Go to: $VERCEL_URL/signup" -ForegroundColor Gray
Write-Host "   2. Create an account with your email" -ForegroundColor Gray
Write-Host "   3. Copy the User ID from Supabase Dashboard > Authentication > Users" -ForegroundColor Gray
Write-Host ""
Write-Host "   Option B: Use Supabase SQL Editor" -ForegroundColor Cyan
Write-Host "   1. Go to: https://supabase.com/dashboard/project/mwncwhkdimnjovxzhtjm/sql/new" -ForegroundColor Gray
Write-Host "   2. Run this SQL (replace with your email and user ID):" -ForegroundColor Gray
Write-Host ""
Write-Host "   -- First, sign up a user at $VERCEL_URL/signup" -ForegroundColor DarkGray
Write-Host "   -- Then update their role to admin:" -ForegroundColor DarkGray
Write-Host "   UPDATE profiles" -ForegroundColor White
Write-Host "   SET role = 'admin'" -ForegroundColor White
Write-Host "   WHERE email = 'your-email@example.com';" -ForegroundColor White
Write-Host ""
$createAdmin = Read-Host "   Have you created an admin user? (y/n)"
if ($createAdmin -eq 'y') {
    Write-Host "✅ Admin user creation confirmed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Don't forget to create an admin user!" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Run Production Tests
Write-Host "📍 Step 5: Run Production Tests" -ForegroundColor Yellow
Write-Host "   Would you like to run the production test suite?" -ForegroundColor Gray
$runTests = Read-Host "   Run tests now? (y/n)"

if ($runTests -eq 'y') {
    Write-Host ""
    Write-Host "🧪 Running production tests..." -ForegroundColor Cyan
    $env:BASE_URL = $VERCEL_URL
    
    if ($env:INTERNAL_API_KEY) {
        node web\scripts\production-test.mjs
    } else {
        Write-Host "⚠️  INTERNAL_API_KEY not set. Cannot run authenticated tests." -ForegroundColor Yellow
        Write-Host "   Set the environment variable and run manually:" -ForegroundColor Gray
        Write-Host "   `$env:BASE_URL='$VERCEL_URL'" -ForegroundColor White
        Write-Host "   `$env:INTERNAL_API_KEY='your-key-here'" -ForegroundColor White
        Write-Host "   node web\scripts\production-test.mjs" -ForegroundColor White
    }
} else {
    Write-Host "   You can run tests later with:" -ForegroundColor Gray
    Write-Host "   `$env:BASE_URL='$VERCEL_URL'" -ForegroundColor White
    Write-Host "   `$env:INTERNAL_API_KEY='your-key-here'" -ForegroundColor White
    Write-Host "   node web\scripts\production-test.mjs" -ForegroundColor White
}
Write-Host ""

# Step 6: Deployment Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Post-Deployment Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Quick Reference:" -ForegroundColor Yellow
Write-Host "   • App URL: $VERCEL_URL" -ForegroundColor White
Write-Host "   • Login: $VERCEL_URL/login" -ForegroundColor White
Write-Host "   • Signup: $VERCEL_URL/signup" -ForegroundColor White
Write-Host "   • Health: $VERCEL_URL/api/health" -ForegroundColor White
Write-Host "   • Supabase: https://supabase.com/dashboard/project/mwncwhkdimnjovxzhtjm" -ForegroundColor White
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Test login with your admin account" -ForegroundColor White
Write-Host "   2. Create test students and teachers" -ForegroundColor White
Write-Host "   3. Monitor Vercel logs for any errors" -ForegroundColor White
Write-Host "   4. Set up monitoring/alerts if needed" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Your application is ready for production use!" -ForegroundColor Green
Write-Host ""
