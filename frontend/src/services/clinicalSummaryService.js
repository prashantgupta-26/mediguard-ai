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
 * Fetch AYUSH Dashavidha Pariksha questions
 */
export const getAyushQuestions = async () => {
  const res = await fetch(`${API_BASE}/ayush/questions`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch AYUSH questions');
  return await res.json();
};

/**
 * Submit AYUSH intake answers
 */
export const submitAyushIntake = async ({ clinicalSessionId, patientId, answers, language }) => {
  const res = await fetch(`${API_BASE}/ayush/submit`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ clinicalSessionId, patientId, answers, language })
  });
  if (!res.ok) throw new Error('Failed to save AYUSH intake');
  return await res.json();
};

/**
 * Fetch AYUSH intake record by session ID
 */
export const getAyushBySession = async (sessionId) => {
  const res = await fetch(`${API_BASE}/ayush/session/${sessionId}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch AYUSH record');
  return await res.json();
};

/**
 * Generate structured clinical summary via Gemini / MediKiosk Safe Engine
 */
export const generateClinicalSummary = async ({ clinicalSessionId, patientId, summaryLanguage = 'en' }) => {
  const res = await fetch(`${API_BASE}/clinical-summary/generate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ clinicalSessionId, patientId, summaryLanguage })
  });
  if (!res.ok) throw new Error('Failed to generate clinical summary');
  return await res.json();
};

/**
 * Get Clinical Summary by ID or sessionId
 */
export const getClinicalSummary = async (id) => {
  const res = await fetch(`${API_BASE}/clinical-summary/${id}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch clinical summary');
  return await res.json();
};

/**
 * Patient Confirmation
 */
export const confirmPatientSummary = async (id) => {
  const res = await fetch(`${API_BASE}/clinical-summary/${id}/confirm`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to confirm patient summary');
  return await res.json();
};

/**
 * Physician Verification & Edits
 */
export const verifyPhysicianSummary = async (id, { physicianNotes, physicianName, edits }) => {
  const res = await fetch(`${API_BASE}/clinical-summary/${id}/verify`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ physicianNotes, physicianName, edits })
  });
  if (!res.ok) throw new Error('Failed to verify clinical summary');
  return await res.json();
};

/**
 * Fetch Unified Multi-Source Medical Timeline
 */
export const getMedicalTimeline = async (patientIdOrSessionId) => {
  const res = await fetch(`${API_BASE}/clinical-summary/${patientIdOrSessionId}/timeline`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch medical timeline');
  return await res.json();
};
