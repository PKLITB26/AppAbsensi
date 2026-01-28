const express = require('express');
const router = express.Router();
const { getLaporan, getDetailAbsenPegawai, getDetailLaporan, getDetailAbsen, exportPDF } = require('../controllers/laporanController-admin');

router.get('/laporan', getLaporan);
router.get('/detail-absen-pegawai/:id', getDetailAbsenPegawai);
router.get('/detail-laporan', getDetailLaporan);
router.get('/detail-absen', getDetailAbsen);
router.get('/export-pdf', exportPDF);

module.exports = router;