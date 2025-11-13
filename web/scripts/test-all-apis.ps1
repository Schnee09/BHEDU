# Complete API Test Suite
# Tests profiles and courses endpoints after migration

# Configuration
$env:INTERNAL_API_KEY = "23685fb84b01f55cf50d871a6d71e5bc3d12e01a48b95e54986ab279521fa5b6"

# Get preview URL from user input or use default
$baseUrl = Read-Host "Enter preview URL (or press Enter to use last known)"
if ([string]::IsNullOrWhiteSpace($baseUrl)) {
    $baseUrl = "https://bhedu-ftc8txlzy-schnees-projects-fc5cc4c6.vercel.app"
}

Write-Host "`n🚀 Testing API at: $baseUrl`n" -ForegroundColor Green

# ========================================
# PROFILES API TESTS (formerly users)
# ========================================

Write-Host "=== 1. GET /api/users (list profiles) ===" -ForegroundColor Cyan
node web\scripts\hmac-request.mjs --url "$baseUrl/api/users"
Start-Sleep -Seconds 1

Write-Host "`n=== 2. POST /api/admin/create-user (create user + profile) ===" -ForegroundColor Cyan
$timestamp = Get-Date -Format "MMddHHmmss"
$createUserBody = "{`"email`":`"teacher$timestamp@example.com`",`"password`":`"SecurePass123!`",`"full_name`":`"Test Teacher`",`"role`":`"teacher`"}"
node web\scripts\hmac-request.mjs --url "$baseUrl/api/admin/create-user" --method POST --body $createUserBody
Start-Sleep -Seconds 1

# ========================================
# COURSES API TESTS (new feature)
# ========================================

Write-Host "`n=== 3. GET /api/courses (list courses) ===" -ForegroundColor Cyan
node web\scripts\hmac-request.mjs --url "$baseUrl/api/courses"
Start-Sleep -Seconds 1

Write-Host "`n=== 4. POST /api/courses (create course) ===" -ForegroundColor Cyan
$createCourseBody = "{`"title`":`"Introduction to Mathematics`",`"description`":`"Basic math concepts for beginners`",`"is_published`":false}"
node web\scripts\hmac-request.mjs --url "$baseUrl/api/courses" --method POST --body $createCourseBody
Start-Sleep -Seconds 1

# ========================================
# LESSONS API TESTS (new feature)
# ========================================

Write-Host "`n=== 5. GET /api/lessons?course_id=<uuid> (list lessons) ===" -ForegroundColor Yellow
Write-Host "Note: Requires a valid course_id from previous test" -ForegroundColor Yellow
Write-Host "Skipping for now - manual test with actual course_id needed" -ForegroundColor Gray

Write-Host "`n✅ Core API tests complete`n" -ForegroundColor Green

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Copy a course_id from the courses list above"
Write-Host "2. Test lessons endpoint manually:"
Write-Host "   node web\scripts\hmac-request.mjs --url `"$baseUrl/api/lessons?course_id=<UUID>`""
Write-Host "3. Create a lesson:"
Write-Host "   node web\scripts\hmac-request.mjs --url `"$baseUrl/api/lessons`" --method POST --body '{`"course_id`":`"<UUID>`",`"title`":`"Lesson 1`",`"content`":`"Content here`",`"order_index`":1}'"
