const mongoose = require('mongoose');

const clinicalSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
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
      enum: ['en', 'hi', 'bn'],
      default: 'en'
    },
    currentSection: {
      type: String,
      default: 'chief_complaint'
    },
    currentQuestionIndex: {
      type: Number,
      default: 0
    },
    answers: {
      type: Map,
      of: new mongoose.Schema(
        {
          questionId: { type: String, required: true },
          section: { type: String, required: true },
          questionText: { type: String },
          answer: { type: mongoose.Schema.Types.Mixed },
          inputMethod: {
            type: String,
            enum: ['touch', 'voice', 'document', 'ai_generated'],
            default: 'touch'
          },
          timestamp: { type: Date, default: Date.now }
        },
        { _id: false }
      ),
      default: {}
    },
    startTime: {
      type: Date,
      default: Date.now
    },
    lastActivityTime: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'timed_out', 'cancelled'],
      default: 'in_progress'
    },
    // Phase 2 Conversational & Red-Flag State
    mode: {
      type: String,
      enum: ['ai_conversational', 'touch_guided'],
      default: 'ai_conversational'
    },
    conversationHistory: [
      {
        role: { type: String, enum: ['system', 'model', 'user', 'assistant'] },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    structuredClinicalData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    currentAiQuestion: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    unansweredFields: [
      { type: String }
    ],
    isRedFlag: {
      type: Boolean,
      default: false
    },
    redFlags: [
      {
        symptom: { type: String },
        severity: { type: String, default: 'HIGH' },
        layer: { type: String, enum: ['deterministic', 'gemini', 'hybrid'] },
        message: { type: String },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ClinicalSession', clinicalSessionSchema);
