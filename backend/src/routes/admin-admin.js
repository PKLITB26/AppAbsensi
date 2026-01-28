const express = require('express');
const router = express.Router();
const { getAdminData, updateAdminProfile } = require('../controllers/adminController-admin');

router.get('/admin', getAdminData);
router.post('/admin', updateAdminProfile);

module.exports = router;