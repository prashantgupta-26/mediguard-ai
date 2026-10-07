const express = require('express');
const router = express.Router();
const { optionalAuth, protect } = require('../middleware/authMiddleware');
const clinicalSummaryController = require('../controllers/clinicalSummaryController');

// Generate summary for session/patient
router.post('/generate', optionalAuth, clinicalSummaryController.generateSummary);

// Get summary by ID or sessionId
router.get('/:id', optionalAuth, clinicalSummaryController.getSummary);

// Update summary
router.patch('/:id', protect, clinicalSummaryController.updateSummary);

// Confirm summary by patient
router.post('/:id/confirm', protect, clinicalSummaryController.confirmPatientSummary);

// Verify summary by physician
router.post('/:id/verify', protect, clinicalSummaryController.verifyPhysicianSummary);

// Multi-source medical timeline
router.get('/:id/timeline', optionalAuth, clinicalSummaryController.getTimeline);
router.get('/patient/:patientId/timeline', optionalAuth, clinicalSummaryController.getTimeline);

module.exports = router;
