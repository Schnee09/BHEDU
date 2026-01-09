@echo off
REM Test all API endpoints with proper JSON escaping for Windows cmd

set INTERNAL_API_KEY=23685fb84b01f55cf50d871a6d71e5bc3d12e01a48b95e54986ab279521fa5b6
REM Update PREVIEW_URL to latest deployment if needed
set PREVIEW_URL=https://bhedu-lym5yqxpw-schnees-projects-fc5cc4c6.vercel.app
set COURSE_ID=f6d33292-02f5-48d4-a567-5bc114b6a84e
set NEW_COURSE_ID=
set NEW_LESSON_ID=

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

for /f "tokens=2 delims=:," %%A in ('node web\scripts\hmac-request.mjs --url %PREVIEW_URL%/api/courses --method POST --body "{\"title\":\"Temp Update Course\",\"description\":\"Desc\",\"is_published\":true}" ^| findstr /i /c:"\"id\""') do set NEW_COURSE_ID=%%~A
set NEW_COURSE_ID=%NEW_COURSE_ID:"=%
echo Created course id: %NEW_COURSE_ID%

echo ========================================
echo Testing PUT /api/courses/[id]
echo ========================================
node web\scripts\hmac-request.mjs --url %PREVIEW_URL%/api/courses/%NEW_COURSE_ID% --method PUT --body "{\"title\":\"Updated Course Title\",\"description\":\"Updated Desc\"}"
echo.

echo ========================================
echo Testing DELETE /api/courses/[id]
echo ========================================
node web\scripts\hmac-request.mjs --url %PREVIEW_URL%/api/courses/%NEW_COURSE_ID% --method DELETE
echo.

REM Pause to see results
pause

echo ========================================
echo Testing GET /api/lessons (signed with query)
echo ========================================
node web\scripts\hmac-request.mjs --url %PREVIEW_URL%/api/lessons?course_id=%COURSE_ID% --sign-payload course_id=%COURSE_ID%
echo.

echo ========================================
echo Testing POST /api/lessons
echo ========================================
node web\scripts\hmac-request.mjs --url %PREVIEW_URL%/api/lessons --method POST --body "{\"course_id\":\"%COURSE_ID%\",\"title\":\"Lesson 1\",\"content\":\"Intro\",\"order_index\":1,\"is_published\":true}"
echo.

for /f "tokens=2 delims=:," %%A in ('node web\scripts\hmac-request.mjs --url %PREVIEW_URL%/api/lessons --method POST --body "{\"course_id\":\"%COURSE_ID%\",\"title\":\"Temp Update Lesson\",\"content\":\"Intro\",\"order_index\":2,\"is_published\":true}" ^| findstr /i /c:"\"id\""') do set NEW_LESSON_ID=%%~A
set NEW_LESSON_ID=%NEW_LESSON_ID:"=%
echo Created lesson id: %NEW_LESSON_ID%

echo ========================================
echo Testing PUT /api/lessons/[id]
echo ========================================
node web\scripts\hmac-request.mjs --url %PREVIEW_URL%/api/lessons/%NEW_LESSON_ID% --method PUT --body "{\"title\":\"Updated Lesson Title\",\"order_index\":5}" 
echo.

echo ========================================
echo Testing DELETE /api/lessons/[id]
echo ========================================
node web\scripts\hmac-request.mjs --url %PREVIEW_URL%/api/lessons/%NEW_LESSON_ID% --method DELETE
echo.

echo ========================================
echo Re-list lessons
echo ========================================
node web\scripts\hmac-request.mjs --url %PREVIEW_URL%/api/lessons?course_id=%COURSE_ID% --sign-payload course_id=%COURSE_ID%
echo.

pause
