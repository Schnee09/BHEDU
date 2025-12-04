@echo off
REM ============================================================================
REM Deploy Refactored Pages Script
REM
REM This script backs up old pages and activates the modern refactored versions
REM Run this from: e:\TTGDBH\BH-EDU\web\
REM ============================================================================

echo ========================================
echo  Deploying Refactored Pages
echo ========================================
echo.

REM Check if we're in the correct directory
if not exist "app\dashboard\students\page-modern.tsx" (
    echo ERROR: Please run this script from the web\ directory
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo Creating backups...
echo.

REM ============================================================================
REM Students Page
REM ============================================================================
if exist "app\dashboard\students\page.tsx" (
    echo [1/4] Students Page
    move /Y "app\dashboard\students\page.tsx" "app\dashboard\students\page-old.tsx"
    move /Y "app\dashboard\students\page-modern.tsx" "app\dashboard\students\page.tsx"
    echo   ✓ Students page deployed
    echo.
) else (
    echo [1/4] Students Page - Original not found, deploying modern version
    move /Y "app\dashboard\students\page-modern.tsx" "app\dashboard\students\page.tsx"
    echo   ✓ Students page deployed
    echo.
)

REM ============================================================================
REM Grades Navigation Page
REM ============================================================================
if exist "app\dashboard\grades\page.tsx" (
    echo [2/4] Grades Navigation Page
    move /Y "app\dashboard\grades\page.tsx" "app\dashboard\grades\page-old.tsx"
    move /Y "app\dashboard\grades\page-modern.tsx" "app\dashboard\grades\page.tsx"
    echo   ✓ Grades navigation deployed
    echo.
) else (
    echo [2/4] Grades Navigation Page - Original not found, deploying modern version
    move /Y "app\dashboard\grades\page-modern.tsx" "app\dashboard\grades\page.tsx"
    echo   ✓ Grades navigation deployed
    echo.
)

REM ============================================================================
REM Grade Entry Page
REM ============================================================================
if exist "app\dashboard\grades\entry\page.tsx" (
    echo [3/4] Grade Entry Page
    move /Y "app\dashboard\grades\entry\page.tsx" "app\dashboard\grades\entry\page-old.tsx"
    move /Y "app\dashboard\grades\entry\page-modern.tsx" "app\dashboard\grades\entry\page.tsx"
    echo   ✓ Grade entry deployed
    echo.
) else (
    echo [3/4] Grade Entry Page - Original not found, deploying modern version
    move /Y "app\dashboard\grades\entry\page-modern.tsx" "app\dashboard\grades\entry\page.tsx"
    echo   ✓ Grade entry deployed
    echo.
)

REM ============================================================================
REM Classes Page
REM ============================================================================
if exist "app\dashboard\classes\page.tsx" (
    echo [4/4] Classes Page
    move /Y "app\dashboard\classes\page.tsx" "app\dashboard\classes\page-old.tsx"
    move /Y "app\dashboard\classes\page-modern.tsx" "app\dashboard\classes\page.tsx"
    echo   ✓ Classes page deployed
    echo.
) else (
    echo [4/4] Classes Page - Original not found, deploying modern version
    move /Y "app\dashboard\classes\page-modern.tsx" "app\dashboard\classes\page.tsx"
    echo   ✓ Classes page deployed
    echo.
)

echo ========================================
echo  Deployment Complete!
echo ========================================
echo.
echo All refactored pages have been deployed.
echo Old versions backed up with -old.tsx extension.
echo.
echo Next steps:
echo 1. Start the dev server: pnpm dev
echo 2. Test each page:
echo    - /dashboard/students
echo    - /dashboard/grades
echo    - /dashboard/grades/entry
echo    - /dashboard/classes
echo 3. Verify all features work correctly
echo 4. Check React Query DevTools (bottom-right)
echo.

pause
