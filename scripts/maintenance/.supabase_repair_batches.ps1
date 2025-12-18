$versions = @(
  '001','002','003','004','005','006','007','008','009','010','011','012','013','014','015','016','017','018','019','020','021','022','023','024','025','026','027','028','029','030','031','032','033','034','037','039','040','041','042','043','044','045','046','20251119','20251120','20251204','999'
)
$batchSize = 8
$failed = @()
$total = $versions.Count
$batchIndex = 0
for ($i = 0; $i -lt $versions.Count; $i += $batchSize) {
    $end = [math]::Min($i + $batchSize - 1, $versions.Count - 1)
    $batch = $versions[$i..$end]
    $batchIndex++
    Write-Host "=== Batch $batchIndex of $([math]::Ceiling($total / $batchSize)) - versions: $($batch -join ', ') ==="

    foreach ($v in $batch) {
        $attempt = 1
        $max = 3
        $ok = $false
        while ($attempt -le $max) {
            Write-Host "Repairing $v (attempt $attempt/$max)"
            npx -y supabase@latest migration repair --status applied $v --debug
            if ($LASTEXITCODE -eq 0) {
                $ok = $true
                Write-Host "  -> succeeded: $v"
                break
            } else {
                $sleep = [math]::Min(15, [math]::Pow(2, $attempt))
                Write-Host "  -> failed (exit $LASTEXITCODE). Sleeping $sleep s before retry"
                Start-Sleep -Seconds $sleep
                $attempt++
            }
        }
        if (-not $ok) {
            Write-Host "WARN: Could not repair $v after $max attempts - recording failure and continuing."
            $failed += $v
        }
    }

    Write-Host "--- End batch $batchIndex; listing migrations (debug) ---"
    npx -y supabase@latest migration list --debug

    if ($i + $batchSize -lt $versions.Count) {
        Write-Host "Sleeping 5s between batches..."
        Start-Sleep -Seconds 5
    }
}

Write-Host "=== All batches complete ==="
if ($failed.Count -gt 0) {
    Write-Host "Failed to repair versions: $($failed -join ', ')"
    exit 2
} else {
    Write-Host "All versions repaired or already applied."
    exit 0
}
