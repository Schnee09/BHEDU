# Fix all Next.js 16 route handlers
$files = @(
    "e:\TTGDBH\BH-EDU\web\app\api\admin\classes\[id]\route.ts",
    "e:\TTGDBH\BH-EDU\web\app\api\admin\grading-scales\[id]\route.ts",
    "e:\TTGDBH\BH-EDU\web\app\api\admin\fee-types\[id]\route.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Encoding UTF8 | Out-String
        
        # Fix params type from synchronous to Promise
        $content = $content -replace '\{ params \}: \{ params: \{ id: string \} \}', '{ params }: { params: Promise<{ id: string }> }'
        
        # Add await params resolution after each function start that uses params
        # This is a bit complex, so we'll do it manually per file
        
        Set-Content -Path $file -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Fixed: $file"
    }
}

Write-Host "Done! Now manually add 'const resolvedParams = await params' and update params.id to resolvedParams.id"
