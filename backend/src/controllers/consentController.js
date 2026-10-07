const consentService = require('../services/consentService');
const auditLogService = require('../services/auditLogService');

exports.grantConsent = async (req, res) => {
  try {
    const { clinicalSessionId, scope, language } = req.body;
    const patientId = req.user ? (req.user.id || req.user._id) : req.body.patientId;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '';
    const userAgent = req.headers['user-agent'] || '';

    if (!clinicalSessionId) {
      return res.status(400).json({
        success: false,
        message: 'clinicalSessionId is required'
      });
    }

    const consent = await consentService.grantConsent({
      patientId,
      clinicalSessionId,
      scope,
      language,
      ipAddress,
      userAgent
    });

    return res.status(200).json({
      success: true,
      message: 'Patient consent granted successfully',
      consent
    });
  } catch (error) {
    console.error('[ConsentController] Error granting consent:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to grant consent',
      error: error.message
    });
  }
};

exports.revokeConsent = async (req, res) => {
  try {
    const { clinicalSessionId } = req.body;
    const patientId = req.user ? (req.user.id || req.user._id) : req.body.patientId;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '';

    if (!clinicalSessionId) {
      return res.status(400).json({
        success: false,
        message: 'clinicalSessionId is required'
      });
    }

    const consent = await consentService.revokeConsent({
      patientId,
      clinicalSessionId,
      ipAddress
    });

    return res.status(200).json({
      success: true,
      message: 'Patient consent revoked successfully',
      consent
    });
  } catch (error) {
    console.error('[ConsentController] Error revoking consent:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to revoke consent',
      error: error.message
    });
  }
};

exports.getConsentStatus = async (req, res) => {
  try {
    const { clinicalSessionId } = req.params;
    const patientId = req.user ? (req.user.id || req.user._id) : req.query.patientId;

    const status = await consentService.getConsentStatus({
      patientId,
      clinicalSessionId
    });

    return res.status(200).json({
      success: true,
      status
    });
  } catch (error) {
    console.error('[ConsentController] Error fetching consent status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch consent status',
      error: error.message
    });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const patientId = req.user ? (req.user.id || req.user._id) : req.query.patientId;
    const { clinicalSessionId } = req.query;

    const logs = await auditLogService.getAuditLogs({
      patientId,
      clinicalSessionId
    });

    return res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('[ConsentController] Error fetching audit logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message
    });
  }
};
