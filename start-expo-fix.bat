@echo off
echo ========================================
echo   EXPO GO TROUBLESHOOTING SCRIPT
echo ========================================
echo.
echo Langkah-langkah:
echo 1. Pastikan backend server berjalan di port 3000
echo 2. HP dan laptop terhubung WiFi yang sama
echo 3. Buka Expo Go di HP
echo 4. Scan QR code
echo.
echo Starting Expo with tunnel mode...
echo (Tunnel mode membantu jika ada masalah jaringan)
echo.
npx expo start --tunnel --clear
pause