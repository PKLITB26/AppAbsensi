# Troubleshooting Expo Go Connection

## Masalah Teridentifikasi:
- IP Address: 10.251.109.151 (Private Network)
- McAfee VPN adapter detected (disconnected)
- Kemungkinan firewall/network blocking

## Solusi:

### 1. Gunakan Tunnel Mode
```bash
npx expo start --tunnel
```

### 2. Set IP Manual
```bash
npx expo start --host 10.251.109.151
```

### 3. Clear Cache dan Restart
```bash
npx expo start --clear --tunnel
```

### 4. Cek Firewall Windows
- Buka Windows Defender Firewall
- Allow "Node.js" dan "Expo CLI" through firewall

### 5. Disable VPN/Proxy sementara
- Pastikan McAfee VPN benar-benar off
- Disable proxy settings di browser

### 6. Alternative: Gunakan USB Debugging
```bash
npx expo start --localhost
# Kemudian gunakan USB untuk connect ke device
```