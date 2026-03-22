@echo off
REM Setup daily idea hunt at 06:00 Moscow time (UTC+3 = 03:00 UTC)
REM Results will be ready by ~09:00
REM
REM Run this script as Administrator to create the scheduled task

set SCRIPT_PATH=%~dp0daily-hunt.mjs
set PROJECT_DIR=%~dp0..

echo Creating scheduled task "DailyIdeaHunt"...
echo Script: %SCRIPT_PATH%
echo Working dir: %PROJECT_DIR%

schtasks /create /tn "DailyIdeaHunt" /tr "node \"%SCRIPT_PATH%\"" /sc daily /st 06:00 /f

echo.
echo Task created! It will run daily at 06:00.
echo To run manually: npm run hunt
echo To check status: schtasks /query /tn "DailyIdeaHunt"
echo To delete: schtasks /delete /tn "DailyIdeaHunt" /f
pause
