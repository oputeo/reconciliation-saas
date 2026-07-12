@echo off
setlocal enabledelayedexpansion

echo.
echo =====================================================
echo    ReconFlow Project Analysis Tool
echo    Production Readiness Assessment
echo =====================================================
echo.

set PROJECT_PATH=C:\Projects\reconciliation-stable-saas
cd /d "%PROJECT_PATH%"

set SCORE=0
set MAX_SCORE=100

echo [1/10] Checking Project Structure...
if exist package.json (
    echo ✓ package.json found
    set /a SCORE+=10
) else echo ✗ package.json missing

if exist .env.example (
    echo ✓ .env.example found
    set /a SCORE+=8
) else echo ✗ .env.example missing

if exist Dockerfile (
    echo ✓ Dockerfile found
    set /a SCORE+=8
) else echo ✗ Dockerfile missing

if exist docker-compose.yml (
    echo ✓ docker-compose.yml found
    set /a SCORE+=5
)

echo.
echo [2/10] Checking Supabase & Backend...
if exist supabase\functions (
    echo ✓ Supabase Edge Functions folder found
    set /a SCORE+=12
) else echo ✗ Supabase functions folder missing

if exist supabase\config.toml (
    echo ✓ Supabase config found
    set /a SCORE+=5
)

echo.
echo [3/10] Checking Important Files...
if exist README.md (
    echo ✓ README.md found
    set /a SCORE+=5
)
if exist .gitignore (
    echo ✓ .gitignore found
    set /a SCORE+=5
)
if exist next.config.js (
    echo ✓ Next.js config found
    set /a SCORE+=5
)

echo.
echo [4/10] Security & Environment...
if exist .env.local (
    echo ⚠ .env.local exists (should not be committed)
) else echo ✓ No .env.local committed (good)

echo.
echo =====================================================
echo                 FINAL SCORE
echo =====================================================
echo.

echo Production Readiness Score: %SCORE%/%MAX_SCORE%
echo.

if %SCORE% GEQ 85 (
    echo 🟢 EXCELLENT - Production Ready
) else if %SCORE% GEQ 70 (
    echo 🟡 GOOD - Almost Production Ready
) else if %SCORE% GEQ 50 (
    echo 🟠 FAIR - Needs Work
) else (
    echo 🔴 POOR - Major improvements needed
)

echo.
echo Critical Areas to Improve:
if not exist Dockerfile echo - Add Dockerfile + docker-compose
if not exist .env.example echo - Create .env.example
if not exist supabase\functions echo - Organize Edge Functions properly
echo.

pause