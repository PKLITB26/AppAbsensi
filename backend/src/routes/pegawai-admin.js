const express = require('express');
const router = express.Router();
const { getPegawaiData, getDetailPegawai, createPegawai, deletePegawai, updatePegawai, getKelolaPegawai, createKelolaPegawai, deleteKelolaPegawai } = require('../controllers/pegawaiController-admin');

// Admin routes - kelola pegawai
router.get('/kelola-pegawai', getKelolaPegawai);
router.post('/kelola-pegawai', createKelolaPegawai);
router.delete('/kelola-pegawai', deleteKelolaPegawai);

// Admin routes - data pegawai
router.get('/data-pegawai', getPegawaiData);
router.get('/detail-pegawai/:id', getDetailPegawai);
router.post('/data-pegawai', createPegawai);
router.delete('/delete-pegawai/:id', deletePegawai);
router.put('/update-pegawai/:id', updatePegawai);

module.exports = router;