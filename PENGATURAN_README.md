# Fitur Pengaturan Sistem - HadirinApp

## 📁 Struktur File

### Frontend (React Native)
```
app/pengaturan/
├── index.tsx              # Halaman utama pengaturan
├── jam-kerja.tsx          # Pengaturan jam kerja pegawai
├── kalender-libur.tsx     # Kalender hari libur
└── lokasi-kantor.tsx      # Pengaturan lokasi kantor
```

### Backend (PHP)
```
htdocs/hadirinapp/admin/pengaturan/api/
├── jam-kerja.php          # API jam kerja
├── hari-libur.php         # API hari libur
└── lokasi-kantor.php      # API lokasi kantor
```

## 🎯 Fitur Utama

### 1. Pengaturan Jam Kerja
**Fungsi:**
- Set jam masuk dan jam pulang default untuk semua pegawai
- Atur toleransi keterlambatan (dalam menit)
- Set batas waktu maksimal absen masuk

**Tabel Database:** `pengaturan_waktu`
- `jam_masuk` (TIME)
- `jam_pulang` (TIME)
- `toleransi_terlambat` (INT)
- `batas_absen_masuk` (TIME)

**API Endpoints:**
- GET `/admin/pengaturan/api/jam-kerja.php` - Ambil data jam kerja
- POST `/admin/pengaturan/api/jam-kerja.php` - Simpan/update jam kerja

### 2. Kalender Libur
**Fungsi:**
- Tampilan kalender bulanan interaktif
- Sabtu-Minggu otomatis ditandai sebagai weekend (merah muda)
- Klik tanggal untuk menambah hari libur khusus
- Hari libur ditandai dengan warna merah
- List semua hari libur yang sudah ditambahkan
- Hapus hari libur

**Tabel Database:** `hari_libur`
- `tanggal` (DATE)
- `nama_libur` (VARCHAR)
- `jenis` (ENUM: 'nasional', 'keagamaan', 'perusahaan')
- `is_active` (TINYINT)

**API Endpoints:**
- GET `/admin/pengaturan/api/hari-libur.php` - Ambil semua hari libur
- POST `/admin/pengaturan/api/hari-libur.php` - Tambah hari libur baru
- DELETE `/admin/pengaturan/api/hari-libur.php` - Hapus hari libur

### 3. Lokasi Kantor
**Fungsi:**
- Set lokasi kantor pusat untuk absensi harian
- Pilih lokasi menggunakan map picker
- Set radius absensi (50m - 500m)
- Reverse geocoding untuk mendapatkan alamat otomatis

**Tabel Database:** `lokasi_kantor`
- `nama_lokasi` (VARCHAR)
- `alamat` (TEXT)
- `latitude` (DECIMAL)
- `longitude` (DECIMAL)
- `radius` (INT)
- `is_active` (TINYINT)

**API Endpoints:**
- GET `/admin/pengaturan/api/lokasi-kantor.php` - Ambil lokasi kantor aktif
- POST `/admin/pengaturan/api/lokasi-kantor.php` - Simpan lokasi kantor baru

## 🔄 Logika Sistem

### Absensi Harian
```
IF hari ini = Sabtu/Minggu
  → Tidak wajib absen (weekend)
  
ELSE IF hari ini ada di tabel hari_libur
  → Tidak wajib absen (hari libur)
  
ELSE IF pegawai sedang dinas
  → Absen di lokasi dinas (dari tabel dinas)
  → Gunakan jam kerja dari data dinas
  
ELSE
  → Absen di lokasi kantor (dari tabel lokasi_kantor)
  → Gunakan jam kerja dari tabel pengaturan_waktu
```

### Validasi Keterlambatan
```
jam_absen = waktu pegawai absen
jam_masuk = dari pengaturan_waktu
toleransi = dari pengaturan_waktu

IF jam_absen <= (jam_masuk + toleransi)
  → Status: Hadir
ELSE
  → Status: Terlambat
```

## 🎨 UI/UX Features

### Kalender Libur
- **Warna Kalender:**
  - Putih: Hari kerja normal
  - Merah muda (#FFEBEE): Weekend (Sabtu-Minggu)
  - Merah (#FFCDD2): Hari libur nasional/khusus
  - Border biru: Tanggal hari ini

- **Interaksi:**
  - Klik tanggal kosong → Modal tambah libur
  - Klik tanggal libur → Alert dengan opsi hapus
  - Navigasi bulan dengan tombol prev/next

### Map Picker
- Tap pada peta untuk pilih lokasi
- Marker menunjukkan lokasi terpilih
- Tombol konfirmasi untuk simpan lokasi
- Reverse geocoding otomatis untuk alamat

## 📱 Integrasi dengan Modul Lain

### 1. Laporan Absen
- Kalender di laporan akan menampilkan hari libur dengan warna merah
- Weekend otomatis ditandai
- Filter data berdasarkan hari kerja

### 2. Dashboard Admin
- Statistik kehadiran tidak menghitung hari libur
- Ringkasan hanya untuk hari kerja

### 3. Presensi Pegawai
- Validasi lokasi menggunakan data dari lokasi_kantor
- Validasi jam menggunakan data dari pengaturan_waktu
- Tidak bisa absen di hari libur

## 🚀 Cara Akses

1. Login sebagai Admin
2. Dashboard Admin → Menu "Pengaturan"
3. Pilih submenu:
   - Jam Kerja
   - Kalender Libur
   - Lokasi Kantor

## ⚙️ Konfigurasi

### Update Config (constants/config.ts)
```typescript
ENDPOINTS: {
  JAM_KERJA: '/admin/pengaturan/api/jam-kerja.php',
  HARI_LIBUR: '/admin/pengaturan/api/hari-libur.php',
  LOKASI_KANTOR: '/admin/pengaturan/api/lokasi-kantor.php',
}

export const PengaturanAPI = {
  getJamKerja, saveJamKerja,
  getHariLibur, saveHariLibur, deleteHariLibur,
  getLokasiKantor, saveLokasiKantor
}
```

## 📊 Database Schema

Sudah tersedia di database `hadirin_db`:
- ✅ `pengaturan_waktu`
- ✅ `hari_libur`
- ✅ `lokasi_kantor`
- ✅ `pengaturan_sistem`

## ✨ Fitur Tambahan

1. **Auto-detect Weekend**: Sistem otomatis mendeteksi Sabtu-Minggu
2. **Reverse Geocoding**: Alamat otomatis dari koordinat
3. **Responsive Calendar**: Kalender menyesuaikan dengan ukuran layar
4. **Real-time Update**: Data langsung ter-update setelah disimpan
5. **Validation**: Validasi input di frontend dan backend

## 🔐 Security

- CORS enabled untuk mobile app
- Input validation di backend
- SQL injection prevention dengan prepared statements
- Soft delete untuk hari libur (is_active flag)

---

**Status:** ✅ Completed
**Version:** 1.0.0
**Last Updated:** 2026-01-13
