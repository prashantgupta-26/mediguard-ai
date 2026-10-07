import React, { useState, useEffect } from 'react';
import { getIntegrationStatus } from '../services/interoperabilityService';

const IntegrationStatusDashboard = ({ clinicalSessionId, patientId }) => {
  const [statuses, setStatuses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatus();
  }, [clinicalSessionId, patientId]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await getIntegrationStatus(clinicalSessionId);
      if (res.success && res.statuses) {
        setStatuses(res.statuses);
      }
    } catch (err) {
      setError('Failed to fetch integration status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingCard}>
        <div style={styles.spinner}></div>
        <p style={{ margin: 0, color: '#64748b' }}>Checking Interoperability & Integration Status...</p>
      </div>
    );
  }

  if (!statuses) return null;

  return (
    <div style={styles.container}>
      <div style={styles.topHeader}>
        <h3 style={styles.title}>🔌 MEDIGUARD AI Interoperability & Integration Dashboard</h3>
        <button onClick={fetchStatus} style={styles.refreshBtn}>🔄 Refresh Status</button>
      </div>

      <div style={styles.grid}>
        {/* Card 1: MEDIGUARD AI Local Record */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span>📋 MEDIGUARD AI Record</span>
            <span style={statuses.localRecord.ready ? styles.badgeGreen : styles.badgeYellow}>
              {statuses.localRecord.status}
            </span>
          </div>
          <p style={styles.cardText}>Local structured clinical summary ready for export.</p>
        </div>

        {/* Card 2: FHIR R4 Bundle */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span>🔥 FHIR R4 Bundle</span>
            <span style={statuses.fhirBundle.ready ? styles.badgeGreen : styles.badgeYellow}>
              {statuses.fhirBundle.ready ? 'Generated' : 'Not Generated'}
            </span>
          </div>
          <p style={styles.cardText}>{statuses.fhirBundle.version}</p>
        </div>

        {/* Card 3: Patient Consent Audit */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span>🔒 Consent Audit</span>
            <span style={statuses.consent.granted ? styles.badgeGreen : styles.badgeRed}>
              {statuses.consent.granted ? 'Granted' : 'Revoked / Required'}
            </span>
          </div>
          <p style={styles.cardText}>
            Granular scopes: Intake ({statuses.consent.scope?.clinicalIntake ? '✓' : '✖'}), Docs ({statuses.consent.scope?.documentProcessing ? '✓' : '✖'}), HIS ({statuses.consent.scope?.hisSharing ? '✓' : '✖'}), ABDM ({statuses.consent.scope?.abdmSharing ? '✓' : '✖'})
          </p>
        </div>

        {/* Card 4: ABHA Identity */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span>🆔 ABHA Identity</span>
            <span style={statuses.abha.linked ? styles.badgeGreen : styles.badgeGray}>
              {statuses.abha.linked ? 'Linked' : 'Not Linked'}
            </span>
          </div>
          <p style={styles.cardText}>
            {statuses.abha.abhaNumber ? `ABHA: ${statuses.abha.abhaNumber}` : 'ABHA Number not linked.'}
          </p>
        </div>

        {/* Card 5: ABDM Ecosystem */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span>🌐 ABDM Ecosystem</span>
            <span style={statuses.abdm.connected ? styles.badgeGreen : styles.badgeGray}>
              {statuses.abdm.connected ? 'Connected' : 'Not Configured'}
            </span>
          </div>
          <p style={styles.cardText}>{statuses.abdm.message}</p>
        </div>

        {/* Card 6: Hospital HIS / EMR */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span>🏥 Hospital HIS / EMR</span>
            <span style={statuses.his.connected ? styles.badgeGreen : styles.badgeGray}>
              {statuses.his.connected ? 'Connected' : 'Not Configured'}
            </span>
          </div>
          <p style={styles.cardText}>{statuses.his.message}</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #cbd5e1',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    marginBottom: '20px'
  },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  title: {
    margin: 0,
    color: '#0f172a',
    fontSize: '1.15rem',
    fontWeight: '800'
  },
  refreshBtn: {
    padding: '6px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    color: '#334155',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '14px'
  },
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    padding: '14px 18px',
    border: '1px solid #e2e8f0'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '6px'
  },
  cardText: {
    margin: 0,
    fontSize: '0.82rem',
    color: '#64748b',
    lineHeight: '1.4'
  },
  badgeGreen: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '700'
  },
  badgeYellow: {
    backgroundColor: '#fef3c7',
    color: '#b45309',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '700'
  },
  badgeRed: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '700'
  },
  badgeGray: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600'
  },
  loadingCard: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '3px solid #cbd5e1',
    borderTop: '3px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
};

export default IntegrationStatusDashboard;
