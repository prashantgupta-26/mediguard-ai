const auditLogService = require('./auditLogService');

class HisAdapter {
  constructor() {
    this.baseUrl = process.env.HIS_BASE_URL || '';
    this.clientId = process.env.HIS_CLIENT_ID || '';
    this.clientSecret = process.env.HIS_CLIENT_SECRET || '';
  }

  /**
   * Check HIS configuration status
   */
  getStatus() {
    const isConfigured = Boolean(this.baseUrl);
    return {
      connected: isConfigured,
      configured: isConfigured,
      baseUrl: this.baseUrl ? this.baseUrl : 'Not set',
      message: isConfigured
        ? 'Hospital HIS/EMR Adapter Ready'
        : 'Hospital HIS integration is not configured in this environment.'
    };
  }

  /**
   * Share FHIR Bundle with Hospital HIS/EMR
   */
  async shareBundleWithHis({ patientId, clinicalSessionId, fhirBundle }) {
    const status = this.getStatus();
    if (!status.configured) {
      await auditLogService.logEvent({
        patientId,
        clinicalSessionId,
        action: 'HIS_SHARING_INITIATED',
        actor: 'patient',
        resourceType: 'FHIRBundle',
        status: 'failed',
        details: { reason: 'HIS_BASE_URL not configured' }
      });

      return {
        success: false,
        status: 'not_configured',
        message: 'FHIR payload prepared successfully. Hospital HIS transmission is not configured in this environment.',
        fhirBundle
      };
    }

    try {
      await auditLogService.logEvent({
        patientId,
        clinicalSessionId,
        action: 'HIS_SHARING_INITIATED',
        actor: 'patient',
        resourceType: 'FHIRBundle',
        status: 'success'
      });

      const res = await fetch(`${this.baseUrl}/api/fhir/receive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/fhir+json',
          'Authorization': `Bearer ${this.clientSecret}`
        },
        body: JSON.stringify(fhirBundle)
      });

      if (!res.ok) {
        throw new Error(`HIS Server returned status ${res.status}`);
      }

      const responseData = await res.json();

      await auditLogService.logEvent({
        patientId,
        clinicalSessionId,
        action: 'HIS_SHARING_COMPLETED',
        actor: 'patient',
        resourceType: 'FHIRBundle',
        status: 'success'
      });

      return {
        success: true,
        status: 'shared_successfully',
        message: 'FHIR bundle transmitted to Hospital HIS successfully',
        data: responseData
      };
    } catch (err) {
      console.warn('[HisAdapter] HIS transmission failed:', err.message);

      await auditLogService.logEvent({
        patientId,
        clinicalSessionId,
        action: 'HIS_SHARING_FAILED',
        actor: 'patient',
        resourceType: 'FHIRBundle',
        status: 'failed',
        details: { error: err.message }
      });

      return {
        success: false,
        status: 'failed',
        message: 'Hospital system unavailable. Your information has been safely retained locally and can be resubmitted.',
        error: err.message,
        fhirBundle
      };
    }
  }
}

module.exports = new HisAdapter();
