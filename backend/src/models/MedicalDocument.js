const mongoose = require('mongoose');

const medicalDocumentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID is required'],
      index: true
    },
    healthId: {
      type: String,
      required: [true, 'Health ID is required'],
      index: true,
      trim: true
    },
    originalFileName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true
    },
    storedFileName: {
      type: String,
      required: [true, 'Stored file name is required'],
      trim: true
    },
    fileType: {
      type: String,
      required: [true, 'File type is required'],
      trim: true
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required']
    },
    filePath: {
      type: String,
      required: [true, 'File path is required']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },

    // Step 3 Document Digitization Fields
    documentType: {
      type: String,
      enum: ['prescription', 'laboratory_report', 'discharge_summary', 'diagnostic_report', 'medical_report', 'other', 'unknown'],
      default: 'unknown'
    },
    documentDate: {
      type: Date,
      default: null
    },
    processingStatus: {
      type: String,
      enum: ['uploaded', 'processing', 'processed', 'needs_review', 'failed'],
      default: 'uploaded'
    },
    extractionConfidence: {
      type: Number,
      default: 0
    },
    detectedLanguage: {
      type: String,
      default: 'en'
    },
    isUserVerified: {
      type: Boolean,
      default: false
    },
    userVerifiedAt: {
      type: Date,
      default: null
    },

    // Backward compatibility fields
    aiAnalysisStatus: {
      type: String,
      enum: ['not_analyzed', 'processing', 'completed', 'failed', 'uploaded', 'processed', 'needs_review'],
      default: 'not_analyzed'
    },
    aiExtractedData: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    aiAnalyzedAt: {
      type: Date,
      default: null
    },
    aiError: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('MedicalDocument', medicalDocumentSchema);
