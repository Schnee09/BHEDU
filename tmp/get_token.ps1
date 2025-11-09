# get_token.ps1 - request supabase token via anon key
$ErrorActionPreference = 'Stop'
try {
  $payload = @{ grant_type = 'password'; email = 'ci-test+1@example.com'; password = 'Password123!' }
  $json = $payload | ConvertTo-Json -Depth 3
  $resp = Invoke-RestMethod -Uri 'https://mwncwhkdimnjovxzhtjm.supabase.co/auth/v1/token' -Method Post -Headers @{ 'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13bmN3aGtkaW1uam92eHpodGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0Mzg1MzAsImV4cCI6MjA3NjAxNDUzMH0.ICXEl60X70V8T7vwieDGXskvH5LPxkL29jPwC77TBAM' } -Body $json -ContentType 'application/json'
  $resp | ConvertTo-Json -Depth 6 | Write-Output
} catch {
  Write-Output "ERROR_RESPONSE:"
  try {
    $_.Exception | Format-List * | Out-String | Write-Output
    if ($_.Exception.Response) {
      $resp = $_.Exception.Response
      try {
        $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $body = $sr.ReadToEnd()
        Write-Output "---- Response body ----"
        Write-Output $body
      } catch { Write-Output "(failed to read response body): $_" }
    }
  } catch { $_.Exception.Message | Write-Output }
}
