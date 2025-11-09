# register_and_test.ps1 - register -> login -> call /api/courses
$ErrorActionPreference = 'Stop'

$registerBody = @{
  email = 'ci-test+1@example.com'
  password = 'Password123!'
  full_name = 'CI Test'
  role = 'teacher'
}

try {
  $reg = Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/register' -Method Post -Body ($registerBody | ConvertTo-Json) -ContentType 'application/json'
  Write-Output "REGISTER_RESULT:" 
  $reg | ConvertTo-Json -Depth 5 | Write-Output
} catch {
  Write-Output "REGISTER_ERROR:" 
  if ($_.Exception.Response) { try { $_.Exception.Response | ConvertTo-Json -Depth 5 | Write-Output } catch { $_.Exception.Message | Write-Output } } else { $_.Exception.Message | Write-Output }
}

$loginBody = @{
  email = 'ci-test+1@example.com'
  password = 'Password123!'
}

$token = $null
try {
  $login = Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/login' -Method Post -Body ($loginBody | ConvertTo-Json) -ContentType 'application/json'
  Write-Output "LOGIN_RESULT:"
  $login | ConvertTo-Json -Depth 6 | Write-Output
  # attempt to find token in common shapes
  if ($login.session -and $login.session.access_token) { $token = $login.session.access_token }
  elseif ($login.data -and $login.data.session -and $login.data.session.access_token) { $token = $login.data.session.access_token }
  elseif ($login.access_token) { $token = $login.access_token }
} catch {
  Write-Output "LOGIN_ERROR:"
  if ($_.Exception.Response) { try { $_.Exception.Response | ConvertTo-Json -Depth 5 | Write-Output } catch { $_.Exception.Message | Write-Output } } else { $_.Exception.Message | Write-Output }
}

if ($token) {
  Write-Output "TOKEN_FOUND: $($token.Substring(0,16))..."
  try {
    $courses = Invoke-RestMethod -Uri 'http://localhost:3000/api/courses' -Headers @{ Authorization = "Bearer $token" }
    Write-Output "COURSES_RESULT:"
    $courses | ConvertTo-Json -Depth 6 | Write-Output
  } catch {
    Write-Output "COURSES_ERROR:"
    if ($_.Exception.Response) { try { $_.Exception.Response | ConvertTo-Json -Depth 5 | Write-Output } catch { $_.Exception.Message | Write-Output } } else { $_.Exception.Message | Write-Output }
  }
} else {
  Write-Output "NO_TOKEN: cannot call protected endpoints"
}
