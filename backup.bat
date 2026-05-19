@echo off
echo ================================================
echo          ReconFlow Project Backup
echo ================================================

set PROJECT_PATH=C:\Projects\reconciliation-saas
set BACKUP_ROOT=C:\ReconFlow_Backups
set TIMESTAMP=%DATE:~-4%-%DATE:~4,2%-%DATE:~7,2%_%TIME:~0,2%-%TIME:~3,2%-%TIME:~6,2%
set BACKUP_FOLDER=%BACKUP_ROOT%\ReconFlow_Backup_%TIMESTAMP%

echo Creating backup at: %BACKUP_FOLDER%

xcopy "%PROJECT_PATH%" "%BACKUP_FOLDER%" /E /I /H /Y /C

echo.
echo ✅ Backup completed successfully!
echo 📁 Location: %BACKUP_FOLDER%
echo.
echo You can now safely proceed with mobile updates.
echo.

pause