# ================================================
# ReconFlow Project Architecture Analyzer
# Run this script to understand current structure
# ================================================

$projectRoot = "C:\Projects\reconciliation-saas"
Set-Location $projectRoot

Write-Host "ReconFlow Project Architecture Analysis" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date)`n" -ForegroundColor Gray

# 1. Root Level Files
Write-Host "ROOT LEVEL FILES:" -ForegroundColor Yellow
Get-ChildItem -File | Select-Object Name, LastWriteTime | Format-Table -AutoSize

# 2. Main Folders Structure
Write-Host "`nMAIN FOLDERS:" -ForegroundColor Yellow
$mainFolders = Get-ChildItem -Directory | Where-Object { $_.Name -notmatch 'node_modules|\.next|\.git' }
$mainFolders | Select-Object Name | Format-Table -AutoSize

# 3. Detailed App Structure
Write-Host "`nAPP STRUCTURE (src/app or app):" -ForegroundColor Yellow
if (Test-Path "app") {
    tree app /f /a | Select-Object -First 40
} elseif (Test-Path "src/app") {
    tree src/app /f /a | Select-Object -First 40
} else {
    Write-Host "No 'app' folder found" -ForegroundColor Red
}

# 4. Components & Lib
Write-Host "`nCOMPONENTS & LIB:" -ForegroundColor Yellow
Get-ChildItem -Directory -Recurse -Depth 2 | 
  Where-Object { $_.Name -match "components|lib|utils|hooks|ui" } | 
  Select-Object FullName | Format-Table -AutoSize

# 5. Supabase Structure
Write-Host "`nSUPABASE STRUCTURE:" -ForegroundColor Yellow
if (Test-Path "supabase") {
    tree supabase /f /a
} else {
    Write-Host "No supabase folder found" -ForegroundColor Red
}

# 6. Production Readiness Summary
Write-Host "`nPRODUCTION READINESS SUMMARY:" -ForegroundColor Cyan
Write-Host "=============================================="

$score = 0
if (Test-Path "package.json") { $score += 20; Write-Host "✅ package.json" -ForegroundColor Green }
if (Test-Path "next.config.*") { $score += 15; Write-Host "✅ Next.js Config" -ForegroundColor Green }
if (Test-Path "tailwind.config.*") { $score += 10; Write-Host "✅ Tailwind Config" -ForegroundColor Green }
if (Test-Path "supabase") { $score += 20; Write-Host "✅ Supabase Setup" -ForegroundColor Green }
if (Test-Path ".env*") { $score += 10; Write-Host "✅ Environment Files" -ForegroundColor Green }

Write-Host "`nCurrent Architecture Score: $score/100" -ForegroundColor Cyan
Write-Host "`nRecommended Folder Structure to Follow:" -ForegroundColor Yellow
Write-Host @"
app/
├── (dashboard)/
│   ├── layout.tsx
│   └── page.tsx
├── api/
├── components/
│   ├── ui/
│   ├── dashboard/
│   └── common/
├── lib/
├── hooks/
supabase/
├── functions/
├── migrations/
└── config.toml
"@

Write-Host "`nScript completed. Copy the output above if needed." -ForegroundColor Green
pause