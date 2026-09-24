@echo off
chcp 65001 >nul
title Zombie Slayer Web - Sunucu Baslatici
color 0b

echo ================================================================
echo   🧟 ZOMBIE SLAYER: BIÇAK USTASI - WINDOWS DAHILI SUNUCU
echo ================================================================
echo.

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [HATA] Sisteminizde Python bulunamadi!
    echo Lutfen python.org adresinden Python yukleyin veya
    echo index.html dosyasina cift tiklayarak dogrudan oynayin.
    echo.
    pause
    exit /b
)

echo [1/2] Dahili Web Sunucusu ve SQLite Veritabani baslatiliyor...
echo [2/2] Tarayicida oyun aciliyor...
echo.
echo Sunucuyu durdurmak icin bu pencereyi kapatabilirsiniz.
echo.

start "" "http://localhost:8000"
python server.py 8000

pause
