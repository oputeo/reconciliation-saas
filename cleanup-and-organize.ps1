# cleanup-and-organize.ps1
$root = "C:\Projects\reconciliation-saas"

Write-Host "Cleaning and Organizing ReconFlow Project..." -ForegroundColor Cyan

# Remove junk files
Remove-Item "$root\*.csv" -Force -ErrorAction SilentlyContinue
Remove-Item "$root\setIsMobileOpen*" -Force -ErrorAction SilentlyContinue
Remove-Item "$root\your-function.txt" -Force -ErrorAction SilentlyContinue
Remove-Item "$root\backup.bat" -Force -ErrorAction SilentlyContinue
Remove-Item "$root\project-audit.js" -Force -ErrorAction SilentlyContinue

Write-Host "✅ Removed temporary and junk files" -ForegroundColor Green

# Create recommended folders
New-Item -ItemType Directory -Path "$root\src\components\dashboard" -Force | Out-Null
New-Item -ItemType Directory -Path "$root\src\components\common" -Force | Out-Null
New-Item -ItemType Directory -Path "$root\src\components\features" -Force | Out-Null
New-Item -ItemType Directory -Path "$root\src\types" -Force | Out-Null

Write-Host "✅ Created recommended folder structure" -ForegroundColor Green

Write-Host "`nProject is now better organized for production development." -ForegroundColor Cyan
Write-Host "You can continue building safely using the recommended structure above." -ForegroundColor Yellow

pause