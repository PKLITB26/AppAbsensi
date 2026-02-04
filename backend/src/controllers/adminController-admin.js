const bcrypt = require('bcryptjs');
const { getConnection } = require('../config/database');

const getAdminData = async (req, res) => {
  try {
    const db = await getConnection();

    // Get total pegawai count
    const [totalRows] = await db.execute(`
      SELECT COUNT(*) as total_pegawai
      FROM users u
      WHERE u.role = 'pegawai'
    `);
    const totalPegawai = totalRows[0].total_pegawai;

    // Get today's attendance stats
    const [statsRows] = await db.execute(`
      SELECT 
        COUNT(CASE WHEN pr.status IN ('Hadir', 'Terlambat') THEN 1 END) as hadir
      FROM presensi pr
      LEFT JOIN users u ON pr.id_user = u.id_user
      WHERE u.role = 'pegawai' 
      AND DATE(pr.tanggal) = CURDATE()
    `);
    const hadir = parseInt(statsRows[0].hadir || 0);
    const tidak_hadir = totalPegawai - hadir;

    console.log('Dashboard Stats:', { totalPegawai, hadir, tidak_hadir });

    // Get recent activities
    const [recentRows] = await db.execute(`
      SELECT 
        p.nama_lengkap,
        pr.status,
        TIME_FORMAT(pr.jam_masuk, '%H:%i') as jam_masuk
      FROM presensi pr
      LEFT JOIN users u ON pr.id_user = u.id_user
      LEFT JOIN pegawai p ON u.id_user = p.id_user
      WHERE u.role = 'pegawai' 
      AND DATE(pr.tanggal) = CURDATE()
      ORDER BY pr.jam_masuk DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      user: {
        id_user: 1,
        nama_lengkap: 'Administrator',
        email: 'admin@itb.ac.id',
        role: 'admin'
      },
      stats: {
        hadir: hadir,
        tidak_hadir: tidak_hadir,
        total_pegawai: parseInt(totalPegawai)
      },
      recent: recentRows || []
    });

  } catch (error) {
    console.error('Admin data error:', error);
    res.json({ success: false, message: 'Database error: ' + error.message });
  }
};

const updateAdminProfile = async (req, res) => {
  try {
    const { user_id, email, password_lama, password_baru } = req.body;
    
    if (!email) {
      return res.json({ success: false, message: 'Email harus diisi' });
    }

    const db = await getConnection();

    // Update email
    await db.execute('UPDATE users SET email = ? WHERE id_user = ?', [email, user_id]);

    // Update password if provided
    if (password_lama && password_baru) {
      const [userRows] = await db.execute('SELECT password FROM users WHERE id_user = ?', [user_id]);
      const user = userRows[0];

      if (!user || !(await bcrypt.compare(password_lama, user.password))) {
        return res.json({ success: false, message: 'Password lama salah' });
      }

      const hashedPassword = await bcrypt.hash(password_baru, 10);
      await db.execute('UPDATE users SET password = ? WHERE id_user = ?', [hashedPassword, user_id]);
    }

    res.json({ success: true, message: 'Profil berhasil diupdate' });

  } catch (error) {
    console.error('Update admin profile error:', error);
    res.json({ success: false, message: 'Database error: ' + error.message });
  }
};

module.exports = { getAdminData, updateAdminProfile };
