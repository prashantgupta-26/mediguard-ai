const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/authMiddleware');
const consentController = require('../controllers/consentController');

// Grant consent
router.post('/grant', optionalAuth, consentController.grantConsent);

// Revoke consent
router.post('/revoke', optionalAuth, consentController.revokeConsent);

// Get consent status for session
router.get('/status/:clinicalSessionId', optionalAuth, consentController.getConsentStatus);

// Audit logs
router.get('/audit-logs', optionalAuth, consentController.getAuditLogs);
router.get('/logs', optionalAuth, consentController.getAuditLogs);

module.exports = router;
