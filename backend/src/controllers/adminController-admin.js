const bcrypt = require('bcryptjs');
const { getConnection } = require('../config/database');

const getAdminData = async (req, res) => {
  try {
    const { action, user_id } = req.body;
    
    // Handle update action
    if (action === 'update') {
      return await updateAdminProfile(req, res);
    }

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
    
    console.log('=== UPDATE PROFILE DEBUG ===');
    console.log('Request data:', { user_id, email, has_old_pass: !!password_lama, has_new_pass: !!password_baru });
    
    // Validate user_id
    const userId = parseInt(user_id);
    if (!user_id || isNaN(userId) || userId <= 0) {
      return res.json({ success: false, message: 'ID pengguna tidak valid' });
    }
    
    const db = await getConnection();

    // Update email if provided
    if (email && email.trim()) {
      await db.execute('UPDATE users SET email = ? WHERE id_user = ?', [email.trim(), userId]);
      console.log('Email updated successfully');
    }

    // Update password if both old and new passwords are provided
    if (password_lama && password_lama.trim() && password_baru && password_baru.trim()) {
      console.log('Processing password update...');
      
      // Get current password hash
      const [userRows] = await db.execute('SELECT password FROM users WHERE id_user = ?', [userId]);
      const user = userRows[0];
      
      if (!user) {
        console.log('User not found');
        return res.json({ success: false, message: 'User tidak ditemukan' });
      }
      
      console.log('Current password hash:', user.password.substring(0, 20) + '...');
      
      // Verify old password
      const isOldPasswordValid = await bcrypt.compare(password_lama.trim(), user.password);
      console.log('Old password valid:', isOldPasswordValid);
      
      if (!isOldPasswordValid) {
        return res.json({ success: false, message: 'Password lama salah' });
      }

      if (password_baru.trim().length < 6) {
        return res.json({ success: false, message: 'Password minimal 6 karakter' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password_baru.trim(), 10);
      console.log('New password hash:', hashedPassword.substring(0, 20) + '...');
      
      // Update password
      const [updateResult] = await db.execute('UPDATE users SET password = ? WHERE id_user = ?', [hashedPassword, userId]);
      console.log('Password update result:', updateResult);
      
      // Verify update
      const [verifyRows] = await db.execute('SELECT password FROM users WHERE id_user = ?', [userId]);
      console.log('Password updated in DB:', verifyRows[0].password.substring(0, 20) + '...');
    }

    console.log('=== UPDATE COMPLETE ===');
    res.json({ success: true, message: 'Profil berhasil diupdate' });

  } catch (error) {
    console.error('Update admin profile error:', error);
    res.json({ success: false, message: 'Kesalahan database: ' + error.message });
  }
};


module.exports = { getAdminData, updateAdminProfile };
