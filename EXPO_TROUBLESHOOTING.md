# Troubleshooting Expo Go "Something Went Wrong"

## Masalah yang Diperbaiki:
1. ✅ IP address config.ts: 192.168.1.8 (sesuai WiFi)
2. ✅ IP address .env: 192.168.1.8
3. ✅ Metro config: host 192.168.1.8
4. ✅ Package.json: versi React/RN kompatibel
5. ✅ Error handling dan debugging

## Langkah Menjalankan:

### Opsi 1: Menggunakan Script
```bash
start-expo.bat
```

### Opsi 2: Manual
```bash
# Bersihkan cache
npx expo start --clear

# Atau dengan host spesifik
npx expo start --clear --host 192.168.1.8
```

## Jika Masih Error:

### 1. Pastikan Server PHP Berjalan
- Buka browser: http://192.168.1.8/hadirinapp
- Harus bisa akses tanpa error

### 2. Restart Expo Go
- Tutup aplikasi Expo Go
- Buka lagi dan scan QR code baru

### 3. Periksa Firewall
- Pastikan port 8081 tidak diblokir
- Disable firewall sementara untuk test

### 4. Periksa Network
- Pastikan HP dan PC di network WiFi yang sama
- IP PC: 192.168.1.8
- Gateway: 192.168.1.1

### 5. Alternative: Tunnel
```bash
npx expo start --tunnel
```

## Debug Info:
- Platform: Windows
- WiFi IP: 192.168.1.8
- Gateway: 192.168.1.1
- Expo SDK: 54
- React Native: 0.76.5