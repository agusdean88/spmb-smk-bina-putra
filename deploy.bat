@echo off
echo ===================================================
echo    DEPLOYING SPMB SMK BINA PUTRA TO VERCEL
echo ===================================================
echo.
echo [1/2] Logging into Vercel...
echo Please follow the link in your browser and authorize the login.
echo.
call npx vercel login
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Login failed. Please try again.
    echo.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] Deploying application to Vercel...
echo This will automatically build the frontend, generate the Prisma Client,
echo and upload the files to Vercel.
echo.
call npx vercel --prod --yes
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Deployment failed.
    echo.
    pause
    exit /b %errorlevel%
)

echo.
echo ===================================================
echo    DEPLOYMENT COMPLETED SUCCESSFULLY!
echo    Your website is now online!
echo ===================================================
echo.
pause
