const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getProfile,
  updateProfile,
  getHealthTimeline,
  getHealthSummary,
  getSmartIntake,
  updatePatientNotes
} = require('../controllers/patientController');
const {
  getDoctorSummary,
  generateDoctorSummary
} = require('../controllers/doctorSummaryController');
const { protect } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, getDashboard);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Feature 3: Health Timeline and Health Summary Routes
router.get('/health-timeline', protect, getHealthTimeline);
router.get('/health-summary', protect, getHealthSummary);

// Feature 4: Smart Patient Intake Routes
router.get('/smart-intake', protect, getSmartIntake);
router.put('/smart-intake/notes', protect, updatePatientNotes);

// Feature 5: Doctor Clinical Summary Routes
router.get('/doctor-summary', protect, getDoctorSummary);
router.post('/doctor-summary/generate', protect, generateDoctorSummary);

module.exports = router;
