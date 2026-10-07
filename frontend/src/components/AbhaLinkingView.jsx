import React, { useState } from 'react';
import { linkAbhaNumber } from '../services/interoperabilityService';

const AbhaLinkingView = ({ patient, onUpdated }) => {
  const [abhaInput, setAbhaInput] = useState(patient?.abhaNumber || '');
  const [linking, setLinking] = useState(false);
  const [resultMessage, setResultMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleLink = async () => {
    if (!abhaInput.trim()) return;
    try {
      setLinking(true);
      setError(null);
      setResultMessage(null);

      const res = await linkAbhaNumber({
        abhaNumber: abhaInput.trim(),
        patientId: patient?._id
      });

      if (res.status === 'not_configured') {
        setResultMessage({
          type: 'info',
          title: 'ABDM Unconfigured in Environment',
          text: res.message
        });
      } else if (res.success) {
        setResultMessage({
          type: 'success',
          title: 'ABHA Linked Successfully ✓',
          text: 'Your ABHA Number has been associated with your MediKiosk record.'
        });
        if (onUpdated) onUpdated();
      } else {
        setError(res.message || 'Linking failed');
      }
    } catch (err) {
      setError('Linking failed: ' + err.message);
    } finally {
      setLinking(false);
    }
  };

  const isLinked = patient?.abhaStatus === 'linked';

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.iconBox}>🆔</div>
        <div>
          <h3 style={styles.title}>ABHA / ABDM Identity Link</h3>
          <p style={styles.subtitle}>
            Link your 14-digit Ayushman Bharat Health Account (ABHA) number to connect your records with the national ABDM health network.
          </p>
        </div>
      </div>

      <div style={styles.statusRow}>
        <span>Current Status:</span>
        <span style={isLinked ? styles.badgeLinked : styles.badgeNotLinked}>
          {isLinked ? '✓ ABHA Linked' : 'Not Linked'}
        </span>
      </div>

      <div style={styles.inputRow}>
        <input
          type="text"
          value={abhaInput}
          onChange={(e) => setAbhaInput(e.target.value)}
          placeholder="e.g. 14-1234-5678-9012"
          style={styles.input}
        />
        <button
          onClick={handleLink}
          disabled={linking || !abhaInput.trim()}
          style={styles.linkBtn}
        >
          {linking ? 'Verifying...' : 'Link ABHA Number'}
        </button>
      </div>

      {resultMessage && (
        <div style={resultMessage.type === 'success' ? styles.resultSuccess : styles.resultInfo}>
          <strong>{resultMessage.title}:</strong> {resultMessage.text}
        </div>
      )}

      {error && <div style={styles.errorBox}>⚠️ {error}</div>}

      <p style={styles.disclaimer}>
        * MediKiosk Patient ID (<strong style={{ fontFamily: 'monospace' }}>{patient?.healthId || 'MK-XXXXXXXX'}</strong>) remains your primary internal identifier. ABDM linking is optional and depends on environment configuration.
      </p>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    padding: '24px',
    border: '1px solid #cbd5e1',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    marginBottom: '20px'
  },
  header: {
    display: 'flex',
    gap: '14px',
    alignItems: 'center',
    marginBottom: '16px'
  },
  iconBox: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem'
  },
  title: {
    margin: '0 0 2px 0',
    color: '#0f172a',
    fontSize: '1.1rem',
    fontWeight: '700'
  },
  subtitle: {
    margin: 0,
    color: '#475569',
    fontSize: '0.85rem'
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '14px',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#334155'
  },
  badgeLinked: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: '700'
  },
  badgeNotLinked: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: '600'
  },
  inputRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '16px'
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.95rem',
    fontFamily: 'monospace'
  },
  linkBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontWeight: '700',
    cursor: 'pointer'
  },
  resultSuccess: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '0.88rem',
    marginBottom: '14px'
  },
  resultInfo: {
    backgroundColor: '#eff6ff',
    color: '#1e40af',
    border: '1px solid #bfdbfe',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '0.88rem',
    marginBottom: '14px'
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '0.88rem',
    marginBottom: '14px'
  },
  disclaimer: {
    margin: 0,
    fontSize: '0.78rem',
    color: '#64748b',
    fontStyle: 'italic'
  }
};

export default AbhaLinkingView;
