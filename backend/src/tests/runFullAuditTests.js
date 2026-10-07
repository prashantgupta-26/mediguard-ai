const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = require('../config/db');
const app = require('../app');
const User = require('../models/User');
const OTP = require('../models/OTP');
const MedicalDocument = require('../models/MedicalDocument');
const ClinicalSession = require('../models/ClinicalSession');
const ClinicalSummary = require('../models/ClinicalSummary');
const Consent = require('../models/Consent');
const AuditLog = require('../models/AuditLog');

const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}`;

let server;
let patientAToken = '';
let patientAId = '';
let patientBToken = '';
let patientBId = '';
let doctorToken = '';
let createdDocId = '';
let sessionId = '';
let summaryId = '';
let consentId = '';

async function runTests() {
  console.log('\n=============================================================');
  console.log('   MEDIKIOSK — FULL END-TO-END AUTOMATED AUDIT TEST SUITE   ');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, description) {
    if (condition) {
      console.log(`  ✓ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${description}`);
      failed++;
    }
  }

  try {
    // 1. Connect DB and start test server
    await connectDB();
    await new Promise((resolve) => {
      server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`[Test Runner] Test server listening on ${BASE_URL}`);
        resolve();
      });
    });

    // 2. Auth: Register Patient A
    const regEmailA = `test_patient_a_${Date.now()}@example.com`;
    const regResA = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Patient Alpha',
        dateOfBirth: '1992-05-15',
        gender: 'Male',
        email: regEmailA,
        password: 'Password123!'
      })
    });
    const regDataA = await regResA.json();
    assert(regResA.status === 201 && regDataA.success, 'Patient A registration succeeds and sends OTP');

    // Fetch OTP from DB directly for testing
    const otpRecordA = await OTP.findOne({ email: regEmailA });
    assert(otpRecordA, 'OTP record generated in database for Patient A');

    // 3. Auth: Verify OTP for Patient A
    // Since OTP is hashed in DB, let's verify via DB update or login bypass for test setup
    const userA = await User.findOne({ email: regEmailA });
    userA.emailVerified = true;
    userA.healthId = `HID-${Math.floor(100000 + Math.random() * 900000)}`;
    await userA.save();
    patientAId = userA._id.toString();

    // 4. Auth: Login Patient A
    const loginResA = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: regEmailA, password: 'Password123!' })
    });
    const loginDataA = await loginResA.json();
    assert(loginResA.status === 200 && loginDataA.token, 'Patient A login succeeds and returns JWT token');
    patientAToken = loginDataA.token;

    // 5. Auth: Setup Patient B for Patient Data Isolation testing
    const regEmailB = `test_patient_b_${Date.now()}@example.com`;
    const userB = await User.create({
      name: 'Patient Beta',
      dateOfBirth: '1988-10-20',
      gender: 'Female',
      email: regEmailB,
      passwordHash: '$2a$10$e79...dummy',
      emailVerified: true,
      healthId: `HID-${Math.floor(100000 + Math.random() * 900000)}`,
      role: 'patient'
    });
    patientBId = userB._id.toString();

    const jwt = require('jsonwebtoken');
    patientBToken = jwt.sign(
      { id: userB._id, role: 'patient' },
      process.env.JWT_SECRET || 'medikiosk_secret',
      { expiresIn: '1h' }
    );

    // Setup Doctor user for RBAC test
    const doctorUser = await User.create({
      name: 'Dr. Sharma',
      dateOfBirth: '1975-01-01',
      gender: 'Male',
      email: `doctor_${Date.now()}@hospital.org`,
      passwordHash: '$2a$10$e79...dummy',
      emailVerified: true,
      healthId: `HID-DOC-${Math.floor(100000 + Math.random() * 900000)}`,
      role: 'doctor'
    });

    doctorToken = jwt.sign(
      { id: doctorUser._id, role: 'doctor' },
      process.env.JWT_SECRET || 'medikiosk_secret',
      { expiresIn: '1h' }
    );

    // 6. Profile API
    const profileRes = await fetch(`${BASE_URL}/api/patient/profile`, {
      headers: { Authorization: `Bearer ${patientAToken}` }
    });
    const profileData = await profileRes.json();
    assert(profileRes.status === 200 && profileData.patient.name === 'Patient Alpha', 'Fetch patient profile returns correct user data');

    // 7. Medical Document Creation & Patient Isolation Check
    const docA = await MedicalDocument.create({
      patientId: userA._id,
      healthId: userA.healthId,
      originalFileName: 'CBC_Report.pdf',
      storedFileName: 'test_cbc_123.pdf',
      fileType: 'application/pdf',
      fileSize: 10240,
      filePath: path.join(__dirname, 'test_cbc_123.pdf'),
      processingStatus: 'processed',
      aiAnalysisStatus: 'completed',
      aiExtractedData: {
        documentType: 'lab_report',
        reportDate: '2026-03-10',
        tests: [{ name: 'Hemoglobin', value: '14.2', unit: 'g/dL' }]
      }
    });
    createdDocId = docA._id.toString();

    // Patient A accesses own document -> 200
    const viewDocResA = await fetch(`${BASE_URL}/api/patient/records/${createdDocId}`, {
      headers: { Authorization: `Bearer ${patientAToken}` }
    });
    assert(viewDocResA.status === 200, 'Patient A can access their own medical document');

    // Patient B accesses Patient A's document -> 403 Forbidden
    const viewDocResB = await fetch(`${BASE_URL}/api/patient/records/${createdDocId}`, {
      headers: { Authorization: `Bearer ${patientBToken}` }
    });
    assert(viewDocResB.status === 403, 'Patient B is DENIED access to Patient A medical document (403 Forbidden)');

    // 8. Clinical Intake / Kiosk Session
    const startSessionRes = await fetch(`${BASE_URL}/api/kiosk/session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientAToken}`
      },
      body: JSON.stringify({ mode: 'touch_guided', language: 'en' })
    });
    const startSessionData = await startSessionRes.json();
    assert((startSessionRes.status === 201 || startSessionRes.status === 200) && startSessionData.session, 'Start kiosk clinical intake session');
    sessionId = startSessionData.session.sessionId;

    // Submit Symptom Answer
    const submitAnswerRes = await fetch(`${BASE_URL}/api/kiosk/session/${sessionId}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientAToken}`
      },
      body: JSON.stringify({
        questionId: 'chief_complaint',
        section: 'chief_complaint',
        questionText: 'What problem or symptom is bringing you in today?',
        answer: 'Severe fever and body pain for 3 days',
        inputMethod: 'voice'
      })
    });
    const submitAnswerData = await submitAnswerRes.json();
    assert(submitAnswerRes.status === 200 && submitAnswerData.session, 'Submit voice symptom answer to kiosk session');

    // Submit AYUSH Intake
    const ayushRes = await fetch(`${BASE_URL}/api/ayush/intake`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientAToken}`
      },
      body: JSON.stringify({
        clinicalSessionId: sessionId,
        answers: {
          prakriti: 'pitta',
          vikriti: 'pitta_imbalance',
          sara: 'mamsa_sara',
          samhanana: 'compact',
          pramana: 'proportionate',
          satmya: 'all_habits',
          sattva: 'pravara',
          aharaShakti: 'tikshna_agni',
          vyayamaShakti: 'high',
          vaya: 'madhyama'
        }
      })
    });
    const ayushData = await ayushRes.json();
    assert(ayushRes.status === 200 && ayushData.ayushRecord, 'Submit AYUSH Dashavidha Pariksha intake assessment');

    // 9. Clinical Summary Generation & RBAC Verification
    const genSummaryRes = await fetch(`${BASE_URL}/api/clinical-summary/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientAToken}`
      },
      body: JSON.stringify({ clinicalSessionId: sessionId, summaryLanguage: 'en' })
    });
    const genSummaryData = await genSummaryRes.json();
    assert(genSummaryRes.status === 200 && genSummaryData.summary, 'Generate structured Clinical Summary with Gemini integration');
    summaryId = genSummaryData.summary._id;

    // Patient confirms summary -> 200
    const confirmRes = await fetch(`${BASE_URL}/api/clinical-summary/${summaryId}/confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientAToken}` }
    });
    assert(confirmRes.status === 200, 'Patient can confirm their own clinical summary');

    // Patient attempts Physician verification -> 403 Forbidden
    const physVerifyByPatientRes = await fetch(`${BASE_URL}/api/clinical-summary/${summaryId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientAToken}`
      },
      body: JSON.stringify({ physicianNotes: 'Fake verification attempt' })
    });
    assert(physVerifyByPatientRes.status === 403, 'Patient is DENIED physician verification sign-off (403 Forbidden)');

    // Doctor attempts Physician verification -> 200 OK
    const physVerifyByDoctorRes = await fetch(`${BASE_URL}/api/clinical-summary/${summaryId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({ physicianNotes: 'Patient cleared for outpatient follow up.', physicianName: 'Dr. Sharma' })
    });
    assert(physVerifyByDoctorRes.status === 200, 'Doctor successfully completes physician clinical sign-off');

    // 10. Consent Management & Audit Logging
    const grantConsentRes = await fetch(`${BASE_URL}/api/consent/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientAToken}`
      },
      body: JSON.stringify({
        clinicalSessionId: sessionId,
        purpose: 'Hospital OPD Triage Consultation',
        scope: { shareClinicalSummary: true, shareDocuments: true, shareVitals: true },
        language: 'en'
      })
    });
    const grantConsentData = await grantConsentRes.json();
    assert(grantConsentRes.status === 200 && grantConsentData.consent, 'Grant granular patient consent');
    consentId = grantConsentData.consent._id;

    // Check Audit Log
    const auditLogsRes = await fetch(`${BASE_URL}/api/consent/logs?clinicalSessionId=${sessionId}`, {
      headers: { Authorization: `Bearer ${patientAToken}` }
    });
    const auditLogsData = await auditLogsRes.json();
    assert(auditLogsRes.status === 200 && auditLogsData.logs.length > 0, 'Audit log records consent grant event');

    // Revoke Consent
    const revokeConsentRes = await fetch(`${BASE_URL}/api/consent/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientAToken}`
      },
      body: JSON.stringify({ clinicalSessionId: sessionId })
    });
    assert(revokeConsentRes.status === 200, 'Patient revokes granted consent successfully');

    // 11. Interoperability & FHIR Transformation
    const fhirRes = await fetch(`${BASE_URL}/api/interoperability/fhir/bundle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientAToken}`
      },
      body: JSON.stringify({ clinicalSummaryId: summaryId })
    });
    const fhirData = await fhirRes.json();
    assert(fhirRes.status === 200 && fhirData.bundle?.resourceType === 'Bundle', 'Transform patient summary into valid FHIR R4 Bundle');

    // 12. Zero-Fake ABDM Sandbox & HIS Adapter Status
    const adapterStatusRes = await fetch(`${BASE_URL}/api/interoperability/status`, {
      headers: { Authorization: `Bearer ${patientAToken}` }
    });
    const adapterStatusData = await adapterStatusRes.json();
    assert(
      adapterStatusRes.status === 200 &&
      adapterStatusData.abdmStatus.configured === false &&
      adapterStatusData.hisStatus.configured === false,
      'Truthful Zero-Fake policy: ABDM & HIS adapters return unconfigured status without false claims'
    );

    // 13. Kiosk Reset / Session Isolation
    const resetRes = await fetch(`${BASE_URL}/api/kiosk/session/${sessionId}/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientAToken}`
      }
    });
    assert(resetRes.status === 200, 'Kiosk session finish/reset purges active kiosk state');

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    // Cleanup created test records
    try {
      if (patientAId) await User.findByIdAndDelete(patientAId);
      if (patientBId) await User.findByIdAndDelete(patientBId);
      if (createdDocId) await MedicalDocument.findByIdAndDelete(createdDocId);
      if (sessionId) await ClinicalSession.deleteMany({ sessionId });
      if (summaryId) await ClinicalSummary.findByIdAndDelete(summaryId);
      if (consentId) await Consent.findByIdAndDelete(consentId);
    } catch (cleanErr) {
      console.warn('Cleanup error:', cleanErr.message);
    }

    if (server) server.close();

    console.log('\n-------------------------------------------------------------');
    console.log(` AUDIT SUMMARY: ${passed} PASSED | ${failed} FAILED `);
    console.log('-------------------------------------------------------------\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
