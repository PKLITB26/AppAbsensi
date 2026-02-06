const express = require('express');
const router = express.Router();
const { getAdminData, updateAdminProfile, getAdminProfile, updateAdminProfileData, upload } = require('../controllers/adminController-admin');

router.get('/admin', getAdminData);
router.post('/admin', getAdminData); // Handle both GET and POST with actions

// Profile endpoints
router.get('/admin/profile', getAdminProfile);
router.put('/admin/profile', upload.single('foto_profil'), updateAdminProfileData);

module.exports = router;