# HMAC-Signed API Request Test Script
# Tests the deployed endpoints with HMAC authentication

# Set your INTERNAL_API_KEY here (same as Vercel env var)
$env:INTERNAL_API_KEY = "23685fb84b01f55cf50d871a6d71e5bc3d12e01a48b95e54986ab279521fa5b6"

$baseUrl = "https://bhedu-2hffss3ha-schnees-projects-fc5cc4c6.vercel.app"

Write-Host "`n=== Testing GET /api/users (list users) ===" -ForegroundColor Cyan
node web\scripts\hmac-request.mjs --url "$baseUrl/api/users"

Write-Host "`n=== Testing POST /api/users (create user profile) ===" -ForegroundColor Cyan
$createUserBody = '{"email":"testuser@example.com","role":"student"}'
node web\scripts\hmac-request.mjs --url "$baseUrl/api/users" --method POST --body $createUserBody

Write-Host "`n=== Testing POST /api/admin/create-user (create auth user) ===" -ForegroundColor Cyan
$createAuthBody = '{"email":"authtest@example.com","password":"TestPass123!"}'
node web\scripts\hmac-request.mjs --url "$baseUrl/api/admin/create-user" --method POST --body $createAuthBody

Write-Host "`n=== Tests complete ===" -ForegroundColor Green
