@echo off
REM Test all API endpoints with proper JSON escaping for Windows cmd

set INTERNAL_API_KEY=23685fb84b01f55cf50d871a6d71e5bc3d12e01a48b95e54986ab279521fa5b6
set PREVIEW_URL=https://bhedu-lym5yqxpw-schnees-projects-fc5cc4c6.vercel.app

echo ========================================
echo Testing GET /api/courses
echo ========================================
node web\scripts\hmac-request.mjs --url %PREVIEW_URL%/api/courses
echo.

echo ========================================
echo Testing POST /api/courses
echo ========================================
node web\scripts\hmac-request.mjs --url %PREVIEW_URL%/api/courses --method POST --body "{\"title\":\"Introduction to Math\",\"description\":\"Basic concepts\",\"is_published\":true}"
echo.

REM Pause to see results
pause
