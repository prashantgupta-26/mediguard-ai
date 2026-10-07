const express = require('express');
const router = express.Router();
const { register, verifyEmail, resendOtp, login } = require('../controllers/authController');

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOtp);
router.post('/login', login);

module.exports = router;
