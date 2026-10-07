const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');
const MedicalDocument = require('../models/MedicalDocument');
const HealthRecord = require('../models/HealthRecord');

// Helper to load store.json fallback if MongoDB is offline
function getStoreFallback() {
  try {
    const storePath = path.join(__dirname, '../../data/store.json');
    if (fs.existsSync(storePath)) {
      return JSON.parse(fs.readFileSync(storePath, 'utf8'));
    }
  } catch (e) {
    // ignore
  }
  return { users: [], documents: [], healthRecords: {}, clinicalSummaries: {} };
}

// Build structured clinical doctor summary from patient profile & documents
async function buildDoctorSummaryData(userId, user) {
  let patient = user;
  let healthRecord = null;
  let userDocs = [];
  const store = getStoreFallback();

  try {
    if (!patient && User.db.readyState === 1) {
      patient = await User.findById(userId).select('-passwordHash');
    }
    if (HealthRecord.db.readyState === 1) {
      healthRecord = await HealthRecord.findOne({ patientId: userId });
    }
    if (MedicalDocument.db.readyState === 1) {
      userDocs = await MedicalDocument.find({ patientId: userId });
    }
  } catch (err) {
    console.warn('[DoctorSummary] Mongoose query fallback to store.json:', err.message);
  }

  // Fallback to store.json if MongoDB records are empty
  if (!patient) {
    patient = store.users.find(u => (u.id === userId || u._id === userId)) || { name: 'Patient' };
  }
  if (!healthRecord && store.healthRecords) {
    healthRecord = store.healthRecords[userId] || {};
  }
  if ((!userDocs || userDocs.length === 0) && store.documents) {
    userDocs = store.documents.filter(d => d.patientId === userId || (patient.healthId && d.healthId === patient.healthId));
  }

  // 1. Patient Information
  const dob = patient.dateOfBirth || 'Not documented';
  let age = 'Not documented';
  if (dob && dob.length >= 4 && !isNaN(parseInt(dob.slice(0, 4)))) {
    age = `${new Date().getFullYear() - parseInt(dob.slice(0, 4))} years`;
  }

  const patientInfo = {
    name: patient.name || 'Not documented',
    dateOfBirth: dob,
    age,
    gender: patient.gender || 'Not documented',
    healthId: patient.healthId || 'Not available',
    abhaNumber: patient.abhaNumber || 'Not linked',
    bloodGroup: (healthRecord && healthRecord.bloodGroup) || 'Not documented',
    height: (healthRecord && healthRecord.height) || 'Not documented',
    weight: (healthRecord && healthRecord.weight) || 'Not documented'
  };

  // 2. Prescription Summary
  const prescriptions = [];
  const seenPrescKeys = new Set();

  for (const doc of (userDocs || [])) {
    const extracted = doc.aiExtractedData || doc.extractedData || {};
    const docName = doc.originalFileName || 'Prescription Document';
    const docDate = extracted.documentDate || (doc.uploadedAt ? String(doc.uploadedAt).slice(0, 10) : 'Not dated');

    let rawMeds = [];
    if (extracted.prescription && Array.isArray(extracted.prescription.medicines)) {
      rawMeds = extracted.prescription.medicines;
    } else if (Array.isArray(extracted.medicines)) {
      rawMeds = extracted.medicines;
    } else if (extracted.dischargeSummary && Array.isArray(extracted.dischargeSummary.medications)) {
      rawMeds = extracted.dischargeSummary.medications;
    }

    for (const m of rawMeds) {
      let name = '';
      let generic = 'Not specified';
      let dosage = 'Not specified';
      let freq = 'Not specified';
      let dur = 'Not specified';
      let inst = 'Standard administration';

      if (typeof m === 'object' && m !== null) {
        name = (m.medicineName || m.name || m.medicine || '').trim();
        generic = (m.genericName || m.generic || '').trim() || 'Not specified';
        dosage = (m.dosage || '').trim() || 'Not specified';
        freq = (m.frequency || '').trim() || 'Not specified';
        dur = (m.duration || '').trim() || 'Not specified';
        inst = (m.instructions || m.route || '').trim() || 'Standard administration';
      } else if (typeof m === 'string' && m.trim()) {
        name = m.trim();
      }

      if (name) {
        const key = `${name.toLowerCase()}_${dosage.toLowerCase()}_${freq.toLowerCase()}`;
        if (!seenPrescKeys.has(key)) {
          seenPrescKeys.add(key);
          prescriptions.push({
            name,
            genericName: generic,
            dosage,
            frequency: freq,
            duration: dur,
            instructions: inst,
            sourceDocument: docName,
            prescribedDate: docDate
          });
        }
      }
    }
  }

  // Include profile chronic medications
  if (healthRecord && healthRecord.currentMedications && healthRecord.currentMedications.toLowerCase() !== 'none') {
    const currMedStr = healthRecord.currentMedications.trim();
    if (!prescriptions.some(p => p.name.toLowerCase().includes(currMedStr.toLowerCase()))) {
      prescriptions.push({
        name: currMedStr,
        genericName: 'Profile reported',
        dosage: 'As documented',
        frequency: 'Ongoing',
        duration: 'Chronic / Maintenance',
        instructions: 'Patient reported',
        sourceDocument: 'Patient Profile Record',
        prescribedDate: 'Current'
      });
    }
  }

  // 3. Medical Information
  const diagnoses = [];
  const symptoms = [];
  const observations = [];

  for (const doc of (userDocs || [])) {
    const extracted = doc.aiExtractedData || doc.extractedData || {};
    if (extracted.prescription && extracted.prescription.diagnosisOrIndication) {
      const diag = String(extracted.prescription.diagnosisOrIndication).trim();
      if (diag && !diagnoses.includes(diag)) diagnoses.push(diag);
    }
    if (extracted.dischargeSummary && extracted.dischargeSummary.diagnosis) {
      const diag = String(extracted.dischargeSummary.diagnosis).trim();
      if (diag && !diagnoses.includes(diag)) diagnoses.push(diag);
    }
    if (extracted.generalFindings) {
      const gf = extracted.generalFindings;
      const dList = gf.diagnosesMentioned || gf.diagnoses || [];
      for (const d of dList) {
        const dClean = String(d).trim();
        if (dClean && !diagnoses.includes(dClean)) diagnoses.push(dClean);
      }
      for (const s of (gf.symptoms || [])) {
        const sClean = String(s).trim();
        if (sClean && !symptoms.includes(sClean)) symptoms.push(sClean);
      }
      for (const o of (gf.observations || [])) {
        const oClean = String(o).trim();
        if (oClean) {
          if (!observations.includes(oClean)) observations.push(oClean);
          if (['c/o', 'fatigue', 'ache', 'pain', 'fever', 'cough', 'cold', 'headache', 'giddiness', 'vomit', 'nausea', 'weakness'].some(t => oClean.toLowerCase().includes(t))) {
            if (!symptoms.includes(oClean)) symptoms.push(oClean);
          }
        }
      }
    }
  }

  if (healthRecord && healthRecord.existingConditions && healthRecord.existingConditions.toLowerCase() !== 'none') {
    const cond = healthRecord.existingConditions.trim();
    if (!diagnoses.includes(cond)) diagnoses.push(cond);
  }

  const medicalInformation = {
    symptoms: symptoms.length > 0 ? symptoms : ['No acute complaints explicitly documented in available records.'],
    diagnoses: diagnoses.length > 0 ? diagnoses : ['No explicit diagnosis stated in available records.'],
    allergies: (healthRecord && healthRecord.allergies) || 'No known drug allergies documented in profile',
    existingConditions: (healthRecord && healthRecord.existingConditions) || 'None documented',
    relevantHistory: (healthRecord && healthRecord.patientNotes) || 'No prior medical history notes recorded'
  };

  // 4. Investigation Summary
  const tests = [];
  const abnormalFindings = [];

  for (const doc of (userDocs || [])) {
    const extracted = doc.aiExtractedData || doc.extractedData || {};
    const docName = doc.originalFileName || 'Investigation Document';
    const docDate = extracted.documentDate || (doc.uploadedAt ? String(doc.uploadedAt).slice(0, 10) : 'Not dated');

    let rawTests = [];
    if (extracted.laboratoryReport && Array.isArray(extracted.laboratoryReport.tests)) {
      rawTests = extracted.laboratoryReport.tests;
    } else if (Array.isArray(extracted.tests)) {
      rawTests = extracted.tests;
    }

    for (const t of rawTests) {
      if (typeof t === 'object' && t !== null) {
        const tName = t.name || t.testName || 'Laboratory Test';
        const tVal = String(t.value || '').trim() || 'Documented';
        const tUnit = String(t.unit || '').trim();
        const tRef = String(t.referenceRange || t.normalRange || '').trim() || 'Standard';
        const isAbn = Boolean(t.isAbnormal || ['high', 'low', 'abnormal', 'critical'].includes(String(t.flag || '').toLowerCase()));
        tests.push({
          name: tName,
          value: tVal,
          unit: tUnit,
          referenceRange: tRef,
          status: isAbn ? 'Abnormal' : 'Normal',
          isAbnormal: isAbn,
          sourceDocument: docName,
          reportDate: docDate
        });
        if (isAbn) {
          abnormalFindings.push(`${tName}: ${tVal} ${tUnit} (Ref: ${tRef})`);
        }
      }
    }
  }

  const investigations = {
    tests,
    abnormalFindings: abnormalFindings.length > 0 ? abnormalFindings : ['No abnormal lab values flagged in available records.'],
    observations: observations.length > 0 ? observations : ['No specific clinical observations noted in document text.']
  };

  // 5. Medication Safety Summary
  const medNames = prescriptions.map(p => p.name);
  const namesLower = medNames.map(m => m.toLowerCase());
  const warnings = [];

  const hasSteroid = namesLower.some(m => m.includes('prednisone') || m.includes('dexamethasone') || m.includes('steroid'));
  const hasNsaid = namesLower.some(m => m.includes('etoricoxib') || m.includes('ibuprofen') || m.includes('aspirin') || m.includes('ecosprin'));
  if (hasSteroid && hasNsaid) {
    warnings.push('Potential NSAID + Corticosteroid co-administration: Elevated gastrointestinal irritation/ulcer risk noted.');
  }

  const hasWarfarin = namesLower.some(m => m.includes('warfarin'));
  const hasAspirin = namesLower.some(m => m.includes('aspirin') || m.includes('ecosprin'));
  if (hasWarfarin && hasAspirin) {
    warnings.push('Concurrent Anticoagulant + Antiplatelet therapy: Elevated bleeding risk. Monitor coagulation parameters.');
  }

  if (warnings.length === 0) {
    warnings.push('No acute high-risk contraindications flagged in documented baseline medicines.');
  }

  const medicationSafety = {
    activeMedicationCount: prescriptions.length,
    evaluatedMedicines: medNames,
    warnings,
    safetyNotice: 'Review drug-drug and drug-food safety before initiating or altering concurrent regimens.'
  };

  // 6. Stored AI Clinical Summary
  const aiStored = store.clinicalSummaries ? store.clinicalSummaries[userId] : null;

  return {
    patient: patientInfo,
    prescriptions,
    medicalInformation,
    investigations,
    medicationSafety,
    aiClinicalSummary: aiStored || null,
    disclaimer: 'This information is for informational purposes only. Consult a doctor or pharmacist for medical decisions.'
  };
}

// GET /api/patient/doctor-summary
exports.getDoctorSummary = async (req, res) => {
  try {
    const userId = req.user ? (req.user.id || req.user._id) : null;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const summary = await buildDoctorSummaryData(userId, req.user);
    return res.status(200).json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error fetching doctor summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve doctor summary.',
      error: error.message
    });
  }
};

// POST /api/patient/doctor-summary/generate
exports.generateDoctorSummary = async (req, res) => {
  try {
    const userId = req.user ? (req.user.id || req.user._id) : null;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const docSummary = await buildDoctorSummaryData(userId, req.user);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        success: false,
        error: 'Gemini API key is not configured.',
        clinicalOverview: 'Unable to generate AI summary: Gemini API key is missing.',
        disclaimer: 'This information is for informational purposes only. Consult a doctor or pharmacist for medical decisions.'
      });
    }

    const prompt = `You are an expert Chief Medical Officer / Clinical AI Assistant summarizing patient health records for a consulting doctor in MEDIGUARD AI — Smart Medication Safety System.

PATIENT & CLINICAL DATA:
Patient: ${JSON.stringify(docSummary.patient)}
Documented Prescriptions: ${JSON.stringify(docSummary.prescriptions)}
Medical Information (Diagnoses, Symptoms, Allergies): ${JSON.stringify(docSummary.medicalInformation)}
Investigations & Lab Results: ${JSON.stringify(docSummary.investigations)}
Medication Safety Signals: ${JSON.stringify(docSummary.medicationSafety)}

CRITICAL CLINICAL RULES:
1. Summarize ONLY information already available in the patient's records and prescriptions.
2. DO NOT invent or assume any diagnoses, medicines, dosages, test results, or patient facts.
3. If an item is not documented in the records, state clearly that it is unavailable or not documented.
4. Structure your clinical evaluation clearly for a busy doctor to review in 30 seconds.

Return ONLY a valid JSON object matching this schema:
{
  "clinicalOverview": "Concise 2-3 sentence clinical summary of patient status, active presentations, and documented history.",
  "keyClinicalFindings": ["List of key documented symptoms, conditions, or complaints"],
  "prescriptionAssessment": "Clear, objective summary of the active prescribed medicines and dosages.",
  "abnormalFindingsAlert": ["Important flagged lab tests or vital signs, or explicit note that none were found"],
  "medicationSafetyNotes": ["Identified medication interaction risks, contraindications, or monitoring requirements"],
  "consultationChecklist": ["Suggested high-priority clinical questions or verifications for the doctor during consultation"],
  "unavailableInformation": ["List of critical parameters NOT documented in current records (e.g. recent HbA1c, allergies)"]
}`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-flash-latest'];
    let lastError = null;

    for (const m of models) {
      try {
        const model = genAI.getGenerativeModel({
          model: m,
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = JSON.parse(text);

        // Store generated summary in fallback store if available
        try {
          const storePath = path.join(__dirname, '../../data/store.json');
          if (fs.existsSync(storePath)) {
            const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
            store.clinicalSummaries = store.clinicalSummaries || {};
            store.clinicalSummaries[userId] = parsed;
            fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
          }
        } catch (e) {
          // ignore store file write error
        }

        return res.status(200).json({
          success: true,
          modelUsed: m,
          summary: parsed,
          disclaimer: 'This information is for informational purposes only. Consult a doctor or pharmacist for medical decisions.'
        });
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    return res.status(200).json({
      success: false,
      error: 'Failed to generate AI doctor summary via Gemini.',
      message: lastError ? lastError.message : 'Service timeout',
      disclaimer: 'This information is for informational purposes only. Consult a doctor or pharmacist for medical decisions.'
    });

  } catch (error) {
    console.error('Error generating doctor summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error generating AI clinical summary.',
      error: error.message
    });
  }
};
