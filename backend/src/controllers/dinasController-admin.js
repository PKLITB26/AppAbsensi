const { getConnection } = require('../config/database');

const getDinasAktifAdmin = async (req, res) => {
  try {
    const db = await getConnection();

    const [rows] = await db.execute(`
      SELECT d.*, 
             COUNT(dp.id) as total_pegawai,
             SUM(CASE WHEN ad.status = 'hadir' THEN 1 ELSE 0 END) as hadir_count
      FROM dinas d 
      LEFT JOIN dinas_pegawai dp ON d.id_dinas = dp.id_dinas 
      LEFT JOIN absen_dinas ad ON d.id_dinas = ad.id_dinas AND dp.id_user = ad.id_user
      WHERE d.status = 'aktif' 
      AND d.tanggal_selesai >= CURDATE()
      GROUP BY d.id_dinas 
      ORDER BY d.tanggal_mulai ASC
    `);

    const dinas_list = [];

    for (const row of rows) {
      // Get pegawai details for this dinas
      const [pegawaiRows] = await db.execute(`
        SELECT dp.*, p.nama_lengkap, p.nip,
               ad.jam_masuk, ad.jam_pulang, ad.status as absen_status
        FROM dinas_pegawai dp 
        JOIN users u ON dp.id_user = u.id_user
        JOIN pegawai p ON u.id_user = p.id_user
        LEFT JOIN absen_dinas ad ON dp.id_dinas = ad.id_dinas AND dp.id_user = ad.id_user
        WHERE dp.id_dinas = ?
      `, [row.id_dinas]);

      const pegawai = pegawaiRows.map(pegawaiRow => {
        let status = 'belum_absen';
        if (pegawaiRow.absen_status === 'hadir') {
          status = 'hadir';
        } else if (pegawaiRow.absen_status === 'terlambat') {
          status = 'terlambat';
        }

        return {
          nama: pegawaiRow.nama_lengkap,
          status: status,
          jamAbsen: pegawaiRow.jam_masuk
        };
      });

      dinas_list.push({
        id: row.id_dinas,
        namaKegiatan: row.nama_kegiatan,
        nomorSpt: row.nomor_spt,
        lokasi: row.alamat_lengkap,
        jamKerja: `${row.jam_mulai}-${row.jam_selesai}`,
        radius: row.radius_absen,
        tanggal_mulai: row.tanggal_mulai,
        tanggal_selesai: row.tanggal_selesai,
        pegawai: pegawai
      });
    }

    res.json(dinas_list);

  } catch (error) {
    console.error('Get dinas aktif error:', error);
    res.json({ success: false, message: 'Database error: ' + error.message });
  }
};

const createDinasAdmin = async (req, res) => {
  try {
    const { nama_kegiatan, nomor_spt, tanggal_mulai, tanggal_selesai, pegawai_ids, alamat_lengkap, latitude, longitude, radius_absen, jam_mulai, jam_selesai, jenis_dinas, deskripsi } = req.body;

    // Validate required fields
    const required_fields = ['nama_kegiatan', 'nomor_spt', 'tanggal_mulai', 'tanggal_selesai', 'pegawai_ids'];
    for (const field of required_fields) {
      if (!req.body[field] || (typeof req.body[field] === 'string' && req.body[field].trim() === '')) {
        return res.status(400).json({
          success: false,
          message: `Field '${field}' is required`
        });
      }
    }

    if (!Array.isArray(pegawai_ids) || pegawai_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one pegawai must be selected'
      });
    }

    const db = await getConnection();

    // Get valid admin user ID for created_by
    const [adminRows] = await db.execute('SELECT id_user FROM users WHERE role = "admin" ORDER BY id_user LIMIT 1');
    let adminUser = adminRows[0];

    if (!adminUser) {
      const [userRows] = await db.execute('SELECT id_user FROM users ORDER BY id_user LIMIT 1');
      adminUser = userRows[0];
      if (!adminUser) {
        return res.status(400).json({
          success: false,
          message: 'No users found in database'
        });
      }
    }

    // Validate pegawai_ids
    const placeholders = pegawai_ids.map(() => '?').join(',');
    const [validUsers] = await db.execute(`SELECT id_user FROM users WHERE id_user IN (${placeholders})`, pegawai_ids);

    if (validUsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid pegawai IDs found in database'
      });
    }

    await db.beginTransaction();

    try {
      // Insert dinas data
      const [result] = await db.execute(`
        INSERT INTO dinas (
          nama_kegiatan, nomor_spt, jenis_dinas, tanggal_mulai, tanggal_selesai,
          jam_mulai, jam_selesai, alamat_lengkap, latitude, longitude, radius_absen,
          deskripsi, status, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aktif', ?, NOW())
      `, [
        nama_kegiatan.trim(),
        nomor_spt.trim(),
        jenis_dinas || 'lokal',
        tanggal_mulai,
        tanggal_selesai,
        jam_mulai || '08:00:00',
        jam_selesai || '17:00:00',
        alamat_lengkap || 'Lokasi Dinas',
        latitude || -6.8915,
        longitude || 107.6107,
        radius_absen || 100,
        deskripsi || '',
        adminUser.id_user
      ]);

      const dinas_id = result.insertId;

      // Insert pegawai dinas relationships
      for (const user of validUsers) {
        await db.execute(`
          INSERT INTO dinas_pegawai (id_dinas, id_user, status_konfirmasi, tanggal_konfirmasi)
          VALUES (?, ?, 'konfirmasi', NOW())
        `, [dinas_id, user.id_user]);
      }

      await db.commit();

      res.status(201).json({
        success: true,
        message: 'Data dinas berhasil disimpan',
        data: {
          dinas_id: dinas_id,
          nama_kegiatan: nama_kegiatan,
          nomor_spt: nomor_spt
        }
      });

    } catch (error) {
      await db.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Create dinas error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getRiwayatDinasAdmin = async (req, res) => {
  try {
    const db = await getConnection();

    const [rows] = await db.execute(`
      SELECT d.*, 
             COUNT(dp.id) as total_pegawai,
             SUM(CASE WHEN ad.status = 'hadir' THEN 1 ELSE 0 END) as hadir_count
      FROM dinas d 
      LEFT JOIN dinas_pegawai dp ON d.id_dinas = dp.id_dinas 
      LEFT JOIN absen_dinas ad ON d.id_dinas = ad.id_dinas AND dp.id_user = ad.id_user
      WHERE d.status IN ('selesai', 'dibatalkan')
      GROUP BY d.id_dinas 
      ORDER BY d.tanggal_mulai DESC
    `);

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('Get riwayat dinas error:', error);
    res.json({ success: false, message: 'Database error: ' + error.message });
  }
};

const getValidasiAbsenAdmin = async (req, res) => {
  try {
    const db = await getConnection();

    const [rows] = await db.execute(`
      SELECT ad.*, p.nama_lengkap, p.nip, d.nama_kegiatan
      FROM absen_dinas ad
      JOIN users u ON ad.id_user = u.id_user
      JOIN pegawai p ON u.id_user = p.id_user
      JOIN dinas d ON ad.id_dinas = d.id_dinas
      WHERE ad.status_validasi = 'pending'
      ORDER BY ad.tanggal_absen DESC
    `);

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('Get validasi absen error:', error);
    res.json({ success: false, message: 'Database error: ' + error.message });
  }
};

module.exports = { 
  getDinasAktifAdmin, 
  createDinasAdmin, 
  getRiwayatDinasAdmin, 
  getValidasiAbsenAdmin 
};
