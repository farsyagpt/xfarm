$t = "UzwPm1P7RxRyzQiy2zAfXWcYmBS2eCSxqekmesGT1Pk.w8H2mnfgisg07KX1VZIgbdt6MiaxUnAJObpZ7sQyBvE"
$r = Invoke-RestMethod "https://api.cloudflare.com/client/v4/accounts/262071aea85f1f47e34087814dec6d6f/pages/projects/xfarm/deployments/228e8604-9d89-437d-8cf3-bb6cfd19b7cf" -Headers @{Authorization="Bearer $t"}
foreach ($s in $r.result.stages) { Write-Host "$($s.name): $($s.status)" }
Write-Host "URL: $($r.result.url)"
