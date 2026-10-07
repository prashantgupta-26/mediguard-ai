const mongoose = require('mongoose');

const clinicalSummarySchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    clinicalSessionId: {
      type: String,
      required: true,
      index: true
    },
    patientHealthId: {
      type: String,
      default: null,
      trim: true
    },
    patientName: {
      type: String,
      default: null,
      trim: true
    },
    patientAge: {
      type: Number,
      default: null
    },
    patientGender: {
      type: String,
      default: null
    },

    // 1. Chief Complaint
    chiefComplaint: {
      type: mongoose.Schema.Types.Mixed,
      default: { text: 'Not provided', duration: '', source: 'patient_reported' }
    },

    // 2. History of Present Illness
    historyOfPresentIllness: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        onset: '',
        duration: '',
        progression: '',
        location: '',
        character: '',
        severity: '',
        associatedSymptoms: [],
        aggravatingFactors: [],
        relievingFactors: [],
        relevantNegatives: [],
        rawText: ''
      }
    },

    // 3. Past Medical History
    pastMedicalHistory: [
      {
        value: { type: String, required: true },
        source: { type: String, default: 'patient_reported' },
        verified: { type: Boolean, default: false },
        notes: { type: String, default: '' }
      }
    ],

    // 4. Past Surgical History
    pastSurgicalHistory: [
      {
        procedure: { type: String, required: true },
        date: { type: String, default: '' },
        details: { type: String, default: '' },
        source: { type: String, default: 'patient_reported' }
      }
    ],

    // 5. Current Medications
    currentMedications: [
      {
        name: { type: String, required: true },
        dose: { type: String, default: '' },
        frequency: { type: String, default: '' },
        route: { type: String, default: '' },
        duration: { type: String, default: '' },
        source: { type: String, default: 'patient_reported' },
        isPatientReported: { type: Boolean, default: true },
        isDocumentExtracted: { type: Boolean, default: false },
        documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalDocument', default: null }
      }
    ],

    // 6. Drug Allergies
    drugAllergies: [
      {
        allergen: { type: String, required: true },
        reaction: { type: String, default: '' },
        severity: { type: String, default: 'unknown' },
        source: { type: String, default: 'patient_reported' }
      }
    ],
    noKnownAllergiesReported: {
      type: Boolean,
      default: false
    },
    allergiesAssessed: {
      type: Boolean,
      default: false
    },

    // 7. Family History
    familyHistory: [
      {
        condition: { type: String, required: true },
        relation: { type: String, default: '' },
        source: { type: String, default: 'patient_reported' }
      }
    ],

    // 8. Personal History
    personalHistory: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        diet: 'Not provided',
        appetite: 'Not provided',
        sleep: 'Not provided',
        bowel: 'Not provided',
        bladder: 'Not provided',
        smoking: 'Not provided',
        alcohol: 'Not provided',
        tobacco: 'Not provided',
        occupation: 'Not provided',
        lifestyle: 'Not provided'
      }
    },

    // 9. Review of Systems
    reviewOfSystems: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    // 10. Prior Investigations & Lab Findings
    priorInvestigations: [
      {
        testName: { type: String, required: true },
        testDate: { type: String, default: '' },
        resultValue: { type: String, default: '' },
        unit: { type: String, default: '' },
        referenceRange: { type: String, default: '' },
        isAbnormal: { type: Boolean, default: false },
        source: { type: String, default: 'medical_document' },
        documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalDocument', default: null }
      }
    ],

    // 11. Processed Document Findings
    documentFindings: [
      {
        documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalDocument' },
        documentType: { type: String },
        fileName: { type: String },
        summaryText: { type: String },
        keyExtractions: { type: mongoose.Schema.Types.Mixed }
      }
    ],

    // 12. AYUSH Dashavidha Pariksha
    ayushHistory: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },

    // 13. Red Flags & Deterministic Alerts
    redFlags: [
      {
        symptom: { type: String },
        severity: { type: String, default: 'HIGH' },
        category: { type: String, default: 'priority_alert' },
        layer: { type: String },
        message: { type: String },
        timestamp: { type: Date, default: Date.now }
      }
    ],

    // 14. Explicit Missing Information Audit
    missingInformation: [
      { type: String }
    ],

    // 15. Source Conflicts
    conflicts: [
      {
        field: { type: String },
        patientValue: { type: String },
        documentValue: { type: String },
        notes: { type: String, default: 'Source conflict — physician review required' }
      }
    ],

    // Summary Text / Structured Response from Gemini
    generatedSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    clinicalSummaryText: {
      type: String,
      default: ''
    },
    summaryLanguage: {
      type: String,
      enum: ['en', 'hi', 'bn'],
      default: 'en'
    },

    // Status and Physician Verification
    status: {
      type: String,
      enum: ['draft', 'patient_review', 'patient_confirmed', 'physician_review', 'physician_verified'],
      default: 'draft'
    },
    patientConfirmed: {
      type: Boolean,
      default: false
    },
    patientConfirmedAt: {
      type: Date,
      default: null
    },
    physicianVerified: {
      type: Boolean,
      default: false
    },
    physicianVerifiedAt: {
      type: Date,
      default: null
    },
    physicianEdited: {
      type: Boolean,
      default: false
    },
    physicianNotes: {
      type: String,
      default: ''
    },
    verifiedByPhysicianName: {
      type: String,
      default: ''
    },

    // Versioning
    version: {
      type: Number,
      default: 1
    },
    versionHistory: [
      {
        version: { type: Number },
        summaryData: { type: mongoose.Schema.Types.Mixed },
        modifiedBy: { type: String },
        modifiedAt: { type: Date, default: Date.now },
        changeReason: { type: String }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ClinicalSummary', clinicalSummarySchema);
