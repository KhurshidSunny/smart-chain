@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo  Smart-Chain - Start all microservices
echo ========================================

start "IAM:3001" cmd /k "cd /d %~dp0iam && npm start"
timeout /t 2 /nobreak >nul
start "Sales:3002" cmd /k "cd /d %~dp0sales && npm start"
timeout /t 1 /nobreak >nul
start "Inventory:3003" cmd /k "cd /d %~dp0inventory && npm start"
timeout /t 1 /nobreak >nul
start "Warehouse:3004" cmd /k "cd /d %~dp0warehouse && npm start"
timeout /t 1 /nobreak >nul
start "Logistics:3005" cmd /k "cd /d %~dp0logistics && npm start"

echo.
echo Services launching in separate windows:
echo   IAM       http://localhost:3001
echo   Sales     http://localhost:3002
echo   Inventory http://localhost:3003
echo   Warehouse http://localhost:3004
echo   Logistics http://localhost:3005
echo.
echo Next: start frontend-1 with: cd frontend-1 ^&^& npm run dev
echo.
pause
