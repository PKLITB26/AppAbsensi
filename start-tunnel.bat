@echo off
echo Memulai Expo dengan tunnel...
echo.
echo Jika ngrok timeout, coba:
echo 1. Install ngrok secara global
echo 2. Login ke ngrok account
echo.

REM Install ngrok global jika belum ada
npm install -g @expo/ngrok

REM Start dengan tunnel dan timeout lebih lama
set EXPO_TUNNEL_TIMEOUT=60000
npx expo start --tunnel --clear

pause