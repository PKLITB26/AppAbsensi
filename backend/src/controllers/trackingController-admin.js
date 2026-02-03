const { getConnection } = require('../config/database');

const getTracking = async (req, res) => {
  try {
    const db = await getConnection();

    // Get tracking data for pegawai only (exclude admin)
    const [results] = await db.execute(`
      SELECT 
        p.id_pegawai,
        p.nama_lengkap,
        p.nip,
        pr.tanggal,
        pr.jam_masuk,
        pr.status,
        pr.lat_absen,
        pr.long_absen
      FROM pegawai p
      LEFT JOIN users u ON p.id_user = u.id_user
      LEFT JOIN presensi pr ON p.id_user = pr.id_user
      WHERE u.role = 'pegawai' AND p.id_user IS NOT NULL
      AND pr.tanggal = CURDATE()
      ORDER BY pr.jam_masuk DESC
    `);

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Tracking error:', error);
    res.json({ success: false, message: 'Database error: ' + error.message });
  }
};

module.exports = { getTracking };
