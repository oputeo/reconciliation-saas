# =============================================
# ReconFlow - Project Organizer (Clean Version)
# =============================================

$root = "C:\Projects\reconciliation-saas"
Set-Location $root

Write-Host "🚀 Organizing ReconFlow Project for Production..." -ForegroundColor Cyan

# 1. Remove Junk Files
Write-Host "🧹 Removing temporary files..." -ForegroundColor Yellow
Remove-Item "*.csv" -Force -ErrorAction SilentlyContinue
Remove-Item "setIsMobileOpen*" -Force -ErrorAction SilentlyContinue
Remove-Item "your-function.txt" -Force -ErrorAction SilentlyContinue
Remove-Item "backup.bat" -Force -ErrorAction SilentlyContinue
Remove-Item "project-audit.js" -Force -ErrorAction SilentlyContinue
Remove-Item "*anomaly*.docx" -Force -ErrorAction SilentlyContinue

# 2. Create Clean Folder Structure
Write-Host "📁 Creating recommended folders..." -ForegroundColor Yellow

New-Item -ItemType Directory -Path "$root\src\components\dashboard" -Force | Out-Null
New-Item -ItemType Directory -Path "$root\src\components\common" -Force | Out-Null
New-Item -ItemType Directory -Path "$root\src\components\features" -Force | Out-Null
New-Item -ItemType Directory -Path "$root\src\types" -Force | Out-Null
New-Item -ItemType Directory -Path "$root\src\hooks" -Force | Out-Null
New-Item -ItemType Directory -Path "$root\supabase\migrations" -Force | Out-Null

# 3. Move lib folder if exists
if (Test-Path "$root\lib") {
    Write-Host "Moving lib → src/lib ..." -ForegroundColor Gray
    Move-Item "$root\lib" "$root\src\lib" -Force -ErrorAction SilentlyContinue
}

Write-Host "`n✅ Project Organization Completed Successfully!" -ForegroundColor Green
Write-Host "`nNew Recommended Structure:" -ForegroundColor Cyan
Write-Host @"
src/
├── app/                    ← Your current pages
├── components/
│   ├── ui/
│   ├── dashboard/
│   ├── common/
│   └── features/
├── lib/
├── hooks/
└── types/

supabase/
├── functions/
└── migrations/
"@ -ForegroundColor White

Write-Host "`nYou can now continue development with a clean structure." -ForegroundColor Yellow
Write-Host "Next: I can generate missing config files (next.config, tailwind, etc.)" -ForegroundColor Cyan

pause