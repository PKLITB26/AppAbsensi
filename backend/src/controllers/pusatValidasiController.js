const { getConnection } = require('../config/database');

const pusatValidasiController = {

  // Get absen dinas yang menunggu validasi
  getAbsenDinas: async (req, res) => {
    try {
      const db = await getConnection();
      const query = `
        SELECT 
          ad.id,
          ad.id_dinas,
          ad.id_user,
          ad.tanggal_absen,
          ad.jam_masuk,
          ad.latitude_masuk,
          ad.longitude_masuk,
          ad.foto_masuk,
          ad.status,
          ad.status_validasi,
          ad.keterangan,
          pg.nama_lengkap,
          pg.nip,
          d.nama_kegiatan,
          d.nomor_spt,
          d.alamat_lengkap
        FROM absen_dinas ad
        JOIN users u ON ad.id_user = u.id_user
        JOIN pegawai pg ON u.id_user = pg.id_user
        JOIN dinas d ON ad.id_dinas = d.id_dinas
        WHERE ad.status_validasi = 'menunggu'
        ORDER BY ad.tanggal_absen DESC, ad.jam_masuk DESC
      `;
      
      const [results] = await db.execute(query);
      
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Error getting absen dinas:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data absen dinas'
      });
    }
  },

  // Get pengajuan yang menunggu persetujuan
  getPengajuan: async (req, res) => {
    try {
      const db = await getConnection();
      const query = `
        SELECT 
          p.id_pengajuan,
          p.id_user,
          p.jenis_pengajuan,
          p.tanggal_mulai,
          p.tanggal_selesai,
          p.jam_mulai,
          p.jam_selesai,
          p.alasan_text,
          p.lokasi_dinas,
          p.dokumen_foto,
          p.status,
          p.is_retrospektif,
          p.tanggal_pengajuan,
          pg.nama_lengkap,
          pg.nip,
          pg.jabatan,
          pg.divisi
        FROM pengajuan p
        JOIN users u ON p.id_user = u.id_user
        JOIN pegawai pg ON u.id_user = pg.id_user
        WHERE p.status = 'menunggu'
        ORDER BY p.tanggal_pengajuan DESC
      `;
      
      const [results] = await db.execute(query);
      
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Error getting pengajuan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data pengajuan'
      });
    }
  },

  // Get statistik untuk ringkasan validasi
  getStatistik: async (req, res) => {
    try {
      const db = await getConnection();
      
      // ABSEN DINAS
      // Perlu Validasi
      const [perluValidasi] = await db.execute(`
        SELECT COUNT(*) as count 
        FROM absen_dinas 
        WHERE status IN ('hadir', 'terlambat') 
        AND status_validasi = 'menunggu'
      `);

      // Sudah Divalidasi
      const [sudahValidasi] = await db.execute(`
        SELECT COUNT(*) as count 
        FROM absen_dinas 
        WHERE status_validasi = 'disetujui'
      `);

      // Tidak Hadir (pegawai yang tidak ada record absen & sudah lewat jam masuk)
      const [tidakHadir] = await db.execute(`
        SELECT COUNT(*) as count 
        FROM dinas_pegawai dp
        INNER JOIN dinas d ON dp.id_dinas = d.id_dinas
        LEFT JOIN absen_dinas ad ON dp.id_user = ad.id_user 
          AND ad.id_dinas = dp.id_dinas 
          AND ad.tanggal_absen = CURDATE()
        WHERE ad.id IS NULL 
        AND CURDATE() BETWEEN d.tanggal_mulai AND d.tanggal_selesai
        AND CURTIME() > d.jam_mulai
        AND dp.status_konfirmasi = 'konfirmasi'
      `);

      // PENGAJUAN
      const [menunggu] = await db.execute(`
        SELECT COUNT(*) as count 
        FROM pengajuan 
        WHERE status = 'menunggu'
      `);

      const [disetujui] = await db.execute(`
        SELECT COUNT(*) as count 
        FROM pengajuan 
        WHERE status = 'disetujui'
      `);

      const [ditolak] = await db.execute(`
        SELECT COUNT(*) as count 
        FROM pengajuan 
        WHERE status = 'ditolak'
      `);

      const stats = {
        absen_dinas: {
          perlu_validasi: perluValidasi[0].count,
          sudah_divalidasi: sudahValidasi[0].count,
          tidak_hadir: tidakHadir[0].count,
          total: perluValidasi[0].count + sudahValidasi[0].count + tidakHadir[0].count
        },
        pengajuan: {
          menunggu: menunggu[0].count,
          disetujui: disetujui[0].count,
          ditolak: ditolak[0].count,
          total: menunggu[0].count + disetujui[0].count + ditolak[0].count
        }
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting statistik:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil statistik'
      });
    }
  },

  // Setujui item
  setujui: async (req, res) => {
    try {
      const db = await getConnection();
      const { type, id, catatan } = req.body;
      const adminId = req.user?.id_user || 10; // Default admin ID
      
      let query = '';
      let params = [];

      switch (type) {
        case 'absen_dinas':
          query = `
            UPDATE absen_dinas 
            SET status_validasi = 'disetujui',
                divalidasi_oleh = ?,
                catatan_validasi = ?,
                waktu_validasi = NOW()
            WHERE id = ?
          `;
          params = [adminId, catatan || null, id];
          break;

        case 'pengajuan':
          query = `
            UPDATE pengajuan 
            SET status = 'disetujui',
                disetujui_oleh = ?,
                catatan_persetujuan = ?,
                waktu_persetujuan = NOW()
            WHERE id_pengajuan = ?
          `;
          params = [adminId, catatan || null, id];
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Tipe validasi tidak valid'
          });
      }

      await db.execute(query, params);

      res.json({
        success: true,
        message: 'Berhasil menyetujui'
      });
    } catch (error) {
      console.error('Error approving:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menyetujui'
      });
    }
  },

  // Tolak item
  tolak: async (req, res) => {
    try {
      const db = await getConnection();
      const { type, id, catatan } = req.body;
      const adminId = req.user?.id_user || 10; // Default admin ID
      
      if (!catatan) {
        return res.status(400).json({
          success: false,
          message: 'Catatan penolakan wajib diisi'
        });
      }

      let query = '';
      let params = [];

      switch (type) {
        case 'absen_dinas':
          query = `
            UPDATE absen_dinas 
            SET status_validasi = 'ditolak',
                divalidasi_oleh = ?,
                catatan_validasi = ?,
                waktu_validasi = NOW()
            WHERE id = ?
          `;
          params = [adminId, catatan, id];
          break;

        case 'pengajuan':
          query = `
            UPDATE pengajuan 
            SET status = 'ditolak',
                disetujui_oleh = ?,
                catatan_persetujuan = ?,
                waktu_persetujuan = NOW()
            WHERE id_pengajuan = ?
          `;
          params = [adminId, catatan, id];
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Tipe validasi tidak valid'
          });
      }

      await db.execute(query, params);

      res.json({
        success: true,
        message: 'Berhasil menolak'
      });
    } catch (error) {
      console.error('Error rejecting:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menolak'
      });
    }
  }
};

module.exports = pusatValidasiController;