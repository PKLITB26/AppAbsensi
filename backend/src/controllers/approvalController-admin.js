const { getConnection } = require('../config/database');

const getApproval = async (req, res) => {
  try {
    const db = getConnection();

    // Get pengajuan from pegawai only (exclude admin) - ONLY PENDING status
    const [results] = await db.execute(`
      SELECT 
        pg.id_pengajuan,
        pg.jenis_pengajuan,
        pg.tanggal_mulai,
        pg.tanggal_selesai,
        pg.jam_mulai,
        pg.jam_selesai,
        pg.alasan_text,
        pg.lokasi_dinas,
        pg.status,
        pg.tanggal_pengajuan,
        p.nama_lengkap,
        p.nip
      FROM pengajuan pg
      LEFT JOIN users u ON pg.id_user = u.id_user
      LEFT JOIN pegawai p ON u.id_user = p.id_user
      WHERE u.role = 'pegawai' 
      AND pg.status = 'pending'
      AND pg.jenis_pengajuan NOT IN ('dinas_lokal', 'dinas_luar_kota', 'dinas_luar_negeri')
      ORDER BY pg.tanggal_pengajuan DESC
    `);

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Approval error:', error);
    res.json({ success: false, message: 'Database error: ' + error.message });
  }
};

const updateApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, keterangan_admin } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.json({ success: false, message: 'Status tidak valid' });
    }

    const db = getConnection();

    const [result] = await db.execute(`
      UPDATE pengajuan 
      SET status = ?, keterangan_admin = ?, tanggal_approval = NOW()
      WHERE id_pengajuan = ?
    `, [status, keterangan_admin || null, id]);

    if (result.affectedRows > 0) {
      res.json({
        success: true,
        message: `Pengajuan berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`
      });
    } else {
      res.json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

  } catch (error) {
    console.error('Update approval error:', error);
    res.json({ success: false, message: 'Database error: ' + error.message });
  }
};

module.exports = { getApproval, updateApproval };