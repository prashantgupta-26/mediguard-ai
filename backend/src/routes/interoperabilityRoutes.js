const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/authMiddleware');
const interoperabilityController = require('../controllers/interoperabilityController');

// FHIR R4 Bundle conversion
router.post('/fhir/bundle', optionalAuth, interoperabilityController.generateFhirBundle);

// Share with Hospital HIS
router.post('/share/his', optionalAuth, interoperabilityController.shareWithHis);

// Share with ABDM Ecosystem
router.post('/share/abdm', optionalAuth, interoperabilityController.shareWithAbdm);

// Integration Real Status Dashboard
router.get('/status', optionalAuth, interoperabilityController.getIntegrationStatus);

// ABHA Identity Linking
router.post('/abha/link', optionalAuth, interoperabilityController.linkAbhaNumber);

module.exports = router;
