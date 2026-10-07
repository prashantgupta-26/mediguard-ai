@echo off
TITLE MediKiosk / MediGuard AI - Unified Launcher
COLOR 0A

echo ================================================================
echo       MEDIKIOSK / MEDIGUARD AI - SYSTEM LAUNCHER
echo ================================================================
echo.

:: 1. Check if MongoDB service is running
echo [1/3] Checking MongoDB Service...
sc query MongoDB | find "RUNNING" >nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] MongoDB Windows Service is actively RUNNING.
) else (
    echo [INFO] Attempting to start local MongoDB service...
    net start MongoDB >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [OK] MongoDB Windows Service started successfully.
    ) else (
        echo [WARNING] Could not start MongoDB service automatically.
        echo If you have MongoDB installed, please run: net start MongoDB
        echo Or ensure your cloud MONGODB_URI is configured in backend\.env
    )
)
echo.

:: 2. Launch Backend in new window
echo [2/3] Starting Backend Server (Port 5000)...
start "MediKiosk Backend (Port 5000)" cmd /k "cd /d %~dp0backend && npm run dev"
timeout /t 2 >nul

:: 3. Launch Frontend in new window
echo [3/3] Starting Frontend Vite Server (Port 5173)...
start "MediKiosk Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 3 >nul

echo.
echo ================================================================
echo   All services launched!
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:5000
echo   Health   : http://localhost:5000/api/health
echo ================================================================
echo.

:: Open browser automatically
start http://localhost:5173
pause
