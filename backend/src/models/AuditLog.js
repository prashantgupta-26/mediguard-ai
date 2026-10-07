const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    clinicalSessionId: {
      type: String,
      default: null,
      index: true
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    actor: {
      type: String,
      enum: ['patient', 'physician', 'system'],
      default: 'patient'
    },
    resourceType: {
      type: String,
      default: 'Consent'
    },
    resourceId: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      default: 'success'
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
