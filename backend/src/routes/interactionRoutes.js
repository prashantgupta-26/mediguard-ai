const express = require('express');
const router = express.Router();
const { checkInteractions } = require('../controllers/interactionController');

router.post('/check', checkInteractions);

module.exports = router;
