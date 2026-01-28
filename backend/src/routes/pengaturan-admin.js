const express = require('express');
const router = express.Router();
const { 
  getLokasiKantor, 
  createLokasiKantor, 
  updateLokasiKantor, 
  deleteLokasiKantor,
  getJamKerja,
  saveJamKerja,
  getHariLibur,
  createHariLibur,
  deleteHariLibur
} = require('../controllers/pengaturanController-admin');

// Lokasi Kantor routes
router.get('/lokasi-kantor', getLokasiKantor);
router.post('/lokasi-kantor', createLokasiKantor);
router.put('/lokasi-kantor/:id', updateLokasiKantor);
router.delete('/lokasi-kantor/:id', deleteLokasiKantor);

// Jam Kerja routes
router.get('/jam-kerja', getJamKerja);
router.post('/jam-kerja', saveJamKerja);

// Hari Libur routes
router.get('/hari-libur', getHariLibur);
router.post('/hari-libur', createHariLibur);
router.delete('/hari-libur/:id', deleteHariLibur);

// Route untuk update-lokasi
router.put('/update-lokasi/:id', updateLokasiKantor);

module.exports = router;