# Pre-Deployment Verification Script
# Run this before deploying to catch any issues early

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BH-EDU Pre-Deployment Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()

# Check 1: Verify we're in the right directory
Write-Host "[1/8] Checking directory..." -ForegroundColor Yellow
if (Test-Path "web/package.json") {
    Write-Host "  ✓ Found web/package.json" -ForegroundColor Green
} else {
    $errors += "Not in project root (web/package.json not found)"
}

# Check 2: Verify migrations exist
Write-Host "[2/8] Checking migrations..." -ForegroundColor Yellow
$migrations = @(
    "001_schema.sql",
    "002_rls_policies.sql", 
    "003_rpc_get_student_metrics.sql",
    "004_courses_lessons_schema.sql",
    "005_courses_lessons_rls.sql",
    "006_fix_rls_circular_dependency.sql",
    "007_rls_security_definer_functions.sql",
    "008_users_compat_view.sql",
    "009_users_view_add_email.sql",
    "010_add_performance_indexes.sql",
    "011_audit_logs.sql"
)

$migrationCount = 0
foreach ($migration in $migrations) {
    if (Test-Path "supabase/migrations/$migration") {
        $migrationCount++
    } else {
        $errors += "Missing migration: $migration"
    }
}
Write-Host "  ✓ Found $migrationCount/11 migrations" -ForegroundColor Green

# Check 3: Verify example env file
Write-Host "[3/8] Checking environment templates..." -ForegroundColor Yellow
if (Test-Path "web/.env.local.example") {
    Write-Host "  ✓ Found web/.env.local.example" -ForegroundColor Green
} else {
    $warnings += "No .env.local.example file (not critical)"
}

# Check 4: Check if .env.local exists (should NOT be committed)
Write-Host "[4/8] Checking .env.local..." -ForegroundColor Yellow
if (Test-Path "web/.env.local") {
    $warnings += ".env.local exists locally (ensure it's in .gitignore)"
} else {
    Write-Host "  ✓ No .env.local file (will use Vercel env vars)" -ForegroundColor Green
}

# Check 5: Verify deployment docs
Write-Host "[5/8] Checking deployment documentation..." -ForegroundColor Yellow
$docs = @("DEPLOYMENT_GUIDE.md", "DEPLOYMENT_CHECKLIST.md", "PRODUCTION_HARDENING.md")
foreach ($doc in $docs) {
    if (Test-Path $doc) {
        Write-Host "  ✓ Found $doc" -ForegroundColor Green
    } else {
        $warnings += "Missing documentation: $doc"
    }
}

# Check 6: Verify GitHub workflow
Write-Host "[6/8] Checking GitHub Actions..." -ForegroundColor Yellow
if (Test-Path ".github/workflows/deploy-vercel.yml") {
    Write-Host "  ✓ Found deploy-vercel.yml workflow" -ForegroundColor Green
} else {
    $errors += "Missing .github/workflows/deploy-vercel.yml"
}

# Check 7: Check git status
Write-Host "[7/8] Checking git status..." -ForegroundColor Yellow
try {
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        $warnings += "Uncommitted changes detected. Consider committing before deploy."
        Write-Host "  ⚠ Uncommitted changes found" -ForegroundColor Yellow
    } else {
        Write-Host "  ✓ Working directory clean" -ForegroundColor Green
    }
} catch {
    $warnings += "Could not check git status"
}

# Check 8: Verify test scripts exist
Write-Host "[8/8] Checking test scripts..." -ForegroundColor Yellow
$scripts = @("web/scripts/hmac-request.mjs", "web/scripts/production-test.mjs")
foreach ($script in $scripts) {
    if (Test-Path $script) {
        Write-Host "  ✓ Found $script" -ForegroundColor Green
    } else {
        $warnings += "Missing test script: $script"
    }
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host ""
    Write-Host "✅ All checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You're ready to deploy!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Review DEPLOYMENT_CHECKLIST.md" -ForegroundColor White
    Write-Host "2. Apply Supabase migrations via Dashboard SQL Editor" -ForegroundColor White
    Write-Host "3. Deploy to Vercel (see DEPLOYMENT_GUIDE.md)" -ForegroundColor White
    Write-Host ""
} else {
    if ($errors.Count -gt 0) {
        Write-Host ""
        Write-Host "❌ ERRORS ($($errors.Count)):" -ForegroundColor Red
        foreach ($error in $errors) {
            Write-Host "  • $error" -ForegroundColor Red
        }
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host ""
        Write-Host "⚠️  WARNINGS ($($warnings.Count)):" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "  • $warning" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    if ($errors.Count -gt 0) {
        Write-Host "Please fix errors before deploying." -ForegroundColor Red
        exit 1
    } else {
        Write-Host "Warnings detected but you can proceed with deployment." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "For detailed deployment instructions, see:" -ForegroundColor Cyan
Write-Host "  • DEPLOYMENT_GUIDE.md (complete guide)" -ForegroundColor White
Write-Host "  • DEPLOYMENT_CHECKLIST.md (quick reference)" -ForegroundColor White
Write-Host ""
