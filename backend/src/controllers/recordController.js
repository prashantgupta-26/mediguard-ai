const fs = require('fs');
const path = require('path');
const MedicalDocument = require('../models/MedicalDocument');
const User = require('../models/User');
const { processMedicalDocument } = require('../services/medicalDocumentService');
const { extractDocumentInfo } = require('../services/aiService');

// Helper to sanitize file paths against path traversal
const getSafeAbsolutePath = (filePath) => {
  const safePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
  return path.resolve(safePath);
};

// @desc    Upload Single or Multiple Medical Documents
// @route   POST /api/patient/records/upload
exports.uploadRecord = async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No file selected. Please select a PDF, JPG, JPEG, or PNG document.'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.healthId) {
      files.forEach((f) => {
        if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });
      return res.status(404).json({
        success: false,
        message: 'Patient account or Health ID not found.'
      });
    }

    const createdDocuments = [];

    for (const f of files) {
      const document = await MedicalDocument.create({
        patientId: user._id,
        healthId: user.healthId,
        originalFileName: path.basename(f.originalname),
        storedFileName: f.filename,
        fileType: f.mimetype,
        fileSize: f.size,
        filePath: f.path,
        processingStatus: 'processing',
        aiAnalysisStatus: 'processing'
      });

      // Process document with Gemini API
      try {
        const absolutePath = getSafeAbsolutePath(f.path);
        const extracted = await processMedicalDocument(absolutePath, f.mimetype);

        document.documentType = extracted.documentType || 'medical_report';
        document.documentDate = extracted.documentDate ? new Date(extracted.documentDate) : document.uploadedAt;
        document.processingStatus = extracted.processingStatus || 'processed';
        document.extractionConfidence = extracted.extractionConfidence || 0.85;
        document.detectedLanguage = extracted.detectedLanguage || 'en';
        document.aiExtractedData = extracted;
        document.aiAnalysisStatus = 'completed';
        document.aiAnalyzedAt = new Date();
        document.aiError = null;
        await document.save();
      } catch (procErr) {
        console.warn(`[RecordController] Processing error for document ${document._id}:`, procErr.message);
        document.processingStatus = 'failed';
        document.aiAnalysisStatus = 'failed';
        document.aiError = procErr.message || 'AI document processing failed';
        await document.save();
      }

      createdDocuments.push({
        id: document._id,
        originalFileName: document.originalFileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        documentType: document.documentType,
        processingStatus: document.processingStatus,
        extractionConfidence: document.extractionConfidence,
        isUserVerified: document.isUserVerified,
        uploadedAt: document.uploadedAt
      });
    }

    return res.status(201).json({
      success: true,
      message: `${createdDocuments.length} document(s) uploaded and processed successfully.`,
      documents: createdDocuments
    });
  } catch (error) {
    console.error('Upload record error:', error);
    if (req.files) {
      req.files.forEach((f) => {
        if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });
    } else if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while uploading document'
    });
  }
};

// @desc    Get Patient Medical Documents List & Medical Timeline
// @route   GET /api/patient/records
exports.getRecords = async (req, res) => {
  try {
    const documents = await MedicalDocument.find({ patientId: req.user.id })
      .sort({ uploadedAt: -1 })
      .select('-__v');

    const formattedDocs = documents.map((doc) => {
      const docDate = doc.documentDate || doc.uploadedAt;
      return {
        id: doc._id,
        originalFileName: doc.originalFileName,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        healthId: doc.healthId,
        documentType: doc.documentType || 'unknown',
        documentDate: docDate,
        processingStatus: doc.processingStatus || doc.aiAnalysisStatus || 'uploaded',
        extractionConfidence: doc.extractionConfidence || 0,
        detectedLanguage: doc.detectedLanguage || 'en',
        isUserVerified: doc.isUserVerified || false,
        uploadedAt: doc.uploadedAt,
        aiAnalysisStatus: doc.aiAnalysisStatus || 'not_analyzed',
        aiAnalyzedAt: doc.aiAnalyzedAt || null,
        hasAnalysis: !!doc.aiExtractedData,
        extractedData: doc.aiExtractedData || null
      };
    });

    // Build Medical Timeline grouped chronologically by Document Date
    const timelineSorted = [...formattedDocs].sort((a, b) => new Date(b.documentDate) - new Date(a.documentDate));

    const timeline = timelineSorted.map((doc) => {
      const dateObj = new Date(doc.documentDate);
      const year = isNaN(dateObj.getFullYear()) ? 'Unknown' : String(dateObj.getFullYear());
      const formattedDate = isNaN(dateObj.getTime())
        ? 'N/A'
        : dateObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

      return {
        id: doc.id,
        originalFileName: doc.originalFileName,
        documentType: doc.documentType,
        documentDate: doc.documentDate,
        formattedDate,
        year,
        processingStatus: doc.processingStatus,
        isUserVerified: doc.isUserVerified,
        summaryText: doc.extractedData?.prescription?.diagnosisOrIndication
          || doc.extractedData?.dischargeSummary?.diagnosis
          || doc.extractedData?.generalFindings?.diagnosesMentioned?.[0]
          || `${doc.documentType.replace(/_/g, ' ').toUpperCase()} Document`
      };
    });

    return res.status(200).json({
      success: true,
      documents: formattedDocs,
      timeline
    });
  } catch (error) {
    console.error('Get records error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching medical documents'
    });
  }
};

// @desc    Get Single Medical Document Details & Extracted Data
// @route   GET /api/patient/records/:id
exports.getRecordById = async (req, res) => {
  try {
    const document = await MedicalDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Medical document not found'
      });
    }

    if (document.patientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not have permission to view this document'
      });
    }

    return res.status(200).json({
      success: true,
      document: {
        id: document._id,
        originalFileName: document.originalFileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        healthId: document.healthId,
        documentType: document.documentType,
        documentDate: document.documentDate || document.uploadedAt,
        processingStatus: document.processingStatus,
        extractionConfidence: document.extractionConfidence,
        detectedLanguage: document.detectedLanguage,
        isUserVerified: document.isUserVerified,
        userVerifiedAt: document.userVerifiedAt,
        uploadedAt: document.uploadedAt,
        extractedData: document.aiExtractedData
      }
    });
  } catch (error) {
    console.error('Get record by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching document details'
    });
  }
};

// @desc    Stream / View Private Medical Document File Safely
// @route   GET /api/patient/records/:id/view
exports.viewRecord = async (req, res) => {
  try {
    const document = await MedicalDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Medical document not found'
      });
    }

    if (document.patientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not have permission to view this document'
      });
    }

    const absolutePath = getSafeAbsolutePath(document.filePath);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        success: false,
        message: 'Physical document file missing from storage'
      });
    }

    res.setHeader('Content-Type', document.fileType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(document.originalFileName)}"`
    );

    return res.sendFile(absolutePath);
  } catch (error) {
    console.error('View record error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while opening document'
    });
  }
};

// @desc    Delete Medical Document
// @route   DELETE /api/patient/records/:id
exports.deleteRecord = async (req, res) => {
  try {
    const document = await MedicalDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Medical document not found'
      });
    }

    if (document.patientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not have permission to delete this document'
      });
    }

    const absolutePath = getSafeAbsolutePath(document.filePath);
    if (fs.existsSync(absolutePath)) {
      try {
        fs.unlinkSync(absolutePath);
      } catch (fsErr) {
        console.warn('File unlink warning:', fsErr.message);
      }
    }

    await MedicalDocument.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Medical document deleted successfully'
    });
  } catch (error) {
    console.error('Delete record error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting document'
    });
  }
};

// @desc    Process / Re-process Medical Document with Gemini AI
// @route   POST /api/patient/records/:id/process (also /analyze)
exports.processRecord = async (req, res) => {
  try {
    const document = await MedicalDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Medical document not found'
      });
    }

    if (document.patientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not have permission to process this document'
      });
    }

    const absolutePath = getSafeAbsolutePath(document.filePath);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        success: false,
        message: 'Physical document file missing from storage'
      });
    }

    document.processingStatus = 'processing';
    document.aiAnalysisStatus = 'processing';
    document.aiError = null;
    await document.save();

    try {
      const extracted = await processMedicalDocument(absolutePath, document.fileType);

      document.documentType = extracted.documentType || 'medical_report';
      document.documentDate = extracted.documentDate ? new Date(extracted.documentDate) : document.uploadedAt;
      document.processingStatus = extracted.processingStatus || 'processed';
      document.extractionConfidence = extracted.extractionConfidence || 0.85;
      document.detectedLanguage = extracted.detectedLanguage || 'en';
      document.aiExtractedData = extracted;
      document.aiAnalysisStatus = 'completed';
      document.aiAnalyzedAt = new Date();
      document.aiError = null;
      await document.save();

      return res.status(200).json({
        success: true,
        message: 'Medical document processed successfully with Gemini AI.',
        document: {
          id: document._id,
          documentType: document.documentType,
          processingStatus: document.processingStatus,
          extractionConfidence: document.extractionConfidence,
          extractedData: extracted
        }
      });
    } catch (procErr) {
      console.error('Gemini Processing error:', procErr);
      document.processingStatus = 'failed';
      document.aiAnalysisStatus = 'failed';
      document.aiError = procErr.message || 'Unable to process document';
      await document.save();

      return res.status(500).json({
        success: false,
        message: 'Unable to process document with AI. Original document remains stored.',
        error: procErr.message
      });
    }
  } catch (error) {
    console.error('Process controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during document processing'
    });
  }
};

// @desc    Update Patient Verification of Extracted Data
// @route   PATCH /api/patient/records/:id
exports.updateRecordVerification = async (req, res) => {
  try {
    const document = await MedicalDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Medical document not found'
      });
    }

    if (document.patientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not have permission to edit this document'
      });
    }

    const { extractedData, documentType, documentDate } = req.body;

    if (extractedData) {
      document.aiExtractedData = extractedData;
    }
    if (documentType) {
      document.documentType = documentType;
    }
    if (documentDate) {
      document.documentDate = new Date(documentDate);
    }

    document.isUserVerified = true;
    document.userVerifiedAt = new Date();
    document.processingStatus = 'processed';
    document.aiAnalysisStatus = 'completed';

    await document.save();

    return res.status(200).json({
      success: true,
      message: 'Document information verified and updated successfully.',
      document: {
        id: document._id,
        documentType: document.documentType,
        processingStatus: document.processingStatus,
        isUserVerified: document.isUserVerified,
        userVerifiedAt: document.userVerifiedAt,
        extractedData: document.aiExtractedData
      }
    });
  } catch (error) {
    console.error('Update verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating document verification'
    });
  }
};

// Backward compatibility alias for analyzeRecord
exports.analyzeRecord = exports.processRecord;

// Backward compatibility alias for getRecordAnalysis
exports.getRecordAnalysis = async (req, res) => {
  try {
    const document = await MedicalDocument.findById(req.params.id);
    if (!document || document.patientId.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    return res.status(200).json({
      success: true,
      status: document.processingStatus || document.aiAnalysisStatus,
      analyzedAt: document.aiAnalyzedAt,
      analysis: document.aiExtractedData
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching analysis' });
  }
};
