const express = require('express');
const router = express.Router();
const { 
  getDinasAktifAdmin, 
  createDinasAdmin, 
  getRiwayatDinasAdmin, 
  getValidasiAbsenAdmin,
  getDinasStats,
  getDinasLokasi,
  checkAbsenLocation
} = require('../controllers/dinasController-admin');

router.get('/dinas-aktif', getDinasAktifAdmin);
router.post('/create-dinas', createDinasAdmin);
router.get('/riwayat-dinas', getRiwayatDinasAdmin);
router.get('/validasi-absen', getValidasiAbsenAdmin);
router.get('/stats', getDinasStats);
router.get('/dinas/:id_dinas/lokasi', getDinasLokasi);
router.post('/check-location', checkAbsenLocation);

module.exports = router;