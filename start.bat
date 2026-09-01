@echo off
echo ================================================
echo  Terranova Web App
echo ================================================
echo.

if not exist node_modules (
  echo Installing packages - first run takes a few minutes...
  call npm install
)

echo.
echo Starting the web app...
echo When it says "Ready", open your browser at:
echo.
echo     http://localhost:3000
echo.
call npx next dev

pause
