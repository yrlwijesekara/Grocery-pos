@echo off
echo Setting up MongoDB for Grocery POS System...

echo.
echo Checking if MongoDB is installed...
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo MongoDB is not installed.
    echo.
    echo Please install MongoDB Community Server from:
    echo https://www.mongodb.com/try/download/community
    echo.
    echo Or use MongoDB Atlas (cloud): https://www.mongodb.com/atlas
    echo.
    echo After installation, run this script again.
    pause
    exit /b 1
)

echo MongoDB is installed!
echo.

echo Creating data directory...
if not exist "C:\data\db" mkdir "C:\data\db"

echo Starting MongoDB service...
net start MongoDB 2>nul
if %errorlevel% neq 0 (
    echo Could not start MongoDB service. Starting manually...
    echo.
    echo Starting MongoDB server...
    start "MongoDB Server" mongod --dbpath="C:\data\db"
    timeout /t 5 >nul
)

echo.
echo MongoDB should now be running on localhost:27017
echo.
echo You can now run:
echo   npm run seed    (to add sample data)
echo   npm run dev     (to start the POS system)
echo.
pause