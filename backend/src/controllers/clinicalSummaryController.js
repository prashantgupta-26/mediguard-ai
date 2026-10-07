const clinicalSummaryService = require('../services/clinicalSummaryService');
const ClinicalSummary = require('../models/ClinicalSummary');

exports.generateSummary = async (req, res) => {
  try {
    const { clinicalSessionId, summaryLanguage = 'en' } = req.body;
    const patientId = req.user ? (req.user.id || req.user._id) : req.body.patientId;

    if (!clinicalSessionId) {
      return res.status(400).json({
        success: false,
        message: 'clinicalSessionId is required'
      });
    }

    const summary = await clinicalSummaryService.generateClinicalSummary({
      patientId,
      clinicalSessionId,
      summaryLanguage
    });

    return res.status(200).json({
      success: true,
      message: 'Clinical summary generated successfully',
      summary
    });
  } catch (error) {
    console.error('[ClinicalSummaryController] Error generating summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate clinical summary',
      error: error.message
    });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const { id } = req.params;
    let summary = await ClinicalSummary.findById(id);

    if (!summary) {
      summary = await ClinicalSummary.findOne({ clinicalSessionId: id });
    }

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'Clinical summary not found'
      });
    }

    if (req.user && req.user.role === 'patient' && summary.patientId) {
      const userStr = (req.user.id || req.user._id).toString();
      const ownerStr = summary.patientId.toString();
      if (userStr !== ownerStr) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You do not have permission to view this summary'
        });
      }
    }

    return res.status(200).json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('[ClinicalSummaryController] Error fetching summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch clinical summary',
      error: error.message
    });
  }
};

exports.updateSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    let summary = await ClinicalSummary.findById(id);

    if (!summary) {
      summary = await ClinicalSummary.findOne({ clinicalSessionId: id });
    }

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'Clinical summary not found'
      });
    }

    if (req.user && req.user.role === 'patient' && summary.patientId) {
      const userStr = (req.user.id || req.user._id).toString();
      const ownerStr = summary.patientId.toString();
      if (userStr !== ownerStr) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You do not have permission to edit this summary'
        });
      }
    }

    // Apply allowed updates
    Object.assign(summary, updateData);
    summary.updatedAt = new Date();

    await summary.save();

    return res.status(200).json({
      success: true,
      message: 'Clinical summary updated successfully',
      summary
    });
  } catch (error) {
    console.error('[ClinicalSummaryController] Error updating summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update clinical summary',
      error: error.message
    });
  }
};

exports.confirmPatientSummary = async (req, res) => {
  try {
    const { id } = req.params;

    let summary = await ClinicalSummary.findById(id);
    if (!summary) {
      summary = await ClinicalSummary.findOne({ clinicalSessionId: id });
    }

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'Clinical summary not found'
      });
    }

    if (req.user && req.user.role === 'patient' && summary.patientId) {
      const userStr = (req.user.id || req.user._id).toString();
      const ownerStr = summary.patientId.toString();
      if (userStr !== ownerStr) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You do not have permission to confirm this summary'
        });
      }
    }

    summary.patientConfirmed = true;
    summary.patientConfirmedAt = new Date();
    summary.status = 'patient_confirmed';

    await summary.save();

    return res.status(200).json({
      success: true,
      message: 'Patient summary confirmed successfully',
      summary
    });
  } catch (error) {
    console.error('[ClinicalSummaryController] Error confirming patient summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to confirm patient summary',
      error: error.message
    });
  }
};

exports.verifyPhysicianSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const { physicianNotes, physicianName, edits } = req.body;

    let summary = await ClinicalSummary.findById(id);
    if (!summary) {
      summary = await ClinicalSummary.findOne({ clinicalSessionId: id });
    }

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'Clinical summary not found'
      });
    }

    // Role check for physician sign-off
    if (req.user && req.user.role === 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Physician sign-off requires a doctor or clinician account'
      });
    }

    if (edits) {
      summary.physicianEdited = true;
      Object.assign(summary, edits);
    }

    summary.physicianVerified = true;
    summary.physicianVerifiedAt = new Date();
    summary.physicianNotes = physicianNotes || summary.physicianNotes || '';
    summary.verifiedByPhysicianName = physicianName || (req.user?.name ? req.user.name : 'Physician');
    summary.status = 'physician_verified';

    await summary.save();

    return res.status(200).json({
      success: true,
      message: 'Clinical summary physician verification saved',
      summary
    });
  } catch (error) {
    console.error('[ClinicalSummaryController] Error verifying summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify clinical summary',
      error: error.message
    });
  }
};

exports.getTimeline = async (req, res) => {
  try {
    const patientId = req.user ? (req.user.id || req.user._id) : (req.params.patientId || req.query.patientId);

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'patientId is required'
      });
    }

    const timeline = await clinicalSummaryService.getMedicalTimeline(patientId);

    return res.status(200).json({
      success: true,
      timeline
    });
  } catch (error) {
    console.error('[ClinicalSummaryController] Error fetching timeline:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch medical timeline',
      error: error.message
    });
  }
};

