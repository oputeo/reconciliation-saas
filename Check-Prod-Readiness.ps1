# ================================================
# SmartDelta Waste - Production Readiness Checker
# Run this script from anywhere
# ================================================

$ProjectPath = "C:\Projects\SmartDelta-Waste"
$ComposeProd = "docker-compose -f docker-compose.prod.yml --env-file .env"

Write-Host "🚀 SmartDelta Waste Production Readiness Check" -ForegroundColor Cyan
Write-Host "Project: $ProjectPath`n" -ForegroundColor White

# 1. Go to project folder
Set-Location $ProjectPath
Write-Host "📂 Changed to project directory" -ForegroundColor Green

# 2. Check Docker status
Write-Host "`n🐳 Checking Docker Desktop..." -ForegroundColor Cyan
docker info | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ Docker is running" -ForegroundColor Green
}

# 3. Show current containers status
Write-Host "`n📊 Container Status (Production Profile):" -ForegroundColor Cyan
& $ComposeProd ps

# 4. Health Check
Write-Host "`n❤️ Running Health Checks..." -ForegroundColor Cyan
& $ComposeProd ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# 5. Test Core Endpoints
Write-Host "`n🔍 Testing Critical Endpoints..." -ForegroundColor Cyan

$BaseUrl = "http://10.35.9.103:5001"   # Change if your IP is different

$tests = @(
    @{Name="Root"; Url="/"},
    @{Name="Loyalty (CUST-001)"; Url="/api/customers/loyalty?customer_id=CUST-001"},
    @{Name="Health"; Url="/health"}
)

foreach ($test in $tests) {
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl$($test.Url)" -Method Get -TimeoutSec 8
        $status = if ($response.StatusCode -eq 200) { "✅" } else { "⚠️" }
        Write-Host "$status $($test.Name) → $($response.StatusCode)" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ $($test.Name) → Failed" -ForegroundColor Red
    }
}

# 6. Socket.IO Quick Check
Write-Host "`n🔌 Socket.IO Status: Check browser console after opening frontend" -ForegroundColor Yellow

# 7. Final Summary
Write-Host "`n✅ Production Readiness Check Completed!" -ForegroundColor Green
Write-Host "Next Steps listed below. Run the script again after fixes." -ForegroundColor White