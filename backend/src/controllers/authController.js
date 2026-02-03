const bcrypt = require('bcryptjs');
const { getConnection } = require('../config/database');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.json({ success: false, message: 'Email dan password harus diisi' });
    }

    const db = await getConnection();
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (user && await bcrypt.compare(password, user.password)) {
      res.json({
        success: true,
        message: 'Login berhasil',
        data: {
          id: user.id_user,
          email: user.email,
          role: user.role
        }
      });
    } else {
      res.json({ success: false, message: 'Email atau password salah' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.json({ success: false, message: 'Database error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.json({ success: false, message: 'User ID diperlukan' });
    }

    const db = await getConnection();
    const [rows] = await db.execute('SELECT * FROM users WHERE id_user = ?', [user_id]);
    const user = rows[0];

    if (!user) {
      return res.json({ success: false, message: 'User tidak ditemukan' });
    }

    res.json({
      success: true,
      data: {
        id_user: user.id_user,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.json({ success: false, message: 'Database error' });
  }
};

module.exports = { login, getProfile };
