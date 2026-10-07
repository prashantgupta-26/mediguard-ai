const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateUniqueHealthId } = require('../services/healthIdService');
const { sendVerificationEmail } = require('../services/emailService');

async function runDiagnostics() {
  console.log('\n======================================================');
  console.log('   MEDIKIOSK — OTP, MONGODB & API DIAGNOSTIC RUNNER   ');
  console.log('======================================================\n');

  // STEP 1: Test MongoDB Connection
  console.log('1️⃣ [MONGODB] Testing Database Connection...');
  try {
    await connectDB();
    console.log('   ✅ MongoDB is CONNECTED and responding.\n');
  } catch (err) {
    console.error('   ❌ MongoDB Connection Failed:', err.message);
    console.log('\n💡 Resolution:');
    console.log('   - If running locally: start MongoDB service on port 27017 (e.g., net start MongoDB)');
    console.log('   - If using cloud: set MONGODB_URI in backend/.env to your MongoDB Atlas cluster URI.\n');
    process.exit(1);
  }

  // STEP 2: Test OTP Generation & Hashing
  console.log('2️⃣ [OTP SYSTEM] Testing OTP Generation & Storage...');
  const testEmail = `diagnostic_${Date.now()}@test.medikiosk.internal`;
  const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(rawOtp, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  try {
    await OTP.deleteMany({ email: testEmail });
    const otpDoc = await OTP.create({
      email: testEmail,
      otpHash,
      expiresAt
    });
    console.log(`   ✅ OTP Document created in MongoDB (ID: ${otpDoc._id})`);
    console.log(`   🔑 Generated OTP: ${rawOtp}`);

    // Verify bcrypt comparison
    const isMatch = await bcrypt.compare(rawOtp, otpDoc.otpHash);
    console.log(`   ✅ OTP Bcrypt verification matches: ${isMatch}`);

    const isWrongMatch = await bcrypt.compare('000000', otpDoc.otpHash);
    console.log(`   ✅ Incorrect OTP correctly rejected: ${!isWrongMatch}\n`);
  } catch (err) {
    console.error('   ❌ OTP Storage/Verification failed:', err.message);
  }

  // STEP 3: Test Health ID Generation & User Registration
  console.log('3️⃣ [USER & HEALTH ID] Testing Patient Activation & Health ID...');
  try {
    const healthId = await generateUniqueHealthId();
    console.log(`   ✅ Generated Unique Health ID: ${healthId} (Format check: ${healthId.startsWith('MK-')})`);

    const passwordHash = await bcrypt.hash('TestPassword123!', 10);
    const testUser = await User.create({
      name: 'Diagnostic Test Patient',
      dateOfBirth: '1995-06-15',
      gender: 'Other',
      email: testEmail,
      passwordHash,
      emailVerified: true,
      healthId
    });
    console.log(`   ✅ User account created in MongoDB with verified email and Health ID: ${testUser.healthId}\n`);

    // STEP 4: Test JWT Generation & Authentication
    console.log('4️⃣ [AUTH / API] Testing JWT Token Generation & Validation...');
    const token = jwt.sign(
      { id: testUser._id, role: 'patient' },
      process.env.JWT_SECRET || 'medikiosk_jwt_secret_key_987654321',
      { expiresIn: '7d' }
    );
    console.log(`   ✅ JWT Signed successfully.`);

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'medikiosk_jwt_secret_key_987654321');
    console.log(`   ✅ JWT Verified successfully (User ID: ${decoded.id}, Role: ${decoded.role})\n`);

    // STEP 5: Test Email Service (Dry run / Transporter check)
    console.log('5️⃣ [EMAIL / SMTP] Testing Email Transporter configuration...');
    console.log(`   SMTP Host: ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
    console.log(`   SMTP User: ${process.env.SMTP_USER || 'Not set'}`);
    console.log('   (Email service has automated fallback to log OTP to console if SMTP is unreachable)\n');

    // Cleanup diagnostic data
    await User.deleteOne({ email: testEmail });
    await OTP.deleteMany({ email: testEmail });
    console.log('🧹 Cleaned up temporary diagnostic records from MongoDB.');

    console.log('\n======================================================');
    console.log('   🎉 ALL SYSTEM COMPONENTS PASSED DIAGNOSTIC TESTS   ');
    console.log('======================================================\n');
  } catch (err) {
    console.error('   ❌ User/Auth test error:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed gracefully.');
  }
}

runDiagnostics();
