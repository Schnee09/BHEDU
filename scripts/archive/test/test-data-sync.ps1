# Data Sync Test Script - PowerShell Version
# Run with: powershell -ExecutionPolicy Bypass -File scripts/test-data-sync.ps1

$baseUrl = "http://localhost:3000"

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Endpoint
    )
    
    Write-Host -NoNewline "Testing $Name... "
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl$Endpoint" -UseBasicParsing -TimeoutSec 10
        $statusCode = $response.StatusCode
        $body = $response.Content | ConvertFrom-Json
        
        if ($statusCode -eq 200) {
            # Try to get data count from various response formats
            $dataCount = if ($body.students) { @($body.students).Count }
                        elseif ($body.data) { @($body.data).Count }
                        elseif ($body.classes) { @($body.classes).Count }
                        elseif ($body -is [array]) { @($body).Count }
                        else { 0 }
            
            if ($dataCount -gt 0) {
                Write-Host -ForegroundColor Green "✅ OK ($dataCount records)"
            } else {
                Write-Host -ForegroundColor Yellow "⚠️  Empty"
                Write-Host "   Response: $(ConvertTo-Json $body -Depth 1 | Select-Object -First 100)"
            }
        } else {
            Write-Host -ForegroundColor Red "❌ HTTP $statusCode"
        }
    } catch {
        Write-Host -ForegroundColor Red "❌ ERROR"
        Write-Host "   $($_.Exception.Message)"
    }
}

Write-Host "🔍 TESTING DATA SYNC" -ForegroundColor Cyan
Write-Host "===================="
Write-Host ""

Write-Host "📊 API ENDPOINTS:" -ForegroundColor Cyan
Test-Endpoint "Students" "/api/admin/students?limit=1"
Test-Endpoint "Classes" "/api/classes"
Test-Endpoint "Attendance" "/api/attendance?limit=1"
Test-Endpoint "Courses" "/api/admin/courses?limit=1"
Test-Endpoint "Academic Years" "/api/admin/academic-years?limit=1"
Test-Endpoint "Fee Types" "/api/admin/fee-types?limit=1"
Test-Endpoint "Users" "/api/admin/users?limit=1"

Write-Host ""
Write-Host "🔧 DIAGNOSTIC:" -ForegroundColor Cyan
Test-Endpoint "Diagnostic" "/api/debug/diagnose"

Write-Host ""
Write-Host "✅ Test complete!"
