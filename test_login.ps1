$headers = @{ "Content-Type" = "application/json" }
$body = '{"email":"xolvon@xfarming.com","password":"88888888"}'
try {
  $resp = Invoke-WebRequest -Uri "https://xfarm-ehd.pages.dev/api/auth/login" -Method POST -Headers $headers -Body $body -ErrorAction Stop
  Write-Host "LOGIN OK: $($resp.StatusCode)"
  Write-Host "BODY: $($resp.Content)"
} catch [Microsoft.PowerShell.Commands.HttpResponseException] {
  Write-Host "FAIL $($_.Exception.Response.StatusCode.value__): $($_.ErrorDetails.Message)"
} catch {
  Write-Host "ERROR: $($_.Exception.Message)"
}
