# Edit Profile Admin - Documentation

## Overview
Fitur Edit Profile Admin memungkinkan administrator untuk mengubah informasi profil mereka termasuk nama lengkap, email, nomor telepon, dan foto profil.

## Files Created/Modified

### Frontend
1. **app/profile-admin/edit-profil.tsx** (NEW)
   - Halaman edit profile admin
   - Form dengan validasi
   - Upload foto profil
   - Integrasi dengan API
   - TIDAK muncul di bottom navigation

2. **app/profile-admin/_layout.tsx** (NEW)
   - Layout untuk folder profile-admin
   - Menggunakan Stack navigation
   - Menyembunyikan header default

3. **app/admin/profil-admin.tsx** (MODIFIED)
   - Menambahkan navigasi ke halaman edit
   - Menampilkan foto profil dari database
   - Auto-refresh saat kembali dari edit
   - Menampilkan nama lengkap dari database

### Backend
3. **backend/src/controllers/adminController-admin.js** (MODIFIED)
   - Menambahkan `getAdminProfile()` - GET profile admin
   - Menambahkan `updateAdminProfileData()` - UPDATE profile admin
   - Menambahkan konfigurasi multer untuk upload foto
   - Validasi email duplikat
   - Delete foto lama saat upload foto baru

4. **backend/src/routes/admin-admin.js** (MODIFIED)
   - GET `/admin/api/admin/profile` - Ambil data profile
   - PUT `/admin/api/admin/profile` - Update profile (dengan upload foto)

5. **backend/uploads/admin/** (NEW)
   - Folder untuk menyimpan foto profil admin

## Database Changes
Kolom yang ditambahkan ke tabel `users`:
```sql
ALTER TABLE `users` 
ADD COLUMN `nama_lengkap` VARCHAR(100) AFTER `role`,
ADD COLUMN `foto_profil` VARCHAR(255) AFTER `nama_lengkap`,
ADD COLUMN `no_telepon` VARCHAR(15) AFTER `foto_profil`;
```

## API Endpoints

### 1. GET Profile Admin
**Endpoint:** `GET /admin/api/admin/profile`

**Headers:**
```
Content-Type: application/json
user-id: {admin_user_id}
```

**Response Success:**
```json
{
  "success": true,
  "data": {
    "id_user": 10,
    "email": "admin@itb.ac.id",
    "nama_lengkap": "Administrator",
    "foto_profil": "uploads/admin/admin-1234567890.jpg",
    "no_telepon": "081234567890",
    "role": "admin"
  }
}
```

### 2. UPDATE Profile Admin
**Endpoint:** `PUT /admin/api/admin/profile`

**Headers:**
```
user-id: {admin_user_id}
Content-Type: multipart/form-data
```

**Body (FormData):**
- `nama_lengkap` (string) - Nama lengkap admin
- `email` (string) - Email admin
- `no_telepon` (string) - Nomor telepon admin
- `foto_profil` (file) - File foto profil (optional, max 2MB, jpg/png)

**Response Success:**
```json
{
  "success": true,
  "message": "Profil berhasil diperbarui",
  "data": {
    "id_user": 10,
    "email": "admin@itb.ac.id",
    "nama_lengkap": "Administrator",
    "foto_profil": "uploads/admin/admin-1234567890.jpg",
    "no_telepon": "081234567890",
    "role": "admin"
  }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Email sudah digunakan"
}
```

## Features

### 1. Form Validation
- **Nama Lengkap:** Tidak boleh kosong
- **Email:** Format email valid (regex validation)
- **Nomor Telepon:** 10-15 digit angka (optional)
- **Foto Profil:** Max 2MB, format JPG/PNG

### 2. Photo Upload
- Pilih dari galeri
- Preview foto sebelum upload
- Auto-delete foto lama saat upload foto baru
- Foto disimpan di `backend/uploads/admin/`

### 3. UI/UX
- Layout sesuai referensi Threads
- Foto profil di kanan atas, sejajar dengan field "Nama Lengkap"
- Semua field dalam satu card putih
- Divider antar field
- Tombol "Simpan" di header (kanan)
- Loading indicator saat menyimpan
- Error message di bawah input yang error
- Auto-navigate back setelah berhasil save

### 4. Data Persistence
- Data disimpan ke database MySQL
- AsyncStorage diupdate setelah save
- Auto-refresh profil saat kembali dari edit

## User Flow
1. User buka halaman Profil Admin
2. User klik tombol "Edit Profil"
3. Navigasi ke halaman Edit Profil Admin
4. Form otomatis terisi dengan data saat ini
5. User ubah data yang ingin diubah
6. User klik "Simpan" di header
7. Validasi input di frontend
8. Kirim data ke API
9. Jika berhasil: Alert sukses → Kembali ke Profil Admin
10. Data di Profil Admin otomatis terupdate

## Testing Checklist
- [ ] GET profile admin berhasil
- [ ] UPDATE nama lengkap berhasil
- [ ] UPDATE email berhasil
- [ ] UPDATE nomor telepon berhasil
- [ ] Upload foto profil berhasil
- [ ] Validasi email duplikat berfungsi
- [ ] Validasi format email berfungsi
- [ ] Validasi nomor telepon berfungsi
- [ ] Foto lama terhapus saat upload foto baru
- [ ] AsyncStorage terupdate setelah save
- [ ] Profil admin auto-refresh setelah edit
- [ ] Error handling berfungsi dengan baik

## Notes
- Foto profil disimpan di `backend/uploads/admin/`
- Foto profil diakses via URL: `http://localhost:3000/uploads/admin/filename.jpg`
- Foto lama otomatis dihapus saat upload foto baru
- Email harus unique (tidak boleh duplikat dengan user lain)
- Password tidak bisa diubah di halaman ini (ada di menu Keamanan terpisah)
- **Halaman edit profile TIDAK muncul di bottom navigation** karena berada di folder `profile-admin/`
- Folder `profile-admin/` khusus untuk semua halaman terkait profile admin (edit, keamanan, dll)
- Halaman hanya bisa diakses melalui tombol "Edit Profile" di halaman profil admin
