const express = require('express');
const router = express.Router();
const { getPengajuan, submitPengajuan } = require('../controllers/pengajuanController');

router.get('/pengajuan', getPengajuan);
router.post('/pengajuan', submitPengajuan);

module.exports = router;