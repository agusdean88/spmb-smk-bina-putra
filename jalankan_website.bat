@echo off
echo ====================================================
echo   MEMULAI SISTEM PPDB SMK BINA PUTRA (PM2 MODE)
echo ====================================================
echo.

:: Cek apakah PM2 terinstal
where pm2 >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] PM2 belum terinstal. Menginstal sekarang...
    npm install -g pm2
)

echo [1/3] Menghentikan sesi lama (jika ada)...
pm2 delete spmb-backend spmb-frontend >nul 2>nul

echo [2/3] Menjalankan Backend dan Frontend...
pm2 start ecosystem.config.js

echo [3/3] Membuka Website di Browser...
start http://localhost:5173

echo.
echo ====================================================
echo  Website sedang berjalan di latar belakang!
echo  Gunakan 'pm2 status' untuk melihat status.
echo  Gunakan 'pm2 logs' untuk melihat jika ada error.
echo ====================================================
echo.
pause
