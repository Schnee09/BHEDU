@echo off
REM ##############################################
REM Student CRUD Migration Application Script
REM Applies migrations 044, 045, 046 to Supabase
REM ##############################################

echo.
echo ========================================
echo Student CRUD Database Migration Script
echo ========================================
echo.

REM Check if supabase CLI is installed
where supabase >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Supabase CLI not found!
    echo.
    echo Please install it first:
    echo   npm install -g supabase
    echo.
    echo Or apply migrations manually via Supabase Dashboard
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "supabase\migrations" (
    echo [ERROR] supabase\migrations directory not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

echo [OK] Found migrations directory
echo.

REM Check if migration files exist
set MIGRATION_044=supabase\migrations\044_student_management_schema.sql
set MIGRATION_045=supabase\migrations\045_student_management_rls.sql
set MIGRATION_046=supabase\migrations\046_student_management_functions.sql

if not exist "%MIGRATION_044%" (
    echo [ERROR] Missing: %MIGRATION_044%
    pause
    exit /b 1
)

if not exist "%MIGRATION_045%" (
    echo [ERROR] Missing: %MIGRATION_045%
    pause
    exit /b 1
)

if not exist "%MIGRATION_046%" (
    echo [ERROR] Missing: %MIGRATION_046%
    pause
    exit /b 1
)

echo [OK] All migration files found
echo.

REM Check if linked to Supabase project
echo Checking Supabase project link...
supabase status >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Not linked to a Supabase project
    echo.
    set /p PROJECT_REF="Enter your Supabase project ref (or 'skip' to apply manually): "
    
    if /i "%PROJECT_REF%"=="skip" (
        echo.
        echo Manual application steps:
        echo.
        echo 1. Go to your Supabase Dashboard
        echo 2. Navigate to SQL Editor
        echo 3. Apply these files in order:
        echo    - %MIGRATION_044%
        echo    - %MIGRATION_045%
        echo    - %MIGRATION_046%
        echo.
        pause
        exit /b 0
    )
    
    echo Linking to project...
    supabase link --project-ref %PROJECT_REF%
)

echo [OK] Project linked
echo.

REM Confirm before applying
echo About to apply the following migrations:
echo   1. 044_student_management_schema.sql   (Schema enhancements)
echo   2. 045_student_management_rls.sql      (RLS policies)
echo   3. 046_student_management_functions.sql (Helper functions)
echo.
set /p CONFIRM="Continue? (y/n): "

if /i not "%CONFIRM%"=="y" (
    echo [ABORTED]
    pause
    exit /b 0
)

echo.
echo Applying migrations...
echo.

REM Apply migrations
echo Applying 044_student_management_schema.sql...
supabase db push --include-all

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Migration failed!
    echo Check the error message above
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Migrations applied successfully!
echo.

REM Verify migrations
echo Verifying migrations...
echo.

supabase db remote list

echo.
echo ==========================================
echo Student CRUD database setup complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Verify in Supabase Dashboard - Database - Tables
echo 2. Check that profiles table has new columns
echo 3. Test the API endpoints
echo.
echo See README_STUDENT_MIGRATIONS.md for verification queries
echo.
pause
