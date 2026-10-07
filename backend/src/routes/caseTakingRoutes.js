const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  startCaseTakingSession,
  getActiveCaseTakingSession,
  sendCaseTakingMessage,
  completeCaseTakingSession,
  getCaseTakingSessionById
} = require('../controllers/caseTakingController');

// All case-taking endpoints require patient authentication
router.post('/start', protect, startCaseTakingSession);
router.get('/active', protect, getActiveCaseTakingSession);
router.post('/:sessionId/message', protect, sendCaseTakingMessage);
router.post('/:sessionId/complete', protect, completeCaseTakingSession);
router.get('/:sessionId', protect, getCaseTakingSessionById);

module.exports = router;
