const mongoose = require('mongoose');

const answerItemSchema = new mongoose.Schema(
  {
    questionId: { type: String },
    section: { type: String },
    questionText: { type: String },
    answer: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
    inputMethod: {
      type: String,
      enum: ['touch', 'voice', 'document', 'ai_generated'],
      default: 'touch'
    }
  },
  { _id: false }
);

const clinicalHistorySchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      trim: true
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
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
    language: {
      type: String,
      default: 'en'
    },
    // 16 Structured Clinical Domains
    chiefComplaint: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    historyOfPresentIllness: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    pastMedicalHistory: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    pastSurgicalHistory: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    currentMedications: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    drugAllergies: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    familyHistory: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    personalHistory: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    dietHistory: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    sleepHistory: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    substanceUse: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    reviewOfSystems: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    previousInvestigations: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    previousDiagnoses: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    additionalNotes: {
      type: String,
      default: ''
    },
    isRedFlag: {
      type: Boolean,
      default: false
    },
    redFlags: [
      {
        symptom: { type: String },
        severity: { type: String, default: 'HIGH' },
        layer: { type: String },
        message: { type: String },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    conversationHistory: [
      {
        role: { type: String },
        text: { type: String },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    // Full audit log of raw question answers with timestamps and input methods
    rawAnswers: [answerItemSchema],
    completedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ClinicalHistory', clinicalHistorySchema);
