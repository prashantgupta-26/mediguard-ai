import React, { useState, useEffect } from 'react';
import { generateFhirBundle, shareWithHis, shareWithAbdm } from '../services/interoperabilityService';

const ExternalSharingModal = ({ clinicalSessionId, clinicalSummaryId, targetSystem = 'HIS', onClose }) => {
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [fhirBundle, setFhirBundle] = useState(null);
  const [validation, setValidation] = useState(null);
  const [resultMessage, setResultMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBundle();
  }, [clinicalSessionId, clinicalSummaryId]);

  const fetchBundle = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await generateFhirBundle({ clinicalSessionId, clinicalSummaryId });
      if (res.success && res.bundle) {
        setFhirBundle(res.bundle);
        setValidation(res.validation);
      }
    } catch (err) {
      setError('Failed to generate FHIR Bundle: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      setSharing(true);
      setResultMessage(null);
      setError(null);

      let res;
      if (targetSystem === 'ABDM') {
        res = await shareWithAbdm({ clinicalSessionId, clinicalSummaryId });
      } else {
        res = await shareWithHis({ clinicalSessionId, clinicalSummaryId });
      }

      if (res.status === 'consent_required') {
        setError('Patient consent required. Please grant consent before sharing.');
      } else if (res.status === 'not_configured') {
        setResultMessage({
          type: 'info',
          title: 'Payload Prepared (Integration Unconfigured)',
          text: res.message
        });
      } else if (res.success || res.status === 'shared_successfully') {
        setResultMessage({
          type: 'success',
          title: 'Shared Successfully ✓',
          text: res.message
        });
      } else {
        setResultMessage({
          type: 'warning',
          title: 'Sharing Failed',
          text: res.message
        });
      }
    } catch (err) {
      setError('Sharing failed: ' + err.message);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <h3 style={styles.title}>
            🏥 Share Clinical Summary ({targetSystem === 'ABDM' ? 'ABDM Repository' : 'Hospital HIS / EMR'})
          </h3>
          <button onClick={onClose} style={styles.closeBtn}>✖</button>
        </div>

        {/* Warning Banner */}
        <div style={styles.warningBanner}>
          <span style={{ fontSize: '1.4rem' }}>⚠️</span>
          <div>
            <h4 style={styles.warningTitle}>External Sharing Confirmation</h4>
            <p style={styles.warningText}>
              You are about to share your structured clinical history and medical documents with {targetSystem === 'ABDM' ? 'ABDM Health Network' : 'the Hospital HIS / Doctor EMR System'}.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={styles.loadingBox}>
            <div style={styles.spinner}></div>
            <p>Generating FHIR R4 Standard Payload...</p>
          </div>
        ) : error ? (
          <div style={styles.errorBox}>⚠️ {error}</div>
        ) : (
          <div>
            {/* Validation Badge */}
            {validation && (
              <div style={validation.isValid ? styles.validBox : styles.warningBox}>
                <span>{validation.isValid ? '✓ FHIR R4 Bundle Validated' : '⚠️ Bundle Validation Warnings'}</span>
                <span style={styles.resourceCount}>{validation.resourceCount} FHIR Resources</span>
              </div>
            )}

            {/* FHIR Payload Preview */}
            <div style={styles.previewBox}>
              <h4 style={styles.previewHeader}>📄 FHIR R4 JSON Bundle Payload Preview</h4>
              <pre style={styles.codeText}>
                {JSON.stringify(fhirBundle, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {resultMessage && (
          <div style={resultMessage.type === 'success' ? styles.resultSuccess : styles.resultInfo}>
            <h4 style={{ margin: '0 0 4px 0' }}>{resultMessage.title}</h4>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>{resultMessage.text}</p>
          </div>
        )}

        {/* Actions */}
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
          <button
            onClick={handleShare}
            disabled={sharing || loading || !fhirBundle}
            style={styles.shareBtn}
          >
            {sharing ? 'Transmitting FHIR Payload...' : `Authorize & Share to ${targetSystem} →`}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '28px',
    maxWidth: '800px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    border: '1px solid #cbd5e1'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  title: {
    margin: 0,
    color: '#0f172a',
    fontSize: '1.25rem',
    fontWeight: '800'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    color: '#64748b'
  },
  warningBanner: {
    display: 'flex',
    gap: '14px',
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '12px',
    padding: '14px 18px',
    marginBottom: '20px'
  },
  warningTitle: {
    margin: '0 0 2px 0',
    color: '#92400e',
    fontSize: '0.95rem',
    fontWeight: '700'
  },
  warningText: {
    margin: 0,
    color: '#78350f',
    fontSize: '0.85rem'
  },
  loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px',
    color: '#64748b'
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '4px solid #cbd5e1',
    borderTop: '4px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '12px'
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: '14px 18px',
    borderRadius: '10px',
    marginBottom: '16px'
  },
  validBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '0.88rem',
    fontWeight: '700',
    marginBottom: '14px'
  },
  warningBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    color: '#b45309',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '0.88rem',
    fontWeight: '700',
    marginBottom: '14px'
  },
  resourceCount: {
    backgroundColor: '#ffffff',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '0.78rem'
  },
  previewBox: {
    backgroundColor: '#0f172a',
    color: '#38bdf8',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '20px'
  },
  previewHeader: {
    margin: '0 0 8px 0',
    color: '#94a3b8',
    fontSize: '0.85rem',
    fontWeight: '600'
  },
  codeText: {
    margin: 0,
    maxHeight: '220px',
    overflowY: 'auto',
    fontFamily: 'Consolas, monospace',
    fontSize: '0.82rem',
    color: '#e2e8f0',
    whiteSpace: 'pre-wrap'
  },
  resultSuccess: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    padding: '14px 18px',
    borderRadius: '10px',
    marginBottom: '16px'
  },
  resultInfo: {
    backgroundColor: '#eff6ff',
    color: '#1e40af',
    padding: '14px 18px',
    borderRadius: '10px',
    marginBottom: '16px',
    border: '1px solid #bfdbfe'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0'
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
  shareBtn: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '0.95rem',
    cursor: 'pointer'
  }
};

export default ExternalSharingModal;
