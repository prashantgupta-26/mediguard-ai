import React from 'react';
import PhysicianVerificationPanel from './PhysicianVerificationPanel';

const ClinicalSummaryView = ({ summary, onRefresh }) => {
  if (!summary) return null;

  const overview = summary.generatedSummary?.patientOverview || {
    name: summary.patientName || 'Patient',
    age: summary.patientAge || 'N/A',
    gender: summary.patientGender || 'N/A',
    language: summary.summaryLanguage || 'en'
  };

  const chief = summary.chiefComplaint || summary.generatedSummary?.chiefComplaint || { text: 'Not provided' };
  const hpi = summary.historyOfPresentIllness || summary.generatedSummary?.historyOfPresentIllness || {};
  const pastMedical = summary.pastMedicalHistory || summary.generatedSummary?.pastMedicalHistory || [];
  const pastSurgical = summary.pastSurgicalHistory || summary.generatedSummary?.pastSurgicalHistory || [];
  const medications = summary.currentMedications || summary.generatedSummary?.currentMedications || [];
  const allergies = summary.drugAllergies || summary.generatedSummary?.drugAllergies || [];
  const familyHistory = summary.familyHistory || summary.generatedSummary?.familyHistory || [];
  const personalHistory = summary.personalHistory || summary.generatedSummary?.personalHistory || {};
  const ros = summary.reviewOfSystems || summary.generatedSummary?.reviewOfSystems || {};
  const labInvestigations = summary.priorInvestigations || summary.generatedSummary?.previousInvestigations || [];
  const docFindings = summary.documentFindings || summary.generatedSummary?.documentFindings || [];
  const ayush = summary.ayushHistory || summary.generatedSummary?.ayushHistory || {};
  const redFlags = summary.redFlags || summary.generatedSummary?.redFlags || [];
  const missingInfo = summary.missingInformation || summary.generatedSummary?.missingInformation || [];
  const conflicts = summary.conflicts || summary.generatedSummary?.conflicts || [];

  return (
    <div style={styles.container}>
      {/* Top Header Card */}
      <div style={styles.headerCard}>
        <div style={styles.headerLeft}>
          <h2 style={styles.patientTitle}>📋 Clinical History Summary</h2>
          <p style={styles.patientMeta}>
            <strong>Patient Name:</strong> {overview.name} | <strong>Age/Gender:</strong> {overview.age} / {overview.gender} | <strong>Health ID:</strong> {summary.patientHealthId || 'N/A'}
          </p>
        </div>

        <div style={styles.headerRight}>
          {summary.physicianVerified ? (
            <span style={styles.badgeVerified}>✓ Physician Verified (v{summary.version})</span>
          ) : summary.patientConfirmed ? (
            <span style={styles.badgeConfirmed}>👤 Patient Confirmed (v{summary.version})</span>
          ) : (
            <span style={styles.badgeDraft}>⏳ Intake Summary Draft (v{summary.version})</span>
          )}
        </div>
      </div>

      {/* Priority Alert / Red Flags Section */}
      {redFlags.length > 0 && (
        <div style={styles.redFlagAlertBox}>
          <div style={styles.alertHeader}>
            <span style={{ fontSize: '1.4rem' }}>⚠️</span>
            <div>
              <h3 style={styles.alertTitleText}>ATTENTION REQUIRED — PRIORITY ALERTS</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#991b1b' }}>
                This is a priority alert for clinical staff based on reported symptoms, not a final medical diagnosis.
              </p>
            </div>
          </div>
          <ul style={{ margin: '10px 0 0 0', paddingLeft: '24px', color: '#7f1d1d' }}>
            {redFlags.map((rf, idx) => (
              <li key={idx} style={{ marginBottom: '4px', fontWeight: '600' }}>
                {rf.symptom || rf.message} ({rf.severity || 'HIGH'} Severity)
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Conflicts Banner */}
      {conflicts.length > 0 && (
        <div style={styles.conflictAlertBox}>
          <h4 style={{ margin: '0 0 6px 0', color: '#92400e', fontSize: '0.95rem' }}>
            ⚠️ Source Conflict Detected — Physician Review Required
          </h4>
          {conflicts.map((c, idx) => (
            <div key={idx} style={{ fontSize: '0.85rem', color: '#78350f', margin: '4px 0' }}>
              <strong>{c.field}:</strong> Patient reported <em>"{c.patientValue}"</em> vs Document extracted <em>"{c.documentValue}"</em>.
            </div>
          ))}
        </div>
      )}

      {/* Grid Layout of Clinical Sections */}
      <div style={styles.grid}>
        {/* Chief Complaint */}
        <div style={styles.card}>
          <h3 style={styles.cardHeader}>1. Chief Complaint</h3>
          <p style={styles.cardBodyText}>
            <strong>Complaint:</strong> {chief.text || chief} {chief.duration && `(${chief.duration})`}
          </p>
          <span style={styles.sourceTag}>Source: {chief.source || 'patient_reported'}</span>
        </div>

        {/* History of Present Illness (HPI) */}
        <div style={styles.card}>
          <h3 style={styles.cardHeader}>2. History of Present Illness (HPI)</h3>
          {hpi.rawText ? (
            <p style={styles.cardBodyText}>{hpi.rawText}</p>
          ) : (
            <ul style={styles.compactList}>
              {hpi.onset && <li><strong>Onset:</strong> {hpi.onset}</li>}
              {hpi.duration && <li><strong>Duration:</strong> {hpi.duration}</li>}
              {hpi.location && <li><strong>Location:</strong> {hpi.location}</li>}
              {hpi.severity && <li><strong>Severity:</strong> {hpi.severity}</li>}
              {hpi.associatedSymptoms?.length > 0 && <li><strong>Associated Symptoms:</strong> {hpi.associatedSymptoms.join(', ')}</li>}
            </ul>
          )}
        </div>

        {/* Past Medical & Surgical History */}
        <div style={styles.card}>
          <h3 style={styles.cardHeader}>3. Past Medical & Surgical History</h3>
          <div style={{ marginBottom: '10px' }}>
            <h4 style={styles.subHeader}>Medical Conditions:</h4>
            {pastMedical.length > 0 ? (
              <ul style={styles.compactList}>
                {pastMedical.map((m, idx) => (
                  <li key={idx}>
                    {m.value || m} <span style={styles.sourceTagInline}>{m.source || 'patient_reported'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span style={styles.muted}>No previous chronic medical conditions reported</span>
            )}
          </div>

          <div>
            <h4 style={styles.subHeader}>Past Surgeries:</h4>
            {pastSurgical.length > 0 ? (
              <ul style={styles.compactList}>
                {pastSurgical.map((s, idx) => (
                  <li key={idx}>
                    <strong>{s.procedure}</strong> {s.date && `(${s.date})`}
                  </li>
                ))}
              </ul>
            ) : (
              <span style={styles.muted}>Past surgical history: Not provided</span>
            )}
          </div>
        </div>

        {/* Current Medications */}
        <div style={styles.card}>
          <h3 style={styles.cardHeader}>4. Current Medications</h3>
          {medications.length > 0 ? (
            <ul style={styles.compactList}>
              {medications.map((m, idx) => (
                <li key={idx} style={{ marginBottom: '8px' }}>
                  <strong>{m.name}</strong> {m.dose && `(${m.dose})`} {m.frequency && `- ${m.frequency}`}
                  <div>
                    <span style={m.isDocumentExtracted ? styles.sourceBadgeDoc : styles.sourceBadgePatient}>
                      {m.isDocumentExtracted ? '📄 Extracted from Document' : '👤 Patient Reported'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <span style={styles.muted}>No current medications reported</span>
          )}
        </div>

        {/* Drug Allergies */}
        <div style={styles.card}>
          <h3 style={styles.cardHeader}>5. Drug Allergies</h3>
          {allergies.length > 0 ? (
            <ul style={styles.compactList}>
              {allergies.map((a, idx) => (
                <li key={idx}>
                  <strong>{a.allergen}</strong> {a.reaction && `- ${a.reaction}`} ({a.severity || 'severity unknown'})
                </li>
              ))}
            </ul>
          ) : (
            <p style={summary.noKnownAllergiesReported ? styles.successText : styles.muted}>
              {summary.noKnownAllergiesReported ? '✓ No known drug allergies reported' : 'Drug allergies: Not assessed'}
            </p>
          )}
        </div>

        {/* Family & Personal History */}
        <div style={styles.card}>
          <h3 style={styles.cardHeader}>6. Family & Personal History</h3>
          <div style={{ marginBottom: '10px' }}>
            <h4 style={styles.subHeader}>Family History:</h4>
            {familyHistory.length > 0 ? (
              <ul style={styles.compactList}>
                {familyHistory.map((f, idx) => (
                  <li key={idx}><strong>{f.condition}</strong> {f.relation && `(${f.relation})`}</li>
                ))}
              </ul>
            ) : (
              <span style={styles.muted}>Family history: Not provided</span>
            )}
          </div>

          <div>
            <h4 style={styles.subHeader}>Personal Lifestyle:</h4>
            <p style={styles.cardBodyText}>
              Diet: {personalHistory.diet || 'Not provided'} | Sleep: {personalHistory.sleep || 'Not provided'} | Tobacco/Alcohol: {personalHistory.smoking || personalHistory.tobacco || 'Not provided'}
            </p>
          </div>
        </div>

        {/* Previous Investigations & Document Findings */}
        <div style={styles.cardFullWidth}>
          <h3 style={styles.cardHeader}>7. Previous Lab Investigations & Processed Documents</h3>
          {labInvestigations.length > 0 ? (
            <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Test Name</th>
                    <th style={styles.th}>Result Value</th>
                    <th style={styles.th}>Unit</th>
                    <th style={styles.th}>Reference Range</th>
                    <th style={styles.th}>Flag Status</th>
                  </tr>
                </thead>
                <tbody>
                  {labInvestigations.map((lab, idx) => (
                    <tr key={idx} style={lab.isAbnormal ? styles.trAbnormal : {}}>
                      <td style={styles.td}><strong>{lab.testName}</strong></td>
                      <td style={styles.td}>{lab.resultValue}</td>
                      <td style={styles.td}>{lab.unit || '-'}</td>
                      <td style={styles.td}>{lab.referenceRange || '-'}</td>
                      <td style={styles.td}>
                        {lab.isAbnormal ? (
                          <span style={styles.abnormalBadge}>Outside Reference Range</span>
                        ) : (
                          <span style={styles.normalBadge}>Normal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={styles.disclaimerNote}>
                * Laboratory values outside standard reference ranges are displayed as extracted. MEDIGUARD AI does not perform autonomous diagnosis on lab results.
              </p>
            </div>
          ) : (
            <p style={styles.muted}>No previous laboratory test extractions recorded.</p>
          )}

          {docFindings.length > 0 && (
            <div>
              <h4 style={styles.subHeader}>Uploaded Medical Documents:</h4>
              <ul style={styles.compactList}>
                {docFindings.map((d, idx) => (
                  <li key={idx}>
                    📄 <strong>{d.fileName || d.documentType}</strong> — {d.summaryText}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* AYUSH Dashavidha Pariksha */}
        <div style={styles.cardFullWidth}>
          <h3 style={styles.cardHeader}>🌿 AYUSH Dashavidha Pariksha Assessment</h3>
          {ayush ? (
            <div style={styles.ayushGrid}>
              <div style={styles.ayushBox}><strong>Prakriti:</strong> {ayush.prakriti?.value || 'Not assessed'}</div>
              <div style={styles.ayushBox}><strong>Vikriti:</strong> {ayush.vikriti?.value || 'Not assessed'}</div>
              <div style={styles.ayushBox}><strong>Sara:</strong> {ayush.sara?.value || 'Not assessed'}</div>
              <div style={styles.ayushBox}><strong>Samhanana:</strong> {ayush.samhanana?.value || 'Not assessed'}</div>
              <div style={styles.ayushBox}><strong>Pramana:</strong> {ayush.pramana?.value || 'Not assessed'}</div>
              <div style={styles.ayushBox}><strong>Satmya:</strong> {ayush.satmya?.value || 'Not assessed'}</div>
              <div style={styles.ayushBox}><strong>Sattva:</strong> {ayush.sattva?.value || 'Not assessed'}</div>
              <div style={styles.ayushBox}><strong>Ahara Shakti:</strong> {ayush.aharaShakti?.value || 'Not assessed'}</div>
              <div style={styles.ayushBox}><strong>Vyayama Shakti:</strong> {ayush.vyayamaShakti?.value || 'Not assessed'}</div>
              <div style={styles.ayushBox}><strong>Vaya:</strong> {ayush.vaya?.value || 'Not assessed'}</div>
            </div>
          ) : (
            <span style={styles.muted}>AYUSH Dashavidha Pariksha: Not assessed</span>
          )}
        </div>

        {/* Missing Information Explicit Audit */}
        <div style={styles.cardFullWidth}>
          <h3 style={styles.cardHeader}>📝 Missing / Unassessed Information Audit</h3>
          {missingInfo.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#64748b' }}>
              {missingInfo.map((item, idx) => (
                <li key={idx} style={{ fontSize: '0.9rem', marginBottom: '4px' }}>{item}</li>
              ))}
            </ul>
          ) : (
            <span style={styles.successText}>✓ All standard clinical history domains answered</span>
          )}
        </div>
      </div>

      {/* Physician Verification & Notes Panel */}
      <PhysicianVerificationPanel summary={summary} onRefresh={onRefresh} />
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  headerCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    padding: '24px 30px',
    borderRadius: '16px',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
  },
  patientTitle: {
    margin: '0 0 6px 0',
    fontSize: '1.5rem',
    fontWeight: '800'
  },
  patientMeta: {
    margin: 0,
    color: '#94a3b8',
    fontSize: '0.95rem'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center'
  },
  badgeVerified: {
    backgroundColor: '#059669',
    color: '#ffffff',
    padding: '8px 16px',
    borderRadius: '20px',
    fontWeight: '700',
    fontSize: '0.85rem'
  },
  badgeConfirmed: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '8px 16px',
    borderRadius: '20px',
    fontWeight: '700',
    fontSize: '0.85rem'
  },
  badgeDraft: {
    backgroundColor: '#d97706',
    color: '#ffffff',
    padding: '8px 16px',
    borderRadius: '20px',
    fontWeight: '700',
    fontSize: '0.85rem'
  },
  redFlagAlertBox: {
    backgroundColor: '#fef2f2',
    border: '2px solid #ef4444',
    borderRadius: '12px',
    padding: '20px'
  },
  alertHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  alertTitleText: {
    margin: 0,
    color: '#991b1b',
    fontSize: '1.1rem',
    fontWeight: '800'
  },
  conflictAlertBox: {
    backgroundColor: '#fffbeb',
    border: '1px solid #f59e0b',
    borderRadius: '12px',
    padding: '16px 20px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
  },
  cardFullWidth: {
    gridColumn: '1 / -1',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
  },
  cardHeader: {
    margin: '0 0 14px 0',
    color: '#0f172a',
    fontSize: '1.05rem',
    fontWeight: '700',
    borderBottom: '2px solid #f1f5f9',
    paddingBottom: '8px'
  },
  subHeader: {
    margin: '0 0 6px 0',
    color: '#334155',
    fontSize: '0.9rem',
    fontWeight: '700'
  },
  cardBodyText: {
    margin: 0,
    color: '#334155',
    fontSize: '0.95rem',
    lineHeight: '1.5'
  },
  compactList: {
    margin: 0,
    paddingLeft: '20px',
    color: '#334155'
  },
  sourceTag: {
    display: 'inline-block',
    marginTop: '10px',
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    fontSize: '0.75rem',
    padding: '2px 8px',
    borderRadius: '4px'
  },
  sourceTagInline: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    fontSize: '0.75rem',
    padding: '2px 6px',
    borderRadius: '4px',
    marginLeft: '6px'
  },
  sourceBadgePatient: {
    display: 'inline-block',
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600'
  },
  sourceBadgeDoc: {
    display: 'inline-block',
    backgroundColor: '#fef3c7',
    color: '#b45309',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '8px'
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    backgroundColor: '#f8fafc',
    color: '#475569',
    fontSize: '0.85rem',
    borderBottom: '2px solid #e2e8f0'
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '0.9rem',
    color: '#334155'
  },
  trAbnormal: {
    backgroundColor: '#fef2f2'
  },
  abnormalBadge: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '700'
  },
  normalBadge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600'
  },
  disclaimerNote: {
    fontSize: '0.78rem',
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: '8px'
  },
  ayushGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px'
  },
  ayushBox: {
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    color: '#065f46',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '0.88rem'
  },
  muted: {
    color: '#64748b',
    fontStyle: 'italic',
    fontSize: '0.9rem'
  },
  successText: {
    color: '#15803d',
    fontWeight: '600',
    fontSize: '0.9rem'
  }
};

export default ClinicalSummaryView;
