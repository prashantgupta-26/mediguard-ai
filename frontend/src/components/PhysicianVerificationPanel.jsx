import React, { useState } from 'react';
import { verifyPhysicianSummary } from '../services/clinicalSummaryService';

const PhysicianVerificationPanel = ({ summary, onRefresh }) => {
  const [physicianNotes, setPhysicianNotes] = useState(summary.physicianNotes || '');
  const [physicianName, setPhysicianName] = useState(summary.verifiedByPhysicianName || 'Dr. Attending Physician');
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleVerify = async () => {
    try {
      setVerifying(true);
      setError(null);
      setMessage(null);

      const res = await verifyPhysicianSummary(summary._id || summary.clinicalSessionId, {
        physicianNotes,
        physicianName
      });

      if (res.success) {
        setMessage('Summary marked as Physician Verified ✓');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      setError('Verification failed: ' + err.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.header}>🩺 Physician Verification & Clinical Audit Panel</h3>
      <p style={styles.subtext}>
        As an attending physician, review the multi-source intake summary above. Add clinical notes and sign off to mark as verified.
      </p>

      {/* Physician Name & Notes Form */}
      <div style={styles.formGroup}>
        <label style={styles.label}>Physician Name / Signature:</label>
        <input
          type="text"
          value={physicianName}
          onChange={(e) => setPhysicianName(e.target.value)}
          placeholder="e.g. Dr. A. Sharma (MBBS, MD)"
          style={styles.input}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Physician Clinical Notes & Observations:</label>
        <textarea
          rows={4}
          value={physicianNotes}
          onChange={(e) => setPhysicianNotes(e.target.value)}
          placeholder="Enter clinical observations, verified diagnoses, or follow-up recommendations..."
          style={styles.textarea}
        />
      </div>

      {message && <div style={styles.successBanner}>✓ {message}</div>}
      {error && <div style={styles.errorBanner}>⚠️ {error}</div>}

      {/* Versioning & Audit Meta */}
      <div style={styles.footerRow}>
        <div style={styles.auditMeta}>
          <span><strong>Summary Version:</strong> v{summary.version || 1}</span>
          <span><strong>Status:</strong> {summary.status?.toUpperCase() || 'DRAFT'}</span>
          {summary.physicianVerifiedAt && (
            <span><strong>Verified At:</strong> {new Date(summary.physicianVerifiedAt).toLocaleString()}</span>
          )}
        </div>

        <button
          onClick={handleVerify}
          disabled={verifying}
          style={{
            ...styles.verifyBtn,
            backgroundColor: summary.physicianVerified ? '#059669' : '#2563eb'
          }}
        >
          {verifying
            ? 'Processing Verification...'
            : summary.physicianVerified
            ? 'Update Verification & Notes ✓'
            : 'Mark as Physician Verified ✓'}
        </button>
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    border: '2px solid #2563eb',
    boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.1)',
    marginTop: '10px'
  },
  header: {
    margin: '0 0 6px 0',
    color: '#1e3a8a',
    fontSize: '1.2rem',
    fontWeight: '700'
  },
  subtext: {
    margin: '0 0 20px 0',
    color: '#475569',
    fontSize: '0.9rem'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px'
  },
  label: {
    color: '#1e293b',
    fontWeight: '600',
    fontSize: '0.9rem'
  },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.95rem',
    outline: 'none'
  },
  textarea: {
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.95rem',
    outline: 'none',
    fontFamily: 'inherit'
  },
  successBanner: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '600',
    marginBottom: '16px'
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '0.9rem',
    marginBottom: '16px'
  },
  footerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0'
  },
  auditMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '0.85rem',
    color: '#64748b'
  },
  verifyBtn: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '0.95rem',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
  }
};

export default PhysicianVerificationPanel;
