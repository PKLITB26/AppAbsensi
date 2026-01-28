const express = require('express');
const router = express.Router();
const { 
  getDinasAktifAdmin, 
  createDinasAdmin, 
  getRiwayatDinasAdmin, 
  getValidasiAbsenAdmin 
} = require('../controllers/dinasController-admin');

router.get('/dinas-aktif', getDinasAktifAdmin);
router.post('/create-dinas', createDinasAdmin);
router.get('/riwayat-dinas', getRiwayatDinasAdmin);
router.get('/validasi-absen', getValidasiAbsenAdmin);

module.exports = router;