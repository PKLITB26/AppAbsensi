@echo off
echo Membersihkan cache Expo...
npx expo start --clear --host 192.168.1.8

echo.
echo Jika masih error, coba:
echo 1. Pastikan server PHP berjalan di http://192.168.1.8/hadirinapp
echo 2. Restart Expo Go app
echo 3. Scan QR code lagi