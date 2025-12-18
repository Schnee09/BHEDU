$versions = @('003','004','010','20251204','999')
$max = 3
foreach ($v in $versions) {
  $attempt = 1
  $ok = $false
  while ($attempt -le $max) {
    Write-Host "Repairing $v (attempt $attempt/$max)"
    npx -y supabase@latest migration repair --status applied $v --debug
    if ($LASTEXITCODE -eq 0) {
      Write-Host "  -> succeeded: $v"
      $ok = $true
      break
    } else {
      $sleep = [math]::Min(15, [math]::Pow(2, $attempt))
      Write-Host "  -> failed (exit $LASTEXITCODE). Sleeping $sleep s before retry"
      Start-Sleep -Seconds $sleep
      $attempt++
    }
  }
  if (-not $ok) { Write-Host "WARN: Could not repair $v after $max attempts" }
}
Write-Host '--- Done targeted repairs; migration list ---'
npx -y supabase@latest migration list --debug
Write-Host '--- Attempting db pull --debug ---'
npx -y supabase@latest db pull --debug
