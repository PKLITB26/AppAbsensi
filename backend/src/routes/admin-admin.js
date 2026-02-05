const express = require('express');
const router = express.Router();
const { getAdminData, updateAdminProfile, updateAdminPassword } = require('../controllers/adminController-admin');

router.get('/admin', getAdminData);
router.post('/admin', getAdminData); // Handle both GET and POST with actions

module.exports = router;