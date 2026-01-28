const { getConnection } = require('../config/database');

const getProfile = async (req, res) => {
  try {
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.json({ success: false, message: 'User ID diperlukan' });
    }

    const db = getConnection();

    // First check if user exists
    const [userRows] = await db.execute('SELECT id_user, email, role FROM users WHERE id_user = ?', [user_id]);
    const userExists = userRows[0];

    if (!userExists) {
      return res.json({ success: false, message: 'User tidak ditemukan' });
    }

    if (userExists.role !== 'pegawai') {
      return res.json({ success: false, message: 'User bukan pegawai' });
    }

    // Get full profile data
    const [profileRows] = await db.execute(`
      SELECT u.id_user, u.email, u.role, p.nama_lengkap, p.nip, p.jabatan, 
             p.divisi, p.no_telepon, p.alamat, p.jenis_kelamin, p.tanggal_lahir, p.foto_profil 
      FROM users u 
      LEFT JOIN pegawai p ON u.id_user = p.id_user 
      WHERE u.id_user = ?
    `, [user_id]);

    const user = profileRows[0];

    if (user) {
      // If no pegawai data, create default structure
      if (!user.nama_lengkap) {
        user.nama_lengkap = user.email;
        user.jabatan = 'Pegawai';
      }

      res.json({
        success: true,
        data: user,
        debug: {
          user_id: user_id,
          has_pegawai_data: !!user.nama_lengkap
        }
      });
    } else {
      res.json({ success: false, message: 'Data tidak ditemukan' });
    }

  } catch (error) {
    console.error('Get profile error:', error);
    res.json({ success: false, message: 'Database error: ' + error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { user_id, nama_lengkap, no_telepon, alamat } = req.body;

    if (!user_id) {
      return res.json({ success: false, message: 'User ID diperlukan' });
    }

    const db = getConnection();

    // Check if pegawai record exists
    const [checkRows] = await db.execute('SELECT id_user FROM pegawai WHERE id_user = ?', [user_id]);
    const exists = checkRows[0];

    let result;
    if (exists) {
      // Update existing record
      [result] = await db.execute(
        'UPDATE pegawai SET nama_lengkap = ?, no_telepon = ?, alamat = ? WHERE id_user = ?',
        [nama_lengkap, no_telepon, alamat, user_id]
      );
    } else {
      // Insert new record
      [result] = await db.execute(
        'INSERT INTO pegawai (id_user, nama_lengkap, no_telepon, alamat) VALUES (?, ?, ?, ?)',
        [user_id, nama_lengkap, no_telepon, alamat]
      );
    }

    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Profil berhasil diperbarui' });
    } else {
      res.json({ success: false, message: 'Gagal memperbarui profil' });
    }

  } catch (error) {
    console.error('Update profile error:', error);
    res.json({ success: false, message: 'Database error: ' + error.message });
  }
};

module.exports = { getProfile, updateProfile };