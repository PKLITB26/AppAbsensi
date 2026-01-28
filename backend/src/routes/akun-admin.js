const express = require('express');
const router = express.Router();
const { getAkunLogin, createAkun, deleteAkun, checkEmails } = require('../controllers/akunController-admin');

router.get('/akun-login', getAkunLogin);
router.post('/akun-login', createAkun);
router.delete('/akun-login/:id', deleteAkun);
router.get('/check-emails', checkEmails);

module.exports = router;