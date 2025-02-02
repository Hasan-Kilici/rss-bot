Start-Process -NoNewWindow -FilePath "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File backend.ps1"
Start-Process -NoNewWindow -FilePath "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File frontend.ps1"
