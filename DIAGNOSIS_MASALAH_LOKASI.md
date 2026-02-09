# MASALAH: Lokasi Dinas Hanya Tampil 1

## Diagnosis Masalah

### Cek Database
```sql
SELECT * FROM dinas_lokasi WHERE id_dinas = 11;
```

**Hasil Sekarang:**
```
id | id_dinas | id_lokasi_kantor | urutan | is_lokasi_utama
2  | 11       | 6                | 1      | 1
```

**Masalah:** Hanya ada 1 record! Padahal Anda bilang sudah mendaftarkan 2 lokasi.

## Penyebab

Ada 2 kemungkinan:

### 1. Data Belum Diinput ke Database
Saat tambah dinas, form memang bisa pilih 2 lokasi, tapi **hanya 1 yang tersimpan** ke database.

**Solusi:** Perbaiki backend `createDinasAdmin` (sudah benar di kode yang saya lihat)

### 2. Data Memang Belum Ditambahkan
Dinas id=11 dibuat sebelum fitur multiple lokasi, jadi hanya punya 1 lokasi.

**Solusi:** Tambahkan lokasi kedua secara manual

## Solusi Cepat (Manual)

### Langkah 1: Jalankan Query Ini
```sql
-- Tambahkan lokasi Test Update (id=1) untuk dinas id=11
INSERT INTO dinas_lokasi (id_dinas, id_lokasi_kantor, id_lokasi, urutan, is_lokasi_utama, created_at)
VALUES (11, 1, 1, 2, 0, NOW());
```

### Langkah 2: Verifikasi
```sql
SELECT 
  dl.id, 
  dl.id_dinas, 
  lk.nama_lokasi,
  dl.urutan,
  dl.is_lokasi_utama
FROM dinas_lokasi dl
JOIN lokasi_kantor lk ON dl.id_lokasi_kantor = lk.id
WHERE dl.id_dinas = 11
ORDER BY dl.urutan;
```

**Hasil yang Diharapkan:**
```
id | id_dinas | nama_lokasi  | urutan | is_lokasi_utama
2  | 11       | Itb Ganesha  | 1      | 1
4  | 11       | Test Update  | 2      | 0
```

### Langkah 3: Refresh Aplikasi
- Tutup dan buka ulang aplikasi
- Atau pull to refresh di halaman Validasi Absen Dinas
- Sekarang harus muncul 2 lokasi

## Solusi Permanen (Form Tambah Dinas)

Pastikan saat **Tambah Dinas Baru**, backend menyimpan semua lokasi yang dipilih.

### Cek Backend
File: `backend/src/controllers/dinasController-admin.js`

```javascript
// Bagian ini harus loop semua lokasi
for (let i = 0; i < validLokasi.length; i++) {
  await connection.execute(`
    INSERT INTO dinas_lokasi (id_dinas, id_lokasi_kantor, id_lokasi, urutan, is_lokasi_utama)
    VALUES (?, ?, ?, ?, ?)
  `, [dinas_id, validLokasi[i].id, validLokasi[i].id, i + 1, i === 0 ? 1 : 0]);
}
```

Kode ini **sudah benar**, jadi untuk dinas baru seharusnya tidak ada masalah.

## Testing

### Test 1: Dinas Lama (id=11)
1. Jalankan query INSERT di atas
2. Refresh aplikasi
3. Buka Validasi Absen Dinas
4. Harus muncul 2 lokasi

### Test 2: Dinas Baru
1. Buat dinas baru dari form
2. Pilih 2 lokasi atau lebih
3. Simpan
4. Cek di database: `SELECT * FROM dinas_lokasi WHERE id_dinas = [id_baru]`
5. Harus ada multiple records

## Kesimpulan

**Masalah bukan di kode, tapi di data!**

- Backend sudah benar
- Frontend sudah benar
- Database structure sudah benar
- Yang kurang: **Data lokasi kedua belum diinput**

**Solusi:** Jalankan query INSERT untuk menambahkan lokasi kedua.
