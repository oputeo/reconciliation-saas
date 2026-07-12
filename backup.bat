@echo off
echo =====================================================
echo    ReconFlow - Creating Backup (v2.1)
echo =====================================================

:: === CONFIGURATION ===
set SOURCE=C:\Projects\reconciliation-stable-saas
set BACKUP_FOLDER=C:\ReconFlow_Backups

:: Create backup folder if it doesn't exist
if not exist "%BACKUP_FOLDER%" mkdir "%BACKUP_FOLDER%"

:: Generate clean timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YEAR=%dt:~0,4%"
set "MONTH=%dt:~4,2%"
set "DAY=%dt:~6,2%"
set "HOUR=%dt:~8,2%"
set "MINUTE=%dt:~10,2%"
set "SECOND=%dt:~12,2%"

set BACKUP_NAME=ReconFlow_Backup_%YEAR%-%MONTH%-%DAY%_%HOUR%-%MINUTE%-%SECOND%

echo.
echo Creating backup: %BACKUP_NAME%
echo Source: %SOURCE%
echo Destination: %BACKUP_FOLDER%\%BACKUP_NAME%
echo.

:: Perform backup with exclusions
xcopy "%SOURCE%" "%BACKUP_FOLDER%\%BACKUP_NAME%" /E /I /H /Y /C /EXCLUDE:exclude.txt

echo.
echo ✅ Backup completed successfully!
echo.
echo Location: %BACKUP_FOLDER%\%BACKUP_NAME%
echo.
echo Opening backup folder...
explorer "%BACKUP_FOLDER%\%BACKUP_NAME%"

pause