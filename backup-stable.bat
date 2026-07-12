@echo off
echo ================================================
echo     ReconFlow - Stable Project Backup
echo ================================================

set PROJECT_PATH=C:\Projects\reconciliation-stable-saas
set BACKUP_ROOT=C:\ReconFlow_Backups
set TIMESTAMP=%DATE:~-4%-%DATE:~4,2%-%DATE:~7,2%_%TIME:~0,2%-%TIME:~3,2%-%TIME:~6,2%
set BACKUP_FOLDER=%BACKUP_ROOT%\ReconFlow_Stable_Backup_%TIMESTAMP%

echo.
echo Creating backup of Stable Project...
echo Source: %PROJECT_PATH%
echo Destination: %BACKUP_FOLDER%
echo.

xcopy "%PROJECT_PATH%" "%BACKUP_FOLDER%" /E /I /H /Y /C /EXCLUDE:exclude.txt

echo.
echo ✅ Backup completed successfully!
echo 📁 Location: %BACKUP_FOLDER%
echo.
echo Stable project safely backed up.
echo.

pause