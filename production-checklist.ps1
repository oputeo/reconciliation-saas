# =============================================
# ReconFlow - Final Production Checklist
# =============================================

$root = "C:\Projects\reconciliation-saas"
Set-Location $root

Write-Host "ReconFlow Production Checklist" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

$checks = @(
    @{Name="Next.js Config"; Status=Test-Path "next.config.ts"},
    @{Name="Tailwind Config"; Status=Test-Path "tailwind.config.ts"},
    @{Name="Dockerfile"; Status=Test-Path "Dockerfile"},
    @{Name="docker-compose.yml"; Status=Test-Path "docker-compose.yml"},
    @{Name="ARCHITECTURE.md"; Status=Test-Path "ARCHITECTURE.md"},
    @{Name="Supabase Functions"; Status=(Test-Path "supabase\functions")}
)

foreach ($check in $checks) {
    if ($check.Status) {
        Write-Host "✅ $($check.Name)" -ForegroundColor Green
    } else {
        Write-Host "❌ $($check.Name)" -ForegroundColor Red
    }
}

Write-Host "`nNext Critical Steps:" -ForegroundColor Yellow
Write-Host "1. Implement Row Level Security (RLS) on all tables"
Write-Host "2. Add Jest + Playwright tests"
Write-Host "3. Setup GitHub Actions CI/CD"
Write-Host "4. Deploy to Vercel / Docker"
Write-Host "5. Add Sentry for error monitoring"

Write-Host "`nWould you like me to generate any of the following next?" -ForegroundColor Cyan
Write-Host "   - Full RLS Policies SQL"
Write-Host "   - GitHub Actions CI/CD Workflow"
Write-Host "   - Testing Setup (Jest + Playwright)"
Write-Host "   - Vercel Deployment Guide"

pause