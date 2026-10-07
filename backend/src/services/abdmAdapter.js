const auditLogService = require('./auditLogService');

class AbdmAdapter {
  constructor() {
    this.mode = process.env.INTEGRATION_MODE || 'local';
    this.baseUrl = process.env.ABDM_BASE_URL || '';
    this.clientId = process.env.ABDM_CLIENT_ID || '';
    this.clientSecret = process.env.ABDM_CLIENT_SECRET || '';
  }

  /**
   * Check ABDM integration configuration status
   */
  getStatus() {
    const isConfigured = Boolean(this.baseUrl && this.clientId);
    return {
      connected: isConfigured,
      mode: this.mode,
      configured: isConfigured,
      baseUrl: this.baseUrl ? this.baseUrl : 'Not set',
      message: isConfigured
        ? `ABDM Sandbox adapter ready (${this.mode} mode)`
        : 'ABDM integration is not configured in this environment.'
    };
  }

  /**
   * Link ABHA Number
   */
  async linkAbhaNumber({ patientId, abhaNumber }) {
    const status = this.getStatus();
    if (!status.configured) {
      await auditLogService.logEvent({
        patientId,
        action: 'ABDM_ABHA_LINK_ATTEMPT',
        actor: 'patient',
        resourceType: 'ABHA',
        resourceId: abhaNumber,
        status: 'failed',
        details: { reason: 'ABDM environment credentials not configured' }
      });

      return {
        success: false,
        status: 'not_configured',
        message: 'ABDM integration is not configured in this environment.',
        abhaNumber
      };
    }

    try {
      // Real API execution when credentials provided
      const res = await fetch(`${this.baseUrl}/v0.5/abha/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CM-ID': 'sbx',
          'Authorization': `Bearer ${this.clientSecret}`
        },
        body: JSON.stringify({ abhaNumber })
      });

      const data = await res.json();

      await auditLogService.logEvent({
        patientId,
        action: 'ABDM_ABHA_LINKED',
        actor: 'patient',
        resourceType: 'ABHA',
        resourceId: abhaNumber,
        status: 'success',
        details: { abhaNumber }
      });

      return { success: true, data };
    } catch (err) {
      console.warn('[AbdmAdapter] Linking failed:', err.message);
      await auditLogService.logEvent({
        patientId,
        action: 'ABDM_ABHA_LINK_FAILED',
        actor: 'patient',
        resourceType: 'ABHA',
        resourceId: abhaNumber,
        status: 'failed',
        details: { error: err.message }
      });

      return {
        success: false,
        status: 'failed',
        message: 'ABDM Gateway unreachable: ' + err.message
      };
    }
  }

  /**
   * Share FHIR record with ABDM repository
   */
  async shareRecord({ patientId, clinicalSessionId, fhirBundle }) {
    const status = this.getStatus();
    if (!status.configured) {
      await auditLogService.logEvent({
        patientId,
        clinicalSessionId,
        action: 'ABDM_SHARING_INITIATED',
        actor: 'patient',
        resourceType: 'FHIRBundle',
        status: 'failed',
        details: { reason: 'ABDM environment credentials not configured' }
      });

      return {
        success: false,
        status: 'not_configured',
        message: 'FHIR payload prepared successfully. ABDM transmission is not configured in this environment.',
        fhirBundle
      };
    }

    // Official API call if credentials present
    try {
      const res = await fetch(`${this.baseUrl}/v0.5/health-information/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.clientSecret}`
        },
        body: JSON.stringify({ fhirBundle })
      });

      const data = await res.json();

      await auditLogService.logEvent({
        patientId,
        clinicalSessionId,
        action: 'ABDM_SHARING_COMPLETED',
        actor: 'patient',
        resourceType: 'FHIRBundle',
        status: 'success'
      });

      return { success: true, data };
    } catch (err) {
      console.error('[AbdmAdapter] Sharing failed:', err.message);
      await auditLogService.logEvent({
        patientId,
        clinicalSessionId,
        action: 'ABDM_SHARING_FAILED',
        actor: 'patient',
        resourceType: 'FHIRBundle',
        status: 'failed',
        details: { error: err.message }
      });

      return {
        success: false,
        status: 'failed',
        message: 'ABDM Health Repository unreachable: ' + err.message,
        fhirBundle
      };
    }
  }
}

module.exports = new AbdmAdapter();
