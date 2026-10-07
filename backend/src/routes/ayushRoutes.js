const express = require('express');
const router = express.Router();
const ayushController = require('../controllers/ayushController');
const { optionalAuth } = require('../middleware/authMiddleware');

// Get questions (public/kiosk access)
router.get('/questions', ayushController.getQuestions);

// Submit intake (protected or session-authorized)
router.post('/submit', optionalAuth, ayushController.submitAyushIntake);
router.post('/intake', optionalAuth, ayushController.submitAyushIntake);

// Get by session
router.get('/session/:sessionId', optionalAuth, ayushController.getAyushBySession);

module.exports = router;
