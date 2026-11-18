# HMAC-Signed API Request Test Script
# Tests the deployed endpoints with HMAC authentication

# Provide the key in the current shell before running this script.
if ([string]::IsNullOrWhiteSpace($env:INTERNAL_API_KEY)) {
    Write-Error "INTERNAL_API_KEY is required. Set it in the current shell before running this script."
    exit 1
}

$baseUrl = "https://bhedu-2hffss3ha-schnees-projects-fc5cc4c6.vercel.app"

Write-Host "`n=== Testing POST /api/admin/create-user (create auth user) ===" -ForegroundColor Cyan
$createAuthBody = '{"email":"authtest@example.com","password":"TestPass123!"}'
node web\scripts\hmac-request.mjs --url "$baseUrl/api/admin/create-user" --method POST --body $createAuthBody

Write-Host "`n=== Tests complete ===" -ForegroundColor Green
