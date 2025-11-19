# Fix all Next.js 16 route handlers - complete solution
$routeFiles = @(
    "e:\TTGDBH\BH-EDU\web\app\api\admin\grading-scales\[id]\route.ts",
    "e:\TTGDBH\BH-EDU\web\app\api\admin\fee-types\[id]\route.ts"
)

foreach ($file in $routeFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Encoding UTF8 -Raw
        
        # Step 1: Fix signature from synchronous to Promise
        $content = $content -replace '\{ params \}: \{ params: \{ id: string \} \}', '{ params }: { params: Promise<{ id: string }> }'
        
        # Step 2: Add await params after auth check and replace params.id with resolvedParams.id
        # Pattern: after adminAuth check, add resolvedParams line
        $content = $content -replace '(const authResult = await adminAuth\(request\);[\s\S]*?\}\s*)(const supabase = createServiceClient\(\);)', "`$1`r`n    const resolvedParams = await params;`r`n    `$2"
        
        # Step 3: Replace all params.id with resolvedParams.id
        $content = $content -replace 'params\.id', 'resolvedParams.id'
        
        Set-Content -Path $file -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Fixed: $file"
    }
}

Write-Host "`nDone fixing all route handlers!"
