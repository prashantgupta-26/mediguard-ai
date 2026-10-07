import React, { useState } from 'react';
import { confirmPatientSummary } from '../services/clinicalSummaryService';

const PatientSummaryReview = ({ summary, onConfirmed, onEditRequested, onBack }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!summary) return null;

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const res = await confirmPatientSummary(summary._id || summary.clinicalSessionId);
      if (res.success && onConfirmed) {
        onConfirmed(res.summary);
      }
    } catch (err) {
      setError('Failed to confirm summary: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const overview = summary.generatedSummary?.patientOverview || {
    name: summary.patientName || 'Patient',
    age: summary.patientAge,
    gender: summary.patientGender
  };

  const chief = summary.chiefComplaint?.text || summary.generatedSummary?.chiefComplaint?.text || 'Not provided';
  const meds = summary.currentMedications || summary.generatedSummary?.currentMedications || [];
  const allergies = summary.drugAllergies || summary.generatedSummary?.drugAllergies || [];
  const noAllergies = summary.noKnownAllergiesReported;
  const redFlags = summary.redFlags || summary.generatedSummary?.redFlags || [];
  const ayushText = summary.ayushHistory?.summaryText || 'Not assessed';
  const missing = summary.missingInformation || summary.generatedSummary?.missingInformation || [];

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        {/* Banner */}
        <div style={styles.alertBanner}>
          <span style={styles.alertIcon}>ℹ️</span>
          <div>
            <h4 style={styles.alertTitle}>Please review your clinical history</h4>
            <p style={styles.alertText}>
              This is an AI-assisted summary of your responses and documents. Please verify that all information is accurate before submitting to your physician.
            </p>
          </div>
        </div>

        {/* Priority Red Flag Alert Banner */}
        {redFlags.length > 0 && (
          <div style={styles.redFlagCard}>
            <h3 style={styles.redFlagTitle}>⚠️ Priority Alerts Identified</h3>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem' }}>This is a priority alert for clinical staff, not a diagnosis.</p>
            <ul style={styles.redFlagList}>
              {redFlags.map((rf, idx) => (
                <li key={idx}><strong>{rf.symptom || rf.message}</strong> ({rf.severity || 'HIGH'} Priority)</li>
              ))}
            </ul>
          </div>
        )}

        {/* Structured Summary Cards */}
        <div style={styles.summaryBody}>
          {/* Patient Overview */}
          <div style={styles.sectionCard}>
            <h4 style={styles.sectionHeader}>👤 Patient Overview</h4>
            <p style={styles.detailRow}>
              <strong>Name:</strong> {overview.name} | <strong>Age:</strong> {overview.age || 'N/A'} | <strong>Gender:</strong> {overview.gender || 'N/A'}
            </p>
          </div>

          {/* Chief Complaint */}
          <div style={styles.sectionCard}>
            <h4 style={styles.sectionHeader}>🩺 Chief Complaint</h4>
            <p style={styles.detailRow}>{chief}</p>
          </div>

          {/* Medications */}
          <div style={styles.sectionCard}>
            <h4 style={styles.sectionHeader}>💊 Current Medications</h4>
            {meds.length > 0 ? (
              <ul style={styles.list}>
                {meds.map((m, idx) => (
                  <li key={idx} style={styles.listItem}>
                    <strong>{m.name}</strong> {m.dose && `(${m.dose})`} {m.frequency && `- ${m.frequency}`}
                    <span style={m.isDocumentExtracted ? styles.sourceBadgeDoc : styles.sourceBadgePatient}>
                      {m.isDocumentExtracted ? '📄 Extracted from Document' : '👤 Patient Reported'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={styles.mutedText}>No current medications reported.</p>
            )}
          </div>

          {/* Allergies */}
          <div style={styles.sectionCard}>
            <h4 style={styles.sectionHeader}>⚠️ Drug Allergies</h4>
            {allergies.length > 0 ? (
              <ul style={styles.list}>
                {allergies.map((a, idx) => (
                  <li key={idx} style={styles.listItem}>
                    <strong>{a.allergen}</strong> {a.reaction && `(${a.reaction})`}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={styles.mutedText}>
                {noAllergies ? '✓ No known drug allergies reported' : 'Drug allergies: Not assessed'}
              </p>
            )}
          </div>

          {/* AYUSH Assessment */}
          <div style={styles.sectionCard}>
            <h4 style={styles.sectionHeader}>🌿 AYUSH Dashavidha Pariksha</h4>
            <p style={styles.detailRow}>{ayushText}</p>
          </div>

          {/* Missing Info */}
          {missing.length > 0 && (
            <div style={styles.sectionCardMuted}>
              <h4 style={styles.sectionHeaderMuted}>📝 Missing / Unanswered Information</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#64748b' }}>
                {missing.map((item, idx) => (
                  <li key={idx} style={{ fontSize: '0.85rem' }}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {error && <div style={styles.errorText}>⚠️ {error}</div>}

        {/* Footer Actions */}
        <div style={styles.footerActions}>
          {onEditRequested && (
            <button onClick={onEditRequested} style={styles.editBtn}>
              ✏️ Correct Information
            </button>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            {onBack && (
              <button onClick={onBack} style={styles.cancelBtn}>
                Back
              </button>
            )}

            <button
              onClick={handleConfirm}
              disabled={submitting}
              style={styles.confirmBtn}
            >
              {submitting ? 'Submitting...' : 'Confirm & Send to Doctor ✓'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#f1f5f9',
    minHeight: '100vh'
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '30px',
    maxWidth: '850px',
    width: '100%',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  alertBanner: {
    display: 'flex',
    gap: '16px',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '12px',
    padding: '16px 20px',
    marginBottom: '20px'
  },
  alertIcon: {
    fontSize: '1.5rem'
  },
  alertTitle: {
    margin: '0 0 4px 0',
    color: '#1e40af',
    fontSize: '1.05rem',
    fontWeight: '700'
  },
  alertText: {
    margin: 0,
    color: '#1e3a8a',
    fontSize: '0.9rem',
    lineHeight: '1.4'
  },
  redFlagCard: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '16px 20px',
    marginBottom: '20px',
    color: '#991b1b'
  },
  redFlagTitle: {
    margin: '0 0 6px 0',
    fontSize: '1.1rem',
    fontWeight: '700'
  },
  redFlagList: {
    margin: 0,
    paddingLeft: '20px'
  },
  summaryBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px'
  },
  sectionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    padding: '16px 20px',
    border: '1px solid #e2e8f0'
  },
  sectionCardMuted: {
    backgroundColor: '#f1f5f9',
    borderRadius: '10px',
    padding: '16px 20px',
    border: '1px border #cbd5e1'
  },
  sectionHeader: {
    margin: '0 0 10px 0',
    color: '#0f172a',
    fontSize: '0.95rem',
    fontWeight: '700'
  },
  sectionHeaderMuted: {
    margin: '0 0 8px 0',
    color: '#475569',
    fontSize: '0.9rem',
    fontWeight: '700'
  },
  detailRow: {
    margin: 0,
    color: '#334155',
    fontSize: '0.95rem',
    lineHeight: '1.5'
  },
  list: {
    margin: 0,
    paddingLeft: '20px'
  },
  listItem: {
    color: '#334155',
    fontSize: '0.95rem',
    marginBottom: '6px'
  },
  sourceBadgePatient: {
    display: 'inline-block',
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    marginLeft: '10px',
    fontWeight: '600'
  },
  sourceBadgeDoc: {
    display: 'inline-block',
    backgroundColor: '#fef3c7',
    color: '#b45309',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    marginLeft: '10px',
    fontWeight: '600'
  },
  mutedText: {
    margin: 0,
    color: '#64748b',
    fontSize: '0.9rem',
    fontStyle: 'italic'
  },
  errorText: {
    color: '#dc2626',
    fontSize: '0.9rem',
    marginBottom: '16px'
  },
  footerActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0'
  },
  editBtn: {
    padding: '10px 18px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#334155',
    fontWeight: '600',
    cursor: 'pointer'
  },
  cancelBtn: {
    padding: '12px 20px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#475569',
    fontWeight: '600',
    cursor: 'pointer'
  },
  confirmBtn: {
    padding: '12px 28px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '0.95rem',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)'
  }
};

export default PatientSummaryReview;
