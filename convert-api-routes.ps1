$files = @(
  "e:\TTGDBH\BH-EDU\web\app\api\admin\settings\route.ts",
  "e:\TTGDBH\BH-EDU\web\app\api\admin\academic-years\route.ts",
  "e:\TTGDBH\BH-EDU\web\app\api\admin\grading-scales\route.ts",
  "e:\TTGDBH\BH-EDU\web\app\api\admin\students\import\route.ts",
  "e:\TTGDBH\BH-EDU\web\app\api\admin\students\import\history\route.ts",
  "e:\TTGDBH\BH-EDU\web\app\api\admin\users\import\route.ts",
  "e:\TTGDBH\BH-EDU\web\app\api\admin\finance\fee-types\route.ts",
  "e:\TTGDBH\BH-EDU\web\app\api\admin\finance\payment-methods\route.ts",
  "e:\TTGDBH\BH-EDU\web\app\api\admin\finance\payment-schedules\route.ts",
  "e:\TTGDBH\BH-EDU\web\app\api\admin\finance\student-accounts\route.ts",
  "e:\TTGDBH\BH-EDU\web\app\api\admin\finance\invoices\route.ts",
  "e:\TTGDBH\BH-EDU\web\app\api\admin\finance\payments\route.ts",
  "e:\TTGDBH\BH-EDU\web\app\api\admin\finance\reports\route.ts",
  "e:\TTGDBH\BH-EDU\web\app\api\attendance\bulk\route.ts",
  "e:\TTGDBH\BH-EDU\web\app\api\attendance\qr\generate\route.ts",
  "e:\TTGDBH\BH-EDU\web\app\api\grades\assignments\route.ts",
  "e:\TTGDBH\BH-EDU\web\app\api\grades\categories\route.ts",
  "e:\TTGDBH\BH-EDU\web\app\api\grades\student-overview\route.ts",
  "e:\TTGDBH\BH-EDU\web\app\api\classes\[classId]\students\route.ts"
)

foreach ($file in $files) {
  if (Test-Path $file) {
    $content = Get-Content $file -Encoding UTF8 | Out-String
    
    # Replace import statement
    $content = $content -replace "import \{ createServiceClient \} from '@/lib/supabase/server'", "import { createClientFromRequest, createServiceClient } from '@/lib/supabase/server'"
    
    # Replace first usage (typically in GET handler)
    $content = $content -replace "const supabase = createServiceClient\(\)", "const supabase = createClientFromRequest(request as any)"
    
    # Save the file
    $content | Set-Content $file -Encoding UTF8 -NoNewline
    
    Write-Host "Converted: $file"
  } else {
    Write-Host "Not found: $file" -ForegroundColor Yellow
  }
}

Write-Host "`nConversion complete!" -ForegroundColor Green
