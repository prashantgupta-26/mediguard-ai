const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    bloodGroup: {
      type: String,
      default: null,
      trim: true
    },
    height: {
      type: String,
      default: null,
      trim: true
    },
    weight: {
      type: String,
      default: null,
      trim: true
    },
    allergies: {
      type: String,
      default: null,
      trim: true
    },
    existingConditions: {
      type: String,
      default: null,
      trim: true
    },
    currentMedications: {
      type: String,
      default: null,
      trim: true
    },
    patientNotes: {
      type: String,
      default: null,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('HealthRecord', healthRecordSchema);
