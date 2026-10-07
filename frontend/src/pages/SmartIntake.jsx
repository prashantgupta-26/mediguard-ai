import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest, API_BASE_URL } from '../services/api';

export default function SmartIntake({ user }) {
  const [intakeData, setIntakeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchSmartIntake();
  }, [user?.id]);

  const fetchSmartIntake = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiRequest('/patient/smart-intake', 'GET');
      if (data.success && data.intake) {
        setIntakeData(data.intake);
        setNotes(data.intake.patientNotes || '');
      } else {
        setError('Unable to prepare Smart Patient Intake.');
      }
    } catch (err) {
      console.error('Error fetching smart intake:', err);
      setError(err.message || 'Unable to prepare Smart Patient Intake.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      const data = await apiRequest('/patient/smart-intake/notes', 'PUT', { patientNotes: notes });
      if (data.success) {
        setToastMessage('✓ Notes saved successfully.');
        setTimeout(() => setToastMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error saving patient notes:', err);
      alert('Failed to save notes: ' + (err.message || 'Server error'));
    } finally {
      setSavingNotes(false);
    }
  };

  const handleViewReport = (docId) => {
    const token = localStorage.getItem('medikiosk_token');
    window.open(`${API_BASE_URL}/patient/records/${docId}/view?token=${token}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const renderValue = (val) => {
    if (!val || val === 'null' || val === 'undefined') {
      return <span class="text-on-surface-variant/60 italic font-body-sm text-body-sm">Not provided</span>;
    }
    return <span class="font-body-sm text-body-sm text-on-surface font-medium">{val}</span>;
  };

  if (loading) {
    return (
      <div class="min-h-screen bg-surface flex items-center justify-center pt-20">
        <div class="flex flex-col items-center gap-space-md">
          <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p class="font-body-md text-on-surface-variant">Preparing your Smart Patient Intake...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div class="min-h-screen bg-surface flex items-center justify-center pt-24 pb-16 px-space-md">
        <div class="max-w-md w-full bg-error-container/20 p-space-xl rounded-xl border border-error/30 flex flex-col items-center text-center gap-space-md">
          <span class="material-symbols-outlined text-error text-[48px]">warning</span>
          <h2 class="font-title-lg text-title-lg text-error font-semibold">{error}</h2>
          <button
            onClick={fetchSmartIntake}
            class="px-space-lg py-space-xs bg-error text-on-error font-label-lg text-label-lg rounded-lg shadow-sm hover:opacity-90 transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const {
    patient,
    healthProfile,
    records,
    recentRecords = [],
    recentTests = [],
    medicinesMentioned = [],
    documentedConditions = [],
    observations = []
  } = intakeData || {};

  return (
    <main class="w-full pt-24 bg-surface min-h-screen pb-16 print:pt-0 print:pb-0 print:bg-white">
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          header, nav, button:not(.print-keep), .no-print {
            display: none !important;
          }
          body, main {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-card {
            border: 1px solid #ccc !important;
            box-shadow: none !important;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Toast Feedback */}
      {toastMessage && (
        <div class="fixed top-24 right-6 z-50 flex items-center gap-space-sm bg-inverse-surface text-inverse-on-surface px-space-md py-space-sm rounded-xl shadow-xl animate-bounce no-print">
          <span class="material-symbols-outlined text-tertiary text-[20px]">check_circle</span>
          <span class="font-label-md text-label-md">{toastMessage}</span>
        </div>
      )}

      <div class="max-w-5xl mx-auto w-full px-space-md lg:px-space-xl py-space-md flex flex-col gap-space-xl">
        
        {/* Navigation Back Link */}
        <div class="flex items-center justify-between no-print">
          <Link
            to="/dashboard"
            class="inline-flex items-center gap-space-xs text-primary font-label-md text-label-md hover:underline cursor-pointer"
          >
            <span class="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Back to Dashboard</span>
          </Link>

          <button
            onClick={handlePrint}
            class="px-space-md py-space-xs bg-primary text-on-primary font-label-md text-label-md rounded-lg shadow-sm hover:bg-primary-container transition-colors flex items-center gap-space-xs cursor-pointer"
          >
            <span class="material-symbols-outlined text-[18px]">print</span>
            <span>Print Intake Sheet</span>
          </button>
        </div>

        {/* Header Title Section */}
        <div class="flex flex-col gap-space-2xs">
          <div class="flex items-center gap-space-xs text-primary font-label-md text-label-md">
            <span class="material-symbols-outlined text-[20px]">shield</span>
            <span class="tracking-wide uppercase font-label-sm text-label-sm font-semibold">MEDIGUARD AI • Smart Intake System</span>
          </div>
          <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            MEDIGUARD AI SMART INTAKE
          </h1>
          <p class="font-body-md text-body-md text-on-surface-variant">
            Smart Medication Safety System — Clinical Intake & Prescription Intelligence (Powered by MediKiosk)
          </p>
        </div>

        {/* Overview Header Card */}
        <section class="bg-gradient-to-r from-primary-container/40 via-surface-container-lowest to-primary-container/20 p-space-lg rounded-xl border border-primary/20 shadow-sm print-card flex flex-col md:flex-row items-start md:items-center justify-between gap-space-lg">
          <div class="flex flex-col gap-space-xs">
            <div class="flex items-center gap-space-sm">
              <h2 class="font-title-lg text-title-lg text-on-surface font-bold">
                INTAKE OVERVIEW
              </h2>
              <span class="px-space-xs py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-bold flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px]">check_circle</span> Ready for Intake
              </span>
            </div>
            <p class="font-body-sm text-body-sm text-on-surface-variant">
              Patient: <strong class="text-on-surface font-bold">{patient?.name}</strong> • Health ID: <strong class="font-mono text-primary font-bold">{patient?.healthId}</strong>
            </p>
          </div>

          <div class="flex items-center gap-space-md border-t md:border-t-0 md:border-l border-surface-container pt-space-xs md:pt-0 md:pl-space-md">
            <div class="flex flex-col text-center">
              <span class="font-headline-sm text-headline-sm font-bold text-primary">{records?.total || 0}</span>
              <span class="font-label-xs text-label-xs text-on-surface-variant uppercase">Total Records</span>
            </div>
            <div class="w-px h-8 bg-surface-container"></div>
            <div class="flex flex-col text-center">
              <span class="font-headline-sm text-headline-sm font-bold text-tertiary">{records?.analyzed || 0}</span>
              <span class="font-label-xs text-label-xs text-on-surface-variant uppercase">Analyzed</span>
            </div>
            <div class="w-px h-8 bg-surface-container"></div>
            <div class="flex flex-col text-center">
              <span class="font-label-md text-label-md font-bold text-on-surface">{records?.latestDate || 'N/A'}</span>
              <span class="font-label-xs text-label-xs text-on-surface-variant uppercase">Latest Record</span>
            </div>
          </div>
        </section>

        {/* Section 1 & Section 2: Grid Layout */}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
          {/* SECTION 1: PATIENT INFORMATION */}
          <section class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container print-card flex flex-col gap-space-md">
            <div class="flex items-center gap-space-xs border-b border-surface-container pb-space-xs text-primary">
              <span class="material-symbols-outlined text-[22px]">person</span>
              <h3 class="font-title-md text-title-md text-on-surface font-bold uppercase">SECTION 1 — PATIENT INFORMATION</h3>
            </div>

            <div class="flex flex-col gap-space-xs">
              <div class="flex justify-between items-center py-1">
                <span class="font-label-sm text-label-sm text-on-surface-variant">Name</span>
                <span class="font-title-sm text-title-sm text-on-surface font-bold">{patient?.name || 'N/A'}</span>
              </div>
              <div class="flex justify-between items-center py-1 border-t border-surface-container-low">
                <span class="font-label-sm text-label-sm text-on-surface-variant">Date of Birth</span>
                <span class="font-body-sm text-body-sm text-on-surface font-medium">{patient?.dateOfBirth || 'N/A'}</span>
              </div>
              <div class="flex justify-between items-center py-1 border-t border-surface-container-low">
                <span class="font-label-sm text-label-sm text-on-surface-variant">Gender</span>
                <span class="font-body-sm text-body-sm text-on-surface font-medium">{patient?.gender || 'N/A'}</span>
              </div>
              <div class="flex justify-between items-center py-1 border-t border-surface-container-low">
                <span class="font-label-sm text-label-sm text-on-surface-variant">Email</span>
                <span class="font-body-sm text-body-sm text-on-surface font-medium">{patient?.email || 'N/A'}</span>
              </div>
              <div class="flex justify-between items-center py-1 border-t border-surface-container-low">
                <span class="font-label-sm text-label-sm text-on-surface-variant">Health ID</span>
                <span class="font-mono text-label-md font-bold text-primary">{patient?.healthId || 'N/A'}</span>
              </div>
            </div>
          </section>

          {/* SECTION 2: HEALTH PROFILE */}
          <section class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container print-card flex flex-col gap-space-md">
            <div class="flex items-center gap-space-xs border-b border-surface-container pb-space-xs text-secondary">
              <span class="material-symbols-outlined text-[22px]">fitness_center</span>
              <h3 class="font-title-md text-title-md text-on-surface font-bold uppercase">SECTION 2 — HEALTH PROFILE</h3>
            </div>

            <div class="flex flex-col gap-space-xs">
              <div class="flex justify-between items-center py-1">
                <span class="font-label-sm text-label-sm text-on-surface-variant">Blood Group</span>
                {renderValue(healthProfile?.bloodGroup)}
              </div>
              <div class="flex justify-between items-center py-1 border-t border-surface-container-low">
                <span class="font-label-sm text-label-sm text-on-surface-variant">Height</span>
                {renderValue(healthProfile?.height)}
              </div>
              <div class="flex justify-between items-center py-1 border-t border-surface-container-low">
                <span class="font-label-sm text-label-sm text-on-surface-variant">Weight</span>
                {renderValue(healthProfile?.weight)}
              </div>
              <div class="flex justify-between items-center py-1 border-t border-surface-container-low">
                <span class="font-label-sm text-label-sm text-on-surface-variant">Allergies</span>
                {renderValue(healthProfile?.allergies)}
              </div>
              <div class="flex justify-between items-center py-1 border-t border-surface-container-low">
                <span class="font-label-sm text-label-sm text-on-surface-variant">Existing Conditions</span>
                {renderValue(healthProfile?.existingConditions)}
              </div>
              <div class="flex justify-between items-center py-1 border-t border-surface-container-low">
                <span class="font-label-sm text-label-sm text-on-surface-variant">Current Medications</span>
                {renderValue(healthProfile?.currentMedications)}
              </div>
            </div>
          </section>
        </div>

        {/* SECTION 3: RECENT MEDICAL RECORDS */}
        <section class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container print-card flex flex-col gap-space-md">
          <div class="flex items-center justify-between border-b border-surface-container pb-space-xs">
            <div class="flex items-center gap-space-xs text-tertiary">
              <span class="material-symbols-outlined text-[22px]">folder</span>
              <h3 class="font-title-md text-title-md text-on-surface font-bold uppercase">SECTION 3 — RECENT MEDICAL RECORDS</h3>
            </div>
            <Link
              to="/dashboard"
              class="font-label-sm text-label-sm text-primary font-semibold hover:underline no-print"
            >
              View All Health Records →
            </Link>
          </div>

          {recentRecords.length === 0 ? (
            <p class="font-body-sm text-body-sm text-on-surface-variant italic">No recent medical records available.</p>
          ) : (
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-space-md">
              {recentRecords.map((rec) => (
                <div key={rec.documentId} class="p-space-md rounded-lg bg-surface-container-low border border-surface-container flex flex-col justify-between gap-space-sm">
                  <div class="flex flex-col gap-space-2xs">
                    <div class="flex items-center gap-space-xs text-primary font-semibold">
                      <span class="material-symbols-outlined text-[18px]">
                        {rec.fileType?.includes('pdf') ? 'description' : 'image'}
                      </span>
                      <span class="font-title-sm text-title-sm text-on-surface font-bold">{rec.documentType}</span>
                    </div>
                    <span class="font-label-xs text-label-xs text-on-surface-variant font-mono">{rec.originalFileName}</span>
                    <span class="font-label-xs text-label-xs text-primary font-semibold">Date: {rec.reportDate}</span>
                  </div>

                  <button
                    onClick={() => handleViewReport(rec.documentId)}
                    class="h-8 px-space-sm bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm rounded flex items-center justify-center gap-1 transition-colors cursor-pointer w-full no-print"
                  >
                    <span class="material-symbols-outlined text-[16px]">visibility</span>
                    <span>View Report</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 4: RECENT TEST RESULTS */}
        <section class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container print-card flex flex-col gap-space-md">
          <div class="flex items-center gap-space-xs border-b border-surface-container pb-space-xs text-primary">
            <span class="material-symbols-outlined text-[22px]">science</span>
            <h3 class="font-title-md text-title-md text-on-surface font-bold uppercase">SECTION 4 — RECENT TEST RESULTS</h3>
          </div>

          {recentTests.length === 0 ? (
            <p class="font-body-sm text-body-sm text-on-surface-variant italic">No extracted test results available from analyzed records.</p>
          ) : (
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-space-md">
              {recentTests.map((test, idx) => (
                <div key={idx} class="p-space-md rounded-lg bg-surface-container-low border border-surface-container flex flex-col gap-space-2xs">
                  <span class="font-title-sm text-title-sm text-on-surface font-bold">{test.name}</span>
                  <div class="flex items-baseline gap-space-2xs">
                    <span class="font-headline-sm text-headline-sm font-bold text-primary">{test.value}</span>
                    {test.unit && <span class="font-label-sm text-label-sm text-on-surface-variant">{test.unit}</span>}
                  </div>
                  <div class="flex justify-between items-center text-on-surface-variant font-label-xs text-label-xs border-t border-surface-container pt-space-2xs mt-space-2xs">
                    <span>Report Date: {test.reportDate}</span>
                    <span class="font-mono text-primary font-semibold truncate max-w-[120px]" title={test.sourceDocument}>
                      {test.sourceDocument}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 5: MEDICINES MENTIONED IN RECORDS */}
        <section class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container print-card flex flex-col gap-space-md">
          <div class="flex flex-col gap-space-2xs border-b border-surface-container pb-space-xs">
            <div class="flex items-center gap-space-xs text-secondary">
              <span class="material-symbols-outlined text-[22px]">medication</span>
              <h3 class="font-title-md text-title-md text-on-surface font-bold uppercase">SECTION 5 — MEDICINES MENTIONED IN RECORDS</h3>
            </div>
            <span class="font-label-xs text-label-xs text-on-surface-variant italic">
              "Previously mentioned in uploaded records. Not an active prescription or recommendation."
            </span>
          </div>

          {medicinesMentioned.length === 0 ? (
            <p class="font-body-sm text-body-sm text-on-surface-variant italic">No medicines mentioned in uploaded documents.</p>
          ) : (
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              {medicinesMentioned.map((med, idx) => (
                <div key={idx} class="p-space-md rounded-lg bg-surface-container-low border border-surface-container flex flex-col gap-space-2xs">
                  <div class="flex items-center justify-between">
                    <span class="font-title-md text-title-md text-on-surface font-bold">{med.name}</span>
                    {med.dosage && <span class="font-label-sm text-label-sm px-2 py-0.5 rounded bg-secondary-container/30 text-secondary font-semibold">{med.dosage}</span>}
                  </div>
                  <div class="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
                    {med.frequency && <span>Frequency: {med.frequency}</span>}
                    {med.duration && <span>• Duration: {med.duration}</span>}
                  </div>
                  <span class="font-label-xs text-label-xs text-on-surface-variant/80 border-t border-surface-container pt-1 mt-1 font-mono">
                    Source: {med.sourceDocument}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 6: DOCUMENTED CONDITIONS */}
        <section class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container print-card flex flex-col gap-space-md">
          <div class="flex items-center gap-space-xs border-b border-surface-container pb-space-xs text-tertiary">
            <span class="material-symbols-outlined text-[22px]">clinical_notes</span>
            <h3 class="font-title-md text-title-md text-on-surface font-bold uppercase">SECTION 6 — DOCUMENTED CONDITIONS</h3>
          </div>

          {documentedConditions.length === 0 ? (
            <p class="font-body-sm text-body-sm text-on-surface-variant italic">No documented conditions available from analyzed records.</p>
          ) : (
            <div class="flex flex-col gap-space-xs">
              {documentedConditions.map((cond, idx) => (
                <div key={idx} class="p-space-md rounded-lg bg-surface-container-low border border-surface-container flex items-center justify-between gap-space-md">
                  <div class="flex items-center gap-space-xs text-on-surface">
                    <span class="material-symbols-outlined text-tertiary text-[20px]">check_box</span>
                    <span class="font-body-md text-body-md font-semibold">{cond.condition}</span>
                  </div>
                  <span class="font-label-xs text-label-xs text-on-surface-variant font-mono">Source: {cond.sourceDocument}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 7: RECENT DOCUMENT OBSERVATIONS */}
        <section class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container print-card flex flex-col gap-space-md">
          <div class="flex items-center gap-space-xs border-b border-surface-container pb-space-xs text-on-surface">
            <span class="material-symbols-outlined text-[22px]">visibility</span>
            <h3 class="font-title-md text-title-md text-on-surface font-bold uppercase">SECTION 7 — RECENT DOCUMENT OBSERVATIONS</h3>
          </div>

          {observations.length === 0 ? (
            <p class="font-body-sm text-body-sm text-on-surface-variant italic">No clinician observations extracted from uploaded records.</p>
          ) : (
            <ul class="space-y-space-xs">
              {observations.map((obs, idx) => (
                <li key={idx} class="p-space-md rounded-lg bg-surface-container-low border border-surface-container flex items-start justify-between gap-space-md">
                  <div class="flex items-start gap-space-xs text-on-surface">
                    <span class="material-symbols-outlined text-primary text-[18px] mt-0.5">find_in_page</span>
                    <span class="font-body-sm text-body-sm">{obs.observation}</span>
                  </div>
                  <span class="font-label-xs text-label-xs text-on-surface-variant font-mono shrink-0">Source: {obs.sourceDocument}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* SECTION 8: PATIENT-REPORTED NOTES */}
        <section class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container print-card flex flex-col gap-space-md">
          <div class="flex items-center gap-space-xs border-b border-surface-container pb-space-xs text-primary">
            <span class="material-symbols-outlined text-[22px]">edit_note</span>
            <h3 class="font-title-md text-title-md text-on-surface font-bold uppercase">SECTION 8 — PATIENT NOTES</h3>
          </div>

          <div class="flex flex-col gap-space-xs">
            <p class="font-body-sm text-body-sm text-on-surface-variant">
              Add any symptoms, questions, or details you want to mention to the healthcare staff during consultation.
            </p>
            <textarea
              rows="4"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add anything you want the healthcare staff to know..."
              class="w-full p-space-md bg-surface-container-low border border-surface-container rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary transition-colors"
            ></textarea>
            <div class="flex justify-end pt-space-xs no-print">
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                class="px-space-lg py-space-xs bg-primary text-on-primary font-label-lg text-label-lg rounded-lg shadow-sm hover:bg-primary-container transition-colors flex items-center gap-space-xs cursor-pointer disabled:opacity-50"
              >
                {savingNotes ? (
                  <>
                    <div class="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span class="material-symbols-outlined text-[18px]">save</span>
                    <span>Save Patient Notes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
