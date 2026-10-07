const API_BASE = '/api';

/**
 * Helper to include auth headers when token exists
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

/**
 * Grant Consent
 */
export const grantConsent = async ({ clinicalSessionId, patientId, scope, language = 'en' }) => {
  const res = await fetch(`${API_BASE}/consent/grant`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ clinicalSessionId, patientId, scope, language })
  });
  if (!res.ok) throw new Error('Failed to grant consent');
  return await res.json();
};

/**
 * Revoke Consent
 */
export const revokeConsent = async ({ clinicalSessionId, patientId }) => {
  const res = await fetch(`${API_BASE}/consent/revoke`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ clinicalSessionId, patientId })
  });
  if (!res.ok) throw new Error('Failed to revoke consent');
  return await res.json();
};

/**
 * Get Consent Status
 */
export const getConsentStatus = async (clinicalSessionId) => {
  const res = await fetch(`${API_BASE}/consent/status/${clinicalSessionId}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch consent status');
  return await res.json();
};

/**
 * Fetch Audit Logs
 */
export const getAuditLogs = async (clinicalSessionId = '') => {
  const url = clinicalSessionId
    ? `${API_BASE}/consent/audit-logs?clinicalSessionId=${clinicalSessionId}`
    : `${API_BASE}/consent/audit-logs`;
  const res = await fetch(url, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return await res.json();
};

/**
 * Generate FHIR R4 Bundle
 */
export const generateFhirBundle = async ({ clinicalSummaryId, clinicalSessionId }) => {
  const res = await fetch(`${API_BASE}/interoperability/fhir/bundle`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ clinicalSummaryId, clinicalSessionId })
  });
  if (!res.ok) throw new Error('Failed to generate FHIR bundle');
  return await res.json();
};

/**
 * Share with Hospital HIS/EMR
 */
export const shareWithHis = async ({ clinicalSessionId, clinicalSummaryId }) => {
  const res = await fetch(`${API_BASE}/interoperability/share/his`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ clinicalSessionId, clinicalSummaryId })
  });
  if (!res.ok) throw new Error('Failed to process HIS sharing');
  return await res.json();
};

/**
 * Share with ABDM Ecosystem
 */
export const shareWithAbdm = async ({ clinicalSessionId, clinicalSummaryId }) => {
  const res = await fetch(`${API_BASE}/interoperability/share/abdm`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ clinicalSessionId, clinicalSummaryId })
  });
  if (!res.ok) throw new Error('Failed to process ABDM sharing');
  return await res.json();
};

/**
 * Get Real Integration Status
 */
export const getIntegrationStatus = async (clinicalSessionId = '') => {
  const url = clinicalSessionId
    ? `${API_BASE}/interoperability/status?clinicalSessionId=${clinicalSessionId}`
    : `${API_BASE}/interoperability/status`;
  const res = await fetch(url, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch integration status');
  return await res.json();
};

/**
 * Link ABHA Number
 */
export const linkAbhaNumber = async ({ abhaNumber, patientId }) => {
  const res = await fetch(`${API_BASE}/interoperability/abha/link`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ abhaNumber, patientId })
  });
  if (!res.ok) throw new Error('Failed to link ABHA number');
  return await res.json();
};
