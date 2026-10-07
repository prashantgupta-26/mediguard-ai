const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/authMiddleware');
const {
  startSession,
  getSession,
  saveAnswer,
  heartbeat,
  interactSession,
  submitSession,
  resetSession,
  getClinicalHistory
} = require('../controllers/kioskController');

// Kiosk Session Routes
router.post('/session/start', optionalAuth, startSession);
router.get('/session/:sessionId', optionalAuth, getSession);
router.post('/session/:sessionId/answer', optionalAuth, saveAnswer);
router.post('/session/:sessionId/interact', optionalAuth, interactSession);
router.post('/session/:sessionId/heartbeat', optionalAuth, heartbeat);
router.post('/session/:sessionId/submit', optionalAuth, submitSession);
router.post('/session/:sessionId/reset', optionalAuth, resetSession);

// Clinical History retrieval route
router.get('/history/:id', optionalAuth, getClinicalHistory);

module.exports = router;
