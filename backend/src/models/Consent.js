const mongoose = require('mongoose');

const consentSchema = new mongoose.Schema(
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
    consentType: {
      type: String,
      default: 'intake_and_interoperability'
    },
    scope: {
      clinicalIntake: { type: Boolean, default: true },
      documentProcessing: { type: Boolean, default: true },
      hisSharing: { type: Boolean, default: true },
      abdmSharing: { type: Boolean, default: true }
    },
    status: {
      type: String,
      enum: ['pending', 'granted', 'revoked', 'expired'],
      default: 'granted'
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'bn'],
      default: 'en'
    },
    grantedAt: {
      type: Date,
      default: Date.now
    },
    revokedAt: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days default
    },
    ipAddress: {
      type: String,
      default: ''
    },
    userAgent: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Consent', consentSchema);
