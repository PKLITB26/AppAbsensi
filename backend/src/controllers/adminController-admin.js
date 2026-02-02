const bcrypt = require('bcryptjs');
const { getConnection } = require('../config/database');

const getAdminData = async (req, res) => {
  try {
    const { user_id } = req.query;
    const db = getConnection();

    // Get admin info
    let adminQuery = 'SELECT id_user, email, role FROM users WHERE role = "admin"';
    let params = [];
    
    if (user_id) {
      adminQuery += ' AND id_user = ?';
      params.push(user_id);
    } else {
      adminQuery += ' LIMIT 1';
    }

    const [adminRows] = await db.execute(adminQuery, params);
    const admin = adminRows[0];

    if (!admin) {
      return res.json({ success: false, message: 'Admin tidak ditemukan' });
    }

    // Get today's attendance stats (only pegawai)
    const [statsRows] = await db.execute(`
      SELECT 
        COUNT(CASE WHEN pr.status = 'Hadir' THEN 1 END) as hadir,
        COUNT(CASE WHEN pr.status = 'Tidak Hadir' THEN 1 END) as tidak_hadir
      FROM presensi pr
      LEFT JOIN users u ON pr.id_user = u.id_user
      WHERE u.role = 'pegawai' 
      AND DATE(pr.tanggal) = CURDATE()
    `);
    const stats = statsRows[0];

    // Get total pegawai count from database
    const [totalRows] = await db.execute(`
      SELECT COUNT(*) as total_pegawai
      FROM users u
      WHERE u.role = 'pegawai'
    `);
    const totalPegawai = totalRows[0].total_pegawai;

    // Get recent activities (only pegawai)
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

    // Extract name from email for admin display
    let adminName = 'Administrator';
    if (admin && admin.email) {
      const emailParts = admin.email.split('@');
      if (emailParts.length > 1) {
        const domain = emailParts[1];
        if (domain.includes('itb.ac.id')) {
          adminName = 'Administrator ITB';
        } else {
          adminName = 'Administrator ' + domain.split('.')[0].toUpperCase();
        }
      }
    }

    res.json({
      success: true,
      user: {
        id_user: parseInt(admin.id_user),
        nama_lengkap: adminName,
        email: admin.email,
        role: admin.role
      },
      stats: {
        hadir: parseInt(stats.hadir || 0),
        tidak_hadir: parseInt(stats.tidak_hadir || 0),
        total_pegawai: parseInt(totalPegawai || 0)
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

    const db = getConnection();

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