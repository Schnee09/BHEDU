$dir = 'supabase/migrations'
$backup = Join-Path $dir '_backup_before_db_pull'
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Write-Host "Backup dir: $backup"
$moved = @()
Get-ChildItem -Path $dir -Filter '*_remote_migration.sql' -File | ForEach-Object {
    $name = $_.Name
    if ($name -match '^(\d+)') {
        $base = $matches[1]
        $placeholder = Join-Path $dir ("${base}_remote_placeholder.sql")
        if (Test-Path $placeholder) {
            $dest = Join-Path $backup $name
            Move-Item -Path $_.FullName -Destination $dest -Force
            $moved += $name
            Write-Host "Moved $name -> $dest"
        }
    }
}
if ($moved.Count -eq 0) { Write-Host 'No duplicates found to move.' } else { Write-Host 'Moved files:' ($moved -join ', ') }
Write-Host 'Running db pull --debug...'
npx -y supabase@latest db pull --debug
