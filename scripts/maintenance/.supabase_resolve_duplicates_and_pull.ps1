$dir = 'supabase/migrations'
$backup = Join-Path $dir '_backup_before_db_pull'
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Write-Host "Backup dir: $backup"
$targets = @('003','004','010','20251204','999')
$moved = @()
foreach ($t in $targets) {
    Write-Host "Checking files starting with: $t"
    Get-ChildItem -Path $dir -File | Where-Object {
        ($_.Name -like "$t*") -and
        ($_.Name -notlike "${t}_remote_placeholder.sql") -and
        ($_.Name -notlike "${t}_remote_migration.sql")
    } | ForEach-Object {
        $dest = Join-Path $backup $_.Name
        Move-Item -Path $_.FullName -Destination $dest -Force
        $moved += $_.Name
        Write-Host "Moved $_.Name -> $dest"
    }
}
if ($moved.Count -eq 0) { Write-Host 'No conflicting files found to move.' } else { Write-Host 'Moved files:' ($moved -join ', ') }

Write-Host 'Running db pull --debug...'
npx -y supabase@latest db pull --debug
