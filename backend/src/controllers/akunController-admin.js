const bcrypt = require('bcryptjs');
const { getConnection } = require('../config/database');

const getAkunLogin = async (req, res) => {
  try {
    const db = getConnection();
    
    const [rows] = await db.execute(`
      SELECT u.*, p.nama_lengkap 
      FROM users u 
      LEFT JOIN pegawai p ON u.id_user = p.id_user 
      ORDER BY u.id_user DESC
    `);
    
    res.json({
      success: true,
      message: 'Data berhasil diambil',
      data: rows
    });
    
  } catch (error) {
    console.error('Get akun login error:', error);
    res.json({ success: false, message: 'Database error: ' + error.message });
  }
};

const createAkun = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    if (!email || !password || !role) {
      return res.json({ success: false, message: 'Email, password, dan role diperlukan' });
    }
    
    const db = getConnection();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await db.execute('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, hashedPassword, role]);
    
    res.json({
      success: true,
      message: 'Akun berhasil ditambahkan'
    });
    
  } catch (error) {
    console.error('Create akun error:', error);
    res.json({ success: false, message: 'Database error: ' + error.message });
  }
};

const deleteAkun = async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getConnection();
    await db.execute('DELETE FROM users WHERE id_user = ?', [id]);
    
    res.json({
      success: true,
      message: 'Akun berhasil dihapus'
    });
    
  } catch (error) {
    console.error('Delete akun error:', error);
    res.json({ success: false, message: 'Database error: ' + error.message });
  }
};

const checkEmails = async (req, res) => {
  try {
    const db = getConnection();
    
    const [rows] = await db.execute('SELECT email FROM users ORDER BY email ASC');
    
    res.json({
      success: true,
      data: rows.map(row => row.email)
    });
    
  } catch (error) {
    console.error('Check emails error:', error);
    res.json({ success: false, message: 'Database error: ' + error.message });
  }
};

module.exports = { getAkunLogin, createAkun, deleteAkun, checkEmails };