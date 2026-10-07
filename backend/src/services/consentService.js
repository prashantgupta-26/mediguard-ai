const Consent = require('../models/Consent');
const auditLogService = require('./auditLogService');

class ConsentService {
  /**
   * Grant consent with explicit granular scopes
   */
  async grantConsent({
    patientId,
    clinicalSessionId,
    scope = {},
    language = 'en',
    ipAddress = '',
    userAgent = ''
  }) {
    let consentDoc = await Consent.findOne({ clinicalSessionId });

    if (!consentDoc) {
      consentDoc = new Consent({
        patientId,
        clinicalSessionId
      });
    }

    consentDoc.status = 'granted';
    consentDoc.language = language;
    consentDoc.grantedAt = new Date();
    consentDoc.revokedAt = null;
    consentDoc.ipAddress = ipAddress;
    consentDoc.userAgent = userAgent;

    consentDoc.scope = {
      clinicalIntake: scope.clinicalIntake !== false,
      documentProcessing: scope.documentProcessing !== false,
      hisSharing: scope.hisSharing !== false,
      abdmSharing: scope.abdmSharing !== false
    };

    await consentDoc.save();

    // Audit log entry
    await auditLogService.logEvent({
      patientId,
      clinicalSessionId,
      action: 'CONSENT_GRANTED',
      actor: 'patient',
      resourceType: 'Consent',
      resourceId: consentDoc._id,
      status: 'success',
      details: { scope: consentDoc.scope, language },
      ipAddress
    });

    return consentDoc;
  }

  /**
   * Revoke consent
   */
  async revokeConsent({ patientId, clinicalSessionId, ipAddress = '' }) {
    const consentDoc = await Consent.findOne({ clinicalSessionId });

    if (!consentDoc) {
      throw new Error('No active consent record found to revoke.');
    }

    consentDoc.status = 'revoked';
    consentDoc.revokedAt = new Date();
    await consentDoc.save();

    // Audit log entry
    await auditLogService.logEvent({
      patientId,
      clinicalSessionId,
      action: 'CONSENT_REVOKED',
      actor: 'patient',
      resourceType: 'Consent',
      resourceId: consentDoc._id,
      status: 'success',
      details: { revokedAt: consentDoc.revokedAt },
      ipAddress
    });

    return consentDoc;
  }

  /**
   * Get consent status for session
   */
  async getConsentStatus({ patientId, clinicalSessionId }) {
    let consentDoc = null;
    if (clinicalSessionId) {
      consentDoc = await Consent.findOne({ clinicalSessionId });
    }
    if (!consentDoc && patientId) {
      consentDoc = await Consent.findOne({ patientId }).sort({ createdAt: -1 });
    }

    if (!consentDoc) {
      return {
        hasConsent: false,
        status: 'pending',
        scope: {
          clinicalIntake: false,
          documentProcessing: false,
          hisSharing: false,
          abdmSharing: false
        }
      };
    }

    return {
      hasConsent: consentDoc.status === 'granted',
      status: consentDoc.status,
      scope: consentDoc.scope,
      grantedAt: consentDoc.grantedAt,
      revokedAt: consentDoc.revokedAt,
      consentId: consentDoc._id
    };
  }

  /**
   * Check specific scope permission
   */
  async checkPermission({ patientId, clinicalSessionId, scopeKey }) {
    const status = await this.getConsentStatus({ patientId, clinicalSessionId });
    if (!status.hasConsent) return false;
    return Boolean(status.scope && status.scope[scopeKey]);
  }
}

module.exports = new ConsentService();
