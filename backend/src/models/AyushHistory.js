const mongoose = require('mongoose');

const ayushHistorySchema = new mongoose.Schema(
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

    // Dashavidha Pariksha 10 Dimensions
    prakriti: {
      value: { type: String, default: 'Not assessed' },
      doshaDominance: { type: String, default: '' },
      confidence: { type: String, default: 'patient_reported' },
      source: { type: String, default: 'patient_reported' },
      details: { type: String, default: '' }
    },
    vikriti: {
      value: { type: String, default: 'Not assessed' },
      imbalanceDetails: { type: String, default: '' },
      source: { type: String, default: 'patient_reported' }
    },
    sara: {
      value: { type: String, default: 'Not assessed' },
      details: { type: String, default: '' },
      source: { type: String, default: 'patient_reported' }
    },
    samhanana: {
      value: { type: String, default: 'Not assessed' },
      details: { type: String, default: '' },
      source: { type: String, default: 'patient_reported' }
    },
    pramana: {
      value: { type: String, default: 'Not assessed' },
      details: { type: String, default: '' },
      source: { type: String, default: 'patient_reported' }
    },
    satmya: {
      value: { type: String, default: 'Not assessed' },
      details: { type: String, default: '' },
      source: { type: String, default: 'patient_reported' }
    },
    sattva: {
      value: { type: String, default: 'Not assessed' },
      details: { type: String, default: '' },
      source: { type: String, default: 'patient_reported' }
    },
    aharaShakti: {
      value: { type: String, default: 'Not assessed' },
      appetiteDigestiveFire: { type: String, default: '' },
      source: { type: String, default: 'patient_reported' }
    },
    vyayamaShakti: {
      value: { type: String, default: 'Not assessed' },
      physicalCapacity: { type: String, default: '' },
      source: { type: String, default: 'patient_reported' }
    },
    vaya: {
      value: { type: String, default: 'Not assessed' },
      ageGroup: { type: String, default: '' },
      source: { type: String, default: 'patient_reported' }
    },

    // Ahara & Vihara Lifestyle Context
    ahara: {
      dietaryHabits: { type: String, default: 'Not provided' },
      tastePreferences: { type: String, default: 'Not provided' },
      mealTimings: { type: String, default: 'Not provided' }
    },
    vihara: {
      dailyRoutine: { type: String, default: 'Not provided' },
      sleepPattern: { type: String, default: 'Not provided' },
      seasonalHabits: { type: String, default: 'Not provided' }
    },

    rawAnswers: [
      {
        questionId: { type: String },
        questionText: { type: String },
        answer: { type: mongoose.Schema.Types.Mixed },
        inputMethod: { type: String, default: 'touch' },
        timestamp: { type: Date, default: Date.now }
      }
    ],

    summaryText: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AyushHistory', ayushHistorySchema);
