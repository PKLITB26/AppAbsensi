const express = require('express');
const router = express.Router();
const { getTracking } = require('../controllers/trackingController-admin');

router.get('/tracking', getTracking);

module.exports = router;