const { getConnection } = require('../config/database');

// Function to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const earthRadius = 6371000; // Earth radius in meters
  
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return earthRadius * c; // Distance in meters
};

const getPresensi = async (req, res) => {
  try {
    const { user_id, tanggal } = req.query;
    const targetDate = tanggal || new Date().toISOString().split('T')[0];

    if (!user_id) {
      return res.json({ success: false, message: 'User ID diperlukan' });
    }

    const db = getConnection();

    // Get today's attendance
    const [todayRows] = await db.execute(
      'SELECT * FROM presensi WHERE id_user = ? AND DATE(tanggal) = ? ORDER BY tanggal DESC',
      [user_id, targetDate]
    );

    // Get recent attendance history
    const [historyRows] = await db.execute(
      'SELECT * FROM presensi WHERE id_user = ? ORDER BY tanggal DESC LIMIT 10',
      [user_id]
    );

    res.json({
      success: true,
      data: {
        presensi_hari_ini: todayRows[0] || null,
        riwayat_presensi: historyRows
      }
    });

  } catch (error) {
    console.error('Get presensi error:', error);
    res.json({ success: false, message: 'Database error: ' + error.message });
  }
};

const submitPresensi = async (req, res) => {
  try {
    const { user_id, jenis_presensi, latitude, longitude, foto, keterangan, tipe_lokasi } = req.body;

    if (!user_id || !jenis_presensi || !latitude || !longitude) {
      return res.json({ success: false, message: 'Data tidak lengkap' });
    }

    const db = getConnection();

    // Validasi lokasi
    let lokasi_valid = false;
    let nama_lokasi = '';

    // Ambil semua lokasi yang aktif (kantor tetap + dinas aktif)
    const [lokasiRows] = await db.execute(
      'SELECT * FROM lokasi_kantor WHERE status = "aktif" AND is_active = 1'
    );

    // Cek apakah user berada di salah satu lokasi yang diizinkan
    for (const lokasi of lokasiRows) {
      const distance = calculateDistance(
        parseFloat(latitude), 
        parseFloat(longitude), 
        parseFloat(lokasi.latitude), 
        parseFloat(lokasi.longitude)
      );
      
      console.log(`Checking location: ${lokasi.nama_lokasi}, Distance: ${distance}m, Radius: ${lokasi.radius}m`);
      
      if (distance <= lokasi.radius) {
        lokasi_valid = true;
        nama_lokasi = lokasi.nama_lokasi;
        if (lokasi.jenis_lokasi === 'dinas') {
          nama_lokasi += ' (Dinas)';
        }
        break;
      }
    }

    if (!lokasi_valid) {
      return res.json({ success: false, message: 'Anda berada di luar radius lokasi yang diizinkan' });
    }

    const now = new Date();
    const tanggal = now.toISOString().slice(0, 19).replace('T', ' ');
    const jam_sekarang = now.toTimeString().slice(0, 8);

    // Tentukan status berdasarkan jam masuk dan hari
    let status = 'Hadir';
    if (jenis_presensi === 'masuk') {
      // Ambil batas absen untuk hari ini
      const hari_ini = now.toLocaleDateString('en-US', { weekday: 'long' });
      const hari_indonesia = {
        'Monday': 'Senin',
        'Tuesday': 'Selasa', 
        'Wednesday': 'Rabu',
        'Thursday': 'Kamis',
        'Friday': 'Jumat',
        'Saturday': 'Sabtu',
        'Sunday': 'Minggu'
      };
      
      const hari = hari_indonesia[hari_ini] || 'Senin';
      
      const [jamKerjaRows] = await db.execute(
        'SELECT batas_absen FROM jam_kerja_hari WHERE hari = ?',
        [hari]
      );
      
      if (jamKerjaRows.length > 0 && jam_sekarang > jamKerjaRows[0].batas_absen) {
        status = 'Terlambat';
      }
    }

    if (jenis_presensi === 'masuk') {
      // Check if already checked in today
      const [existingRows] = await db.execute(
        'SELECT id_presensi FROM presensi WHERE id_user = ? AND DATE(tanggal) = ? AND jam_masuk IS NOT NULL',
        [user_id, now.toISOString().split('T')[0]]
      );

      if (existingRows.length > 0) {
        return res.json({ success: false, message: 'Anda sudah melakukan presensi masuk hari ini' });
      }

      await db.execute(`
        INSERT INTO presensi (
          id_user, tanggal, jam_masuk, lat_absen, long_absen, foto_selfie, 
          alasan_luar_lokasi, lokasi_absen, tipe_absen, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        user_id, tanggal, jam_sekarang, latitude, longitude, foto || null, 
        keterangan || null, nama_lokasi, tipe_lokasi || 'kantor', status
      ]);

    } else { // keluar
      // Update existing record
      const [result] = await db.execute(`
        UPDATE presensi SET 
          jam_pulang = ?, lat_pulang = ?, long_pulang = ?, foto_pulang = ?, lokasi_pulang = ? 
        WHERE id_user = ? AND DATE(tanggal) = ?
      `, [
        jam_sekarang, latitude, longitude, foto || null, nama_lokasi, 
        user_id, now.toISOString().split('T')[0]
      ]);

      if (result.affectedRows === 0) {
        return res.json({ success: false, message: 'Tidak ada data presensi masuk untuk hari ini' });
      }
    }

    res.json({ success: true, message: `Presensi ${jenis_presensi} berhasil di ${nama_lokasi}` });

  } catch (error) {
    console.error('Submit presensi error:', error);
    res.json({ success: false, message: 'Database error: ' + error.message });
  }
};

module.exports = { getPresensi, submitPresensi };