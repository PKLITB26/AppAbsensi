const express = require('express');
const router = express.Router();
const { 
  getDinasAktifAdmin, 
  createDinasAdmin, 
  getRiwayatDinasAdmin, 
  getValidasiAbsenAdmin,
  getDinasStats
} = require('../controllers/dinasController-admin');

router.get('/dinas-aktif', getDinasAktifAdmin);
router.post('/create-dinas', createDinasAdmin);
router.get('/riwayat-dinas', getRiwayatDinasAdmin);
router.get('/validasi-absen', getValidasiAbsenAdmin);
router.get('/stats', getDinasStats);

module.exports = router;