const { getConnection } = require('../config/database');

const getPengajuan = async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.json({ success: false, message: 'User ID diperlukan' });
    }

    const db = getConnection();

    const [pengajuan] = await db.execute(
      'SELECT * FROM pengajuan WHERE id_user = ? ORDER BY tanggal_pengajuan DESC',
      [user_id]
    );

    res.json({
      success: true,
      data: pengajuan
    });

  } catch (error) {
    console.error('Get pengajuan error:', error);
    res.json({ success: false, message: 'Database error: ' + error.message });
  }
};

const submitPengajuan = async (req, res) => {
  try {
    const { user_id, jenis_pengajuan, tanggal_mulai, tanggal_selesai, keterangan, dokumen } = req.body;

    if (!user_id || !jenis_pengajuan || !tanggal_mulai) {
      return res.json({ success: false, message: 'Data tidak lengkap' });
    }

    const db = getConnection();
    const tanggal_pengajuan = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const [result] = await db.execute(`
      INSERT INTO pengajuan (
        id_user, jenis_pengajuan, tanggal_mulai, tanggal_selesai, 
        keterangan, dokumen, tanggal_pengajuan, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      user_id, jenis_pengajuan, tanggal_mulai, tanggal_selesai || null, 
      keterangan || null, dokumen || null, tanggal_pengajuan
    ]);

    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Pengajuan berhasil dikirim' });
    } else {
      res.json({ success: false, message: 'Gagal mengirim pengajuan' });
    }

  } catch (error) {
    console.error('Submit pengajuan error:', error);
    res.json({ success: false, message: 'Database error: ' + error.message });
  }
};

module.exports = { getPengajuan, submitPengajuan };