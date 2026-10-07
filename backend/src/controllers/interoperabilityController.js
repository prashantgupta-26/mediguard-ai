const fhirService = require('../services/fhirService');
const abdmAdapter = require('../services/abdmAdapter');
const hisAdapter = require('../services/hisAdapter');
const consentService = require('../services/consentService');
const auditLogService = require('../services/auditLogService');
const ClinicalSummary = require('../models/ClinicalSummary');
const MedicalDocument = require('../models/MedicalDocument');
const User = require('../models/User');

exports.generateFhirBundle = async (req, res) => {
  try {
    const { clinicalSummaryId, clinicalSessionId } = req.body;

    let summary = null;
    if (clinicalSummaryId) {
      summary = await ClinicalSummary.findById(clinicalSummaryId);
    }
    if (!summary && clinicalSessionId) {
      summary = await ClinicalSummary.findOne({ clinicalSessionId });
    }

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'Clinical summary not found for FHIR Bundle generation'
      });
    }

    const patient = await User.findById(summary.patientId);
    const documents = await MedicalDocument.find({ patientId: summary.patientId });

    const fhirResult = fhirService.createFhirBundle({
      clinicalSummary: summary,
      patient,
      documents
    });

    await auditLogService.logEvent({
      patientId: summary.patientId,
      clinicalSessionId: summary.clinicalSessionId,
      action: 'FHIR_GENERATED',
      actor: 'system',
      resourceType: 'FHIRBundle',
      resourceId: fhirResult.bundle.id,
      status: 'success',
      details: { resourceCount: fhirResult.bundle.entry.length }
    });

    return res.status(200).json({
      success: true,
      message: 'FHIR R4 Bundle generated successfully',
      bundle: fhirResult.bundle,
      validation: fhirResult.validation
    });
  } catch (error) {
    console.error('[InteroperabilityController] Error generating FHIR Bundle:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate FHIR Bundle',
      error: error.message
    });
  }
};

exports.shareWithHis = async (req, res) => {
  try {
    const { clinicalSessionId, clinicalSummaryId } = req.body;
    const patientId = req.user ? req.user._id : req.body.patientId;

    // Check consent scope
    const hasPermission = await consentService.checkPermission({
      patientId,
      clinicalSessionId,
      scopeKey: 'hisSharing'
    });

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Patient consent required for sharing with Hospital HIS system.',
        status: 'consent_required'
      });
    }

    let summary = null;
    if (clinicalSummaryId) summary = await ClinicalSummary.findById(clinicalSummaryId);
    if (!summary && clinicalSessionId) summary = await ClinicalSummary.findOne({ clinicalSessionId });

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'Clinical summary not found'
      });
    }

    const patient = await User.findById(summary.patientId);
    const documents = await MedicalDocument.find({ patientId: summary.patientId });

    const fhirResult = fhirService.createFhirBundle({
      clinicalSummary: summary,
      patient,
      documents
    });

    const result = await hisAdapter.shareBundleWithHis({
      patientId: summary.patientId,
      clinicalSessionId: summary.clinicalSessionId,
      fhirBundle: fhirResult.bundle
    });

    return res.status(200).json({
      ...result,
      fhirBundle: fhirResult.bundle
    });
  } catch (error) {
    console.error('[InteroperabilityController] Error sharing with HIS:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process HIS sharing',
      error: error.message
    });
  }
};

exports.shareWithAbdm = async (req, res) => {
  try {
    const { clinicalSessionId, clinicalSummaryId } = req.body;
    const patientId = req.user ? req.user._id : req.body.patientId;

    // Check consent scope
    const hasPermission = await consentService.checkPermission({
      patientId,
      clinicalSessionId,
      scopeKey: 'abdmSharing'
    });

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Patient consent required for ABDM Health Repository exchange.',
        status: 'consent_required'
      });
    }

    let summary = null;
    if (clinicalSummaryId) summary = await ClinicalSummary.findById(clinicalSummaryId);
    if (!summary && clinicalSessionId) summary = await ClinicalSummary.findOne({ clinicalSessionId });

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'Clinical summary not found'
      });
    }

    const patient = await User.findById(summary.patientId);
    const documents = await MedicalDocument.find({ patientId: summary.patientId });

    const fhirResult = fhirService.createFhirBundle({
      clinicalSummary: summary,
      patient,
      documents
    });

    const result = await abdmAdapter.shareRecord({
      patientId: summary.patientId,
      clinicalSessionId: summary.clinicalSessionId,
      fhirBundle: fhirResult.bundle
    });

    return res.status(200).json({
      ...result,
      fhirBundle: fhirResult.bundle
    });
  } catch (error) {
    console.error('[InteroperabilityController] Error sharing with ABDM:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process ABDM sharing',
      error: error.message
    });
  }
};

exports.getIntegrationStatus = async (req, res) => {
  try {
    const abdmStatus = abdmAdapter.getStatus();
    const hisStatus = hisAdapter.getStatus();

    const patientId = req.user ? req.user._id : req.query.patientId;
    const { clinicalSessionId } = req.query;

    const consentStatus = await consentService.getConsentStatus({
      patientId,
      clinicalSessionId
    });

    let summaryExists = false;
    if (clinicalSessionId) {
      const summary = await ClinicalSummary.findOne({ clinicalSessionId });
      summaryExists = Boolean(summary);
    }

    let patient = null;
    if (patientId) {
      patient = await User.findById(patientId);
    }

    return res.status(200).json({
      success: true,
      abdmStatus,
      hisStatus,
      statuses: {
        localRecord: {
          ready: summaryExists,
          status: summaryExists ? 'Ready' : 'In Progress'
        },
        fhirBundle: {
          ready: summaryExists,
          version: 'FHIR R4 (HL7 Standard)'
        },
        consent: {
          granted: consentStatus.hasConsent,
          status: consentStatus.status,
          scope: consentStatus.scope
        },
        abha: {
          linked: patient?.abhaStatus === 'linked',
          status: patient?.abhaStatus || 'not_linked',
          abhaNumber: patient?.abhaNumber || null
        },
        abdm: abdmStatus,
        his: hisStatus
      }
    });
  } catch (error) {
    console.error('[InteroperabilityController] Error fetching status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch integration status',
      error: error.message
    });
  }
};

exports.linkAbhaNumber = async (req, res) => {
  try {
    const { abhaNumber } = req.body;
    const patientId = req.user ? req.user._id : req.body.patientId;

    if (!abhaNumber) {
      return res.status(400).json({
        success: false,
        message: 'ABHA Number is required'
      });
    }

    const adapterResult = await abdmAdapter.linkAbhaNumber({
      patientId,
      abhaNumber
    });

    if (patientId && adapterResult.success) {
      await User.findByIdAndUpdate(patientId, {
        abhaNumber,
        abhaStatus: 'linked'
      });
    }

    return res.status(200).json(adapterResult);
  } catch (error) {
    console.error('[InteroperabilityController] Error linking ABHA:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to link ABHA',
      error: error.message
    });
  }
};
