@echo off
echo ============================================
echo Supabase Cleanup Script
echo ============================================
echo.
echo This will DELETE the following:
echo - _obsolete/ folder (21 old fix scripts)
echo - archive/ folder (empty)
echo.
echo Press Ctrl+C to cancel, or
pause

echo.
echo Deleting _obsolete folder...
if exist "_obsolete" (
    rmdir /s /q "_obsolete"
    echo ✓ Deleted _obsolete/
) else (
    echo ✗ _obsolete folder not found
)

echo.
echo Deleting archive folder...
if exist "archive" (
    rmdir /s /q "archive"
    echo ✓ Deleted archive/
) else (
    echo ✗ archive folder not found
)

echo.
echo ============================================
echo Cleanup complete!
echo ============================================
echo.
echo Next steps:
echo 1. Run migrations/003_audit_logs.sql in Supabase
echo 2. Review migrations_archived/ folder
echo 3. Consider consolidating root SQL files
echo.
pause
