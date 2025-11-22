@echo off
REM ==============================================================================
REM Clean Setup Script for BH-EDU Supabase Database
REM ==============================================================================
echo.
echo ========================================
echo BH-EDU Database Clean Setup
echo ========================================
echo.

REM Check if Supabase CLI is available
where supabase >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Supabase CLI not found!
    echo Please install: npm install -g supabase
    exit /b 1
)

echo Step 1: Reset database (drop all tables)...
echo.
supabase db reset --db-url "%SUPABASE_DB_URL%"
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Reset failed. Continuing with direct SQL application...
)

echo.
echo Step 2: Apply schema from COMPLETE_STUDENT_MANAGEMENT.sql...
echo.
type "COMPLETE_STUDENT_MANAGEMENT.sql" | supabase db execute --db-url "%SUPABASE_DB_URL%"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Schema application failed!
    echo Please apply COMPLETE_STUDENT_MANAGEMENT.sql manually via Supabase dashboard.
    pause
    exit /b 1
)

echo.
echo Step 3: Seed reference data from COMPLETE_TEST_SEED.sql...
echo.
type "COMPLETE_TEST_SEED.sql" | supabase db execute --db-url "%SUPABASE_DB_URL%"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Seed failed!
    echo Please apply COMPLETE_TEST_SEED.sql manually via Supabase dashboard.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ Database setup complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run: node ..\backend\seed_supabase_auth.js
echo    OR: pnpm tsx ..\web\scripts\seed.ts
echo 2. Create test users and link profiles
echo 3. Test API endpoints
echo.
pause
