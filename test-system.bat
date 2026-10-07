@echo off
TITLE MediKiosk / MediGuard AI - Automated Diagnostic Tester
COLOR 0B

echo ================================================================
echo    RUNNING MEDIKIOSK OTP, MONGODB, AND API SYSTEM DIAGNOSTICS
echo ================================================================
echo.

cd /d "%~dp0backend"
node src/tests/test-otp-and-api.js

echo.
echo ================================================================
echo Diagnostics completed. Press any key to exit.
echo ================================================================
pause
