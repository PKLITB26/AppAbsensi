const express = require('express');
const router = express.Router();
const { getPresensi, submitPresensi } = require('../controllers/presensiController');

router.get('/presensi', getPresensi);
router.post('/presensi', submitPresensi);

module.exports = router;