const AuditLog = require('../models/AuditLog');

class AuditLogService {
  /**
   * Log an auditable event
   */
  async logEvent({
    patientId = null,
    clinicalSessionId = null,
    action,
    actor = 'patient',
    resourceType = 'Consent',
    resourceId = '',
    status = 'success',
    details = {},
    ipAddress = ''
  }) {
    try {
      // Ensure sensitive clinical text is omitted from audit log payloads
      const sanitizedDetails = { ...details };
      delete sanitizedDetails.clinicalSummaryText;
      delete sanitizedDetails.rawText;
      delete sanitizedDetails.hpi;

      const log = new AuditLog({
        patientId,
        clinicalSessionId,
        action,
        actor,
        resourceType,
        resourceId: String(resourceId),
        status,
        details: sanitizedDetails,
        ipAddress,
        timestamp: new Date()
      });

      await log.save();
      return log;
    } catch (err) {
      console.error('[AuditLogService] Failed to record audit log:', err.message);
      return null;
    }
  }

  /**
   * Fetch audit logs for a patient or session
   */
  async getAuditLogs({ patientId, clinicalSessionId, limit = 50 }) {
    const query = {};
    if (patientId) query.patientId = patientId;
    if (clinicalSessionId) query.clinicalSessionId = clinicalSessionId;

    return await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit);
  }
}

module.exports = new AuditLogService();
