const express = require('express');
const router = express.Router();
const { getApproval, updateApproval } = require('../controllers/approvalController-admin');

router.get('/approval', getApproval);
router.put('/approval/:id', updateApproval);

module.exports = router;