const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendVerificationEmail } = require('../services/emailService');
const { generateUniqueHealthId } = require('../services/healthIdService');

// @desc    Register new patient
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, dateOfBirth, gender, email, password } = req.body;

    if (!name || !dateOfBirth || !gender || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, dateOfBirth, gender, email, password.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (existingUser.emailVerified) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists. Please sign in.'
        });
      } else {
        // If unverified, update basic info & password
        const passwordHash = await bcrypt.hash(password, 10);
        existingUser.name = name;
        existingUser.dateOfBirth = dateOfBirth;
        existingUser.gender = gender;
        existingUser.passwordHash = passwordHash;
        await existingUser.save();
      }
    } else {
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create unverified user
      await User.create({
        name,
        dateOfBirth,
        gender,
        email: normalizedEmail,
        passwordHash,
        emailVerified: false
      });
    }

    // Generate 6-digit random OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Remove old OTPs for this email
    await OTP.deleteMany({ email: normalizedEmail });

    // Save new OTP
    await OTP.create({
      email: normalizedEmail,
      otpHash,
      expiresAt
    });

    // Send real email via Nodemailer
    const emailResult = await sendVerificationEmail(normalizedEmail, rawOtp);

    return res.status(201).json({
      success: true,
      message: 'Registration successful. A 6-digit verification code has been sent to your email.',
      ...(emailResult?.messageId === 'log-fallback' || process.env.NODE_ENV !== 'production' ? { otpDevHint: rawOtp } : {})
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
};

// @desc    Verify Email via OTP
// @route   POST /api/auth/verify-email
exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP code are required.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    // Find latest OTP record
    const otpRecord = await OTP.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'No verification code found. Please request a new code.'
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteMany({ email: normalizedEmail });
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please click "Resend Code".'
      });
    }

    const isMatch = await bcrypt.compare(otp.trim(), otpRecord.otpHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect verification code. Please check your email and try again.'
      });
    }

    // Mark email as verified
    user.emailVerified = true;

    // Assign Health ID if not present
    if (!user.healthId) {
      user.healthId = await generateUniqueHealthId();
    }

    await user.save();

    // Invalidate/delete OTP
    await OTP.deleteMany({ email: normalizedEmail });

    // Generate JWT token so patient is immediately authenticated upon verification
    const token = jwt.sign(
      { id: user._id, role: user.role || 'patient' },
      process.env.JWT_SECRET || 'medikiosk_jwt_secret_key_987654321',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully! Welcome to MediKiosk.',
      healthId: user.healthId,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        healthId: user.healthId
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during OTP verification'
    });
  }
};

// @desc    Resend OTP Email
// @route   POST /api/auth/resend-otp
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Your email is already verified. Please proceed to login.'
      });
    }

    // Rate limiting: Check if an OTP was created in the last 60 seconds
    const recentOtp = await OTP.findOne({
      email: normalizedEmail,
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) }
    });

    if (recentOtp) {
      return res.status(429).json({
        success: false,
        message: 'Please wait 60 seconds before requesting another verification code.'
      });
    }

    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.deleteMany({ email: normalizedEmail });
    await OTP.create({
      email: normalizedEmail,
      otpHash,
      expiresAt
    });

    const emailResult = await sendVerificationEmail(normalizedEmail, rawOtp);

    return res.status(200).json({
      success: true,
      message: 'A new verification code has been sent to your email.',
      ...(emailResult?.messageId === 'log-fallback' || process.env.NODE_ENV !== 'production' ? { otpDevHint: rawOtp } : {})
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while resending OTP'
    });
  }
};

// @desc    Patient Login
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (!user.emailVerified) {
      return res.status(400).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email before signing in.'
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role || 'patient' },
      process.env.JWT_SECRET || 'medikiosk_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        healthId: user.healthId,
        role: user.role || 'patient'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
};
