const { getConnection } = require('../config/database');

const getDashboard = async (req, res) => {
  try {
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.json({ success: false, message: 'User ID diperlukan' });
    }

    const db = getConnection();
    
    // Get pegawai info
    const [pegawaiRows] = await db.execute(`
      SELECT p.*, u.email 
      FROM pegawai p 
      LEFT JOIN users u ON p.id_user = u.id_user 
      WHERE p.id_user = ?
    `, [user_id]);
    
    if (pegawaiRows.length === 0) {
      return res.json({ success: false, message: 'Pegawai tidak ditemukan' });
    }
    
    const pegawai = pegawaiRows[0];
    
    // Get today's attendance
    const [presensiRows] = await db.execute(`
      SELECT * FROM presensi 
      WHERE id_user = ? AND DATE(tanggal) = CURDATE()
    `, [user_id]);
    
    // Get this month's attendance stats
    const [statsRows] = await db.execute(`
      SELECT 
        COUNT(*) as total_hari,
        COUNT(CASE WHEN status = 'Hadir' THEN 1 END) as hadir,
        COUNT(CASE WHEN status = 'Terlambat' THEN 1 END) as terlambat,
        COUNT(CASE WHEN status = 'Tidak Hadir' THEN 1 END) as tidak_hadir
      FROM presensi 
      WHERE id_user = ? AND MONTH(tanggal) = MONTH(CURDATE()) AND YEAR(tanggal) = YEAR(CURDATE())
    `, [user_id]);
    
    res.json({
      success: true,
      data: {
        pegawai: pegawai,
        presensi_hari_ini: presensiRows[0] || null,
        stats_bulan_ini: statsRows[0] || {
          total_hari: 0,
          hadir: 0,
          terlambat: 0,
          tidak_hadir: 0
        }
      }
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    res.json({ success: false, message: 'Database error: ' + error.message });
  }
};

module.exports = { getDashboard };