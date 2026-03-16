@echo off
echo Starting n8n for Autonomy project...
echo.
echo Dashboard will open at: http://localhost:5678
echo Login: admin / autonomy2024
echo.

cd /d "%~dp0"

:: Load environment variables from .env
for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
    if not "%%a"=="" if not "%%a:~0,1%"=="#" set "%%a=%%b"
)

:: Create data directory
if not exist "data\n8n" mkdir "data\n8n"

:: Disable sandbox task runner (allows require('https') in Code nodes)
set N8N_RUNNERS_ENABLED=false
set NODE_FUNCTION_ALLOW_BUILTIN=*

:: Start n8n
npx n8n start

pause
