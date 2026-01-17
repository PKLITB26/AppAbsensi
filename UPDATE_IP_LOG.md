# RINGKASAN UPDATE KONFIGURASI IP - HadirinApp

## IP Configuration Terbaru
- **IP Wi-Fi Aktif**: 192.168.1.8
- **Subnet Mask**: 255.255.255.0  
- **Default Gateway**: 192.168.1.1
- **DNS Servers**: 192.168.1.1, 8.8.8.8, 8.8.4.4

## Perubahan yang Dilakukan

### 1. File Konfigurasi Baru
✅ **constants/config.ts** - File konfigurasi terpusat
- BASE_URL: 'http://192.168.1.8/hadirinapp'
- Semua endpoint API tersentralisasi
- Helper function getApiUrl()

### 2. File yang Diupdate (IP Lama: 10.251.109.131 → IP Baru: 192.168.1.8)

#### File Utama:
✅ **app/index.tsx** - Login screen
✅ **app/(tabs)/beranda.tsx** - Dashboard pegawai  
✅ **app/(tabs)/profil.tsx** - Profil pegawai

#### File Admin:
✅ **app/admin/dashboard-admin.tsx** - Dashboard admin
✅ **app/admin/tracking-admin.tsx** - Tracking lokasi pegawai
✅ **app/akun-login-admin.tsx** - Kelola akun login
✅ **app/approval-admin.tsx** - Persetujuan admin
✅ **app/data-pegawai-admin.tsx** - Data pegawai
✅ **app/laporan-admin.tsx** - Laporan (tidak ada API call)

#### File Manajemen Data:
✅ **app/add-akun-login.tsx** - Tambah akun login
✅ **app/add-data-pegawai.tsx** - Tambah data pegawai  
✅ **app/add-user.tsx** - Tambah user
✅ **app/users.tsx** - Kelola users

### 3. Endpoint API yang Dikonfigurasi
- LOGIN: '/login.php'
- TEST_API: '/test-api.php'  
- PROFILE: '/profile.php'
- DATA_PEGAWAI: '/data-pegawai.php'
- AKUN_LOGIN: '/akun-login.php'
- CHECK_EMAILS: '/check-emails.php'
- USERS: '/users.php'
- ADMIN: '/admin.php'
- TRACKING: '/tracking.php'
- APPROVAL: '/approval.php'

## Cara Menggunakan

### Untuk Update IP di Masa Depan:
1. Edit file `constants/config.ts`
2. Ubah nilai `BASE_URL` sesuai IP server baru
3. Tidak perlu mengubah file lain karena sudah menggunakan konfigurasi terpusat

### Contoh Penggunaan di Code:
```typescript
import { getApiUrl, API_CONFIG } from '../constants/config';

// Sebelum:
fetch('http://10.251.109.131/hadirinapp/login.php', {...})

// Sesudah:  
fetch(getApiUrl(API_CONFIG.ENDPOINTS.LOGIN), {...})
```

## Verifikasi
✅ Semua file telah diupdate
✅ Tidak ada IP lama (10.251.109.131) yang tersisa
✅ Konfigurasi terpusat sudah berfungsi
✅ IP baru (192.168.1.8) sudah diterapkan

## Catatan Penting
- Pastikan XAMPP/server PHP berjalan di IP 192.168.1.8
- Pastikan folder hadirinapp ada di htdocs
- Pastikan HP dan laptop terhubung ke WiFi yang sama (192.168.1.x)
- Database MySQL harus accessible dari IP ini

---
Update dilakukan pada: 13 Januari 2026
IP Configuration: 192.168.1.8/24