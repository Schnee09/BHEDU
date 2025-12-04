@echo off
REM ============================================================================
REM Rollback Refactored Pages Script
REM
REM This script restores the old pages in case of issues
REM Run this from: e:\TTGDBH\BH-EDU\web\
REM ============================================================================

echo ========================================
echo  Rolling Back to Old Pages
echo ========================================
echo.

REM Check if we're in the correct directory
if not exist "app\dashboard" (
    echo ERROR: Please run this script from the web\ directory
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo Restoring old versions...
echo.

REM ============================================================================
REM Students Page
REM ============================================================================
if exist "app\dashboard\students\page-old.tsx" (
    echo [1/4] Students Page
    if exist "app\dashboard\students\page.tsx" (
        move /Y "app\dashboard\students\page.tsx" "app\dashboard\students\page-modern-backup.tsx"
    )
    move /Y "app\dashboard\students\page-old.tsx" "app\dashboard\students\page.tsx"
    echo   ✓ Students page restored
    echo.
) else (
    echo [1/4] Students Page - No backup found, skipping
    echo.
)

REM ============================================================================
REM Grades Navigation Page
REM ============================================================================
if exist "app\dashboard\grades\page-old.tsx" (
    echo [2/4] Grades Navigation Page
    if exist "app\dashboard\grades\page.tsx" (
        move /Y "app\dashboard\grades\page.tsx" "app\dashboard\grades\page-modern-backup.tsx"
    )
    move /Y "app\dashboard\grades\page-old.tsx" "app\dashboard\grades\page.tsx"
    echo   ✓ Grades navigation restored
    echo.
) else (
    echo [2/4] Grades Navigation Page - No backup found, skipping
    echo.
)

REM ============================================================================
REM Grade Entry Page
REM ============================================================================
if exist "app\dashboard\grades\entry\page-old.tsx" (
    echo [3/4] Grade Entry Page
    if exist "app\dashboard\grades\entry\page.tsx" (
        move /Y "app\dashboard\grades\entry\page.tsx" "app\dashboard\grades\entry\page-modern-backup.tsx"
    )
    move /Y "app\dashboard\grades\entry\page-old.tsx" "app\dashboard\grades\entry\page.tsx"
    echo   ✓ Grade entry restored
    echo.
) else (
    echo [3/4] Grade Entry Page - No backup found, skipping
    echo.
)

REM ============================================================================
REM Classes Page
REM ============================================================================
if exist "app\dashboard\classes\page-old.tsx" (
    echo [4/4] Classes Page
    if exist "app\dashboard\classes\page.tsx" (
        move /Y "app\dashboard\classes\page.tsx" "app\dashboard\classes\page-modern-backup.tsx"
    )
    move /Y "app\dashboard\classes\page-old.tsx" "app\dashboard\classes\page.tsx"
    echo   ✓ Classes page restored
    echo.
) else (
    echo [4/4] Classes Page - No backup found, skipping
    echo.
)

echo ========================================
echo  Rollback Complete!
echo ========================================
echo.
echo Old pages have been restored.
echo Modern versions saved with -modern-backup.tsx extension.
echo.
echo Restart your dev server to see changes.
echo.

pause
