import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api';

export default function DoctorSummary({ user }) {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // AI Summary generation state
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiSummary, setAiSummary] = useState(null);

  useEffect(() => {
    fetchDoctorSummary();
  }, [user]);

  const fetchDoctorSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiRequest('/patient/doctor-summary', 'GET');
      if (data.success && data.summary) {
        setSummaryData(data.summary);
        if (data.summary.aiClinicalSummary) {
          setAiSummary(data.summary.aiClinicalSummary);
        }
      } else {
        setError('Unable to load doctor clinical summary.');
      }
    } catch (err) {
      console.error('Error fetching doctor summary:', err);
      setError(err.message || 'Failed to retrieve clinical summary records.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAiSummary = async () => {
    try {
      setGeneratingAi(true);
      setAiError('');
      const data = await apiRequest('/patient/doctor-summary/generate', 'POST');
      if (data.success && data.summary) {
        setAiSummary(data.summary);
      } else {
        setAiError(data.error || 'Failed to generate AI clinical summary.');
      }
    } catch (err) {
      console.error('Error generating AI clinical summary:', err);
      setAiError(err.message || 'Error communicating with clinical reasoning engine.');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <main className="w-full pt-28 pb-16 bg-surface min-h-screen">
        <div className="max-w-6xl mx-auto px-space-md lg:px-space-xl flex flex-col items-center justify-center py-20 gap-space-md">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="font-body-md text-on-surface-variant">
            Compiling Comprehensive Doctor Clinical Summary...
          </span>
        </div>
      </main>
    );
  }

  if (error || !summaryData) {
    return (
      <main className="w-full pt-28 pb-16 bg-surface min-h-screen">
        <div className="max-w-6xl mx-auto px-space-md lg:px-space-xl flex flex-col gap-space-md pt-8">
          <div className="p-space-lg bg-error-container text-on-error-container rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[24px]">error</span>
              <span className="font-body-md font-semibold">{error || 'Clinical records unavailable.'}</span>
            </div>
            <button
              onClick={fetchDoctorSummary}
              className="px-space-md py-space-xs bg-error text-on-error rounded-lg text-label-md font-bold cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  const {
    patient = {},
    prescriptions = [],
    medicalInformation = {},
    investigations = {},
    medicationSafety = {}
  } = summaryData;

  return (
    <main className="w-full pt-28 pb-16 bg-surface min-h-screen print:pt-4 print:pb-4 print:bg-white">
      <div className="max-w-6xl mx-auto px-space-md lg:px-space-xl flex flex-col gap-space-lg print:max-w-none print:px-2">
        
        {/* Breadcrumb Navigation (Hidden on print) */}
        <nav className="flex items-center justify-between text-on-surface-variant font-label-md text-label-md print:hidden">
          <div className="flex items-center gap-space-xs">
            <Link to="/dashboard" className="hover:text-primary transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">dashboard</span>
              <span>Dashboard</span>
            </Link>
            <span>/</span>
            <span className="text-on-surface font-semibold">Doctor Summary</span>
          </div>

          <div className="flex items-center gap-space-xs">
            <button
              type="button"
              onClick={handlePrint}
              className="px-space-md py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline/25 rounded-lg font-label-md text-label-md font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Print or Save as PDF"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>Print / Download Summary</span>
            </button>
          </div>
        </nav>

        {/* Section Header */}
        <section className="bg-gradient-to-r from-primary-container/30 via-surface-container-lowest to-secondary-container/20 p-space-lg lg:p-space-xl rounded-2xl border border-primary/20 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-space-lg print:border-gray-400 print:p-4">
          <div className="flex flex-col gap-space-xs max-w-3xl">
            <div className="inline-flex items-center gap-space-xs text-primary font-label-md font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[24px]">clinical_notes</span>
              <span>MEDIGUARD AI Clinical Decision Support</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-extrabold print:text-2xl">
              Doctor Clinical Summary
            </h1>
            <p className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">
              Comprehensive Consultation Briefing &bull; Powered by MediKiosk
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1 leading-relaxed print:text-sm">
              Consolidated medical overview organizing all available prescription records, clinical indications, diagnostic tests, and safety alerts into an executive physician briefing.
            </p>
          </div>

          {/* Quick Action Button in Header */}
          <div className="flex flex-col items-start md:items-end gap-space-xs shrink-0 print:hidden">
            <button
              type="button"
              onClick={handleGenerateAiSummary}
              disabled={generatingAi}
              className="px-space-lg py-2.5 bg-primary hover:bg-primary-container text-on-primary font-label-md rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {generatingAi ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                  <span>Generating AI Summary...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                  <span>{aiSummary ? 'Regenerate AI Summary' : 'Generate AI Summary'}</span>
                </>
              )}
            </button>
            <span className="text-[11px] font-medium text-on-surface-variant">
              Powered by Gemini AI Clinical Reasoning
            </span>
          </div>
        </section>

        {/* SECTION 1: PATIENT INFORMATION */}
        <section className="bg-surface-container-lowest p-space-lg rounded-xl border border-surface-container shadow-sm flex flex-col gap-space-md print:border-gray-300">
          <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
            <div className="flex items-center gap-space-xs text-primary">
              <span className="material-symbols-outlined text-[22px]">person</span>
              <h2 className="font-title-lg text-title-lg text-on-surface font-bold">1. Patient Information</h2>
            </div>
            <span className="font-mono font-bold text-label-sm px-space-xs py-0.5 rounded bg-primary-container/30 text-primary">
              Health ID: {patient.healthId || 'N/A'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-space-sm pt-space-2xs">
            <div className="flex flex-col p-space-xs rounded-lg bg-surface-container-low">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Patient Name</span>
              <span className="font-title-sm text-title-sm text-on-surface font-bold">{patient.name || 'Not documented'}</span>
            </div>
            <div className="flex flex-col p-space-xs rounded-lg bg-surface-container-low">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Age / DOB</span>
              <span className="font-title-sm text-title-sm text-on-surface font-bold">
                {patient.age !== 'Not documented' ? patient.age : ''} {patient.dateOfBirth ? `(${patient.dateOfBirth})` : 'Not documented'}
              </span>
            </div>
            <div className="flex flex-col p-space-xs rounded-lg bg-surface-container-low">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Gender</span>
              <span className="font-title-sm text-title-sm text-on-surface font-bold">{patient.gender || 'Not documented'}</span>
            </div>
            <div className="flex flex-col p-space-xs rounded-lg bg-surface-container-low">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Blood Group</span>
              <span className="font-title-sm text-title-sm text-on-surface font-bold">{patient.bloodGroup || 'Not documented'}</span>
            </div>
            <div className="flex flex-col p-space-xs rounded-lg bg-surface-container-low">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Height / Weight</span>
              <span className="font-title-sm text-title-sm text-on-surface font-bold">
                {patient.height !== 'Not documented' ? patient.height : '—'} / {patient.weight !== 'Not documented' ? patient.weight : '—'}
              </span>
            </div>
            <div className="flex flex-col p-space-xs rounded-lg bg-surface-container-low">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">ABHA Number</span>
              <span className="font-title-sm text-title-sm text-on-surface font-bold">{patient.abhaNumber || 'Not linked'}</span>
            </div>
          </div>
        </section>

        {/* SECTION 6: AI CLINICAL SUMMARY (GEMINI-POWERED) */}
        <section className="bg-surface-container-lowest p-space-lg lg:p-space-xl rounded-xl border-2 border-primary/30 shadow-md flex flex-col gap-space-md print:border-gray-400">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs pb-space-xs border-b border-surface-container">
            <div className="flex items-center gap-space-xs text-primary">
              <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
              <h2 className="font-title-lg text-title-lg text-on-surface font-bold">
                6. AI Clinical Summary (Physician Briefing)
              </h2>
            </div>

            <div className="flex items-center gap-space-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-label-sm font-semibold border border-primary/20 text-xs">
                Gemini Reasoning Model &bull; Grounded in Records
              </span>
              {!aiSummary && (
                <button
                  type="button"
                  onClick={handleGenerateAiSummary}
                  disabled={generatingAi}
                  className="px-3 py-1 bg-primary text-on-primary rounded-lg text-xs font-semibold cursor-pointer print:hidden"
                >
                  Generate Summary
                </button>
              )}
            </div>
          </div>

          {aiError && (
            <div className="p-space-sm bg-error-container text-on-error-container rounded-lg text-body-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{aiError}</span>
            </div>
          )}

          {generatingAi ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-on-surface-variant">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="font-body-md font-medium">
                Analyzing prescriptions, lab values, and clinical notes with Gemini...
              </span>
              <span className="text-xs text-on-surface-variant/70">
                Grounding analysis strictly on documented records without inventing data
              </span>
            </div>
          ) : aiSummary ? (
            <div className="flex flex-col gap-space-md pt-space-2xs">
              
              {/* Executive Overview */}
              <div className="p-space-md bg-primary-container/15 rounded-xl border border-primary/20 flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">
                  Executive Clinical Overview:
                </span>
                <p className="font-body-lg text-body-lg text-on-surface leading-relaxed font-medium">
                  {aiSummary.clinicalOverview}
                </p>
              </div>

              {/* Grid of AI Findings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                
                {/* Key Findings */}
                <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col gap-2 border border-surface-container">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">fact_check</span>
                    <span>Key Documented Findings</span>
                  </span>
                  <ul className="list-disc pl-5 font-body-sm text-body-sm text-on-surface flex flex-col gap-1">
                    {(aiSummary.keyClinicalFindings || []).map((kf, idx) => (
                      <li key={idx} className="leading-snug">{kf}</li>
                    ))}
                  </ul>
                </div>

                {/* Prescription Assessment */}
                <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col gap-2 border border-surface-container">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">medication</span>
                    <span>Prescription &amp; Regimen Assessment</span>
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                    {aiSummary.prescriptionAssessment || 'Active regimen evaluated against documented indications.'}
                  </p>
                </div>

                {/* Abnormal Findings Alert */}
                <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col gap-2 border border-surface-container">
                  <span className="font-label-sm text-label-sm text-amber-700 dark:text-amber-400 font-bold uppercase flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-amber-600 text-[18px]">warning</span>
                    <span>Important Abnormalities &amp; Clinical Alerts</span>
                  </span>
                  <ul className="list-disc pl-5 font-body-sm text-body-sm text-on-surface flex flex-col gap-1">
                    {(aiSummary.abnormalFindingsAlert || []).map((ab, idx) => (
                      <li key={idx} className="leading-snug">{ab}</li>
                    ))}
                  </ul>
                </div>

                {/* Consultation Discussion Checklist */}
                <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col gap-2 border border-surface-container">
                  <span className="font-label-sm text-label-sm text-primary font-bold uppercase flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">checklist</span>
                    <span>Consultation Discussion Points</span>
                  </span>
                  <ul className="list-disc pl-5 font-body-sm text-body-sm text-on-surface flex flex-col gap-1">
                    {(aiSummary.consultationChecklist || []).map((cp, idx) => (
                      <li key={idx} className="leading-snug">{cp}</li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Unavailable / Missing Information Warning */}
              {aiSummary.unavailableInformation && aiSummary.unavailableInformation.length > 0 && (
                <div className="p-space-sm bg-surface-container rounded-lg border border-outline/25 flex items-start gap-space-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant mt-0.5 shrink-0">
                    info
                  </span>
                  <div className="flex flex-col gap-0.5 text-xs">
                    <span className="font-bold uppercase tracking-wider">
                      Unavailable / Incomplete Information in Available Records:
                    </span>
                    <p className="italic leading-normal">
                      {aiSummary.unavailableInformation.join(' • ')}
                    </p>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="p-space-lg bg-surface-container-low rounded-xl border border-dashed border-outline/30 flex flex-col items-center justify-center text-center gap-2 py-6">
              <span className="material-symbols-outlined text-primary text-[36px]">psychology</span>
              <h4 className="font-title text-title font-bold text-on-surface">
                AI Clinical Briefing Ready to Generate
              </h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-lg">
                Click below to synthesize a structured clinical briefing for this patient using Gemini AI. The AI strictly processes only documented prescriptions and lab values.
              </p>
              <button
                type="button"
                onClick={handleGenerateAiSummary}
                className="mt-2 px-space-lg py-2 bg-primary hover:bg-primary-container text-on-primary font-label-md rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                <span>Generate Doctor Summary</span>
              </button>
            </div>
          )}
        </section>

        {/* SECTION 2: PRESCRIPTION SUMMARY */}
        <section className="bg-surface-container-lowest p-space-lg rounded-xl border border-surface-container shadow-sm flex flex-col gap-space-md print:border-gray-300">
          <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
            <div className="flex items-center gap-space-xs text-primary">
              <span className="material-symbols-outlined text-[22px]">prescriptions</span>
              <h2 className="font-title-lg text-title-lg text-on-surface font-bold">2. Prescription Summary</h2>
            </div>
            <span className="font-label-sm text-label-sm px-space-xs py-0.5 rounded-full bg-primary-container text-on-primary-container font-semibold">
              {prescriptions.length} Active Prescribed Medicine{prescriptions.length === 1 ? '' : 's'}
            </span>
          </div>

          {prescriptions.length === 0 ? (
            <div className="py-6 text-center text-on-surface-variant/70 italic font-body-sm">
              No prescriptions or medicines documented in available records.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-surface-container">
              <table className="w-full text-left font-body-sm text-on-surface">
                <thead className="bg-surface-container text-on-surface font-label-md">
                  <tr>
                    <th className="py-space-xs px-space-md font-semibold">Medicine Name</th>
                    <th className="py-space-xs px-space-md font-semibold">Generic Name</th>
                    <th className="py-space-xs px-space-md font-semibold">Dosage</th>
                    <th className="py-space-xs px-space-md font-semibold">Frequency</th>
                    <th className="py-space-xs px-space-md font-semibold">Duration</th>
                    <th className="py-space-xs px-space-md font-semibold">Instructions</th>
                    <th className="py-space-xs px-space-md font-semibold">Source Document</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {prescriptions.map((med, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-space-xs px-space-md font-bold text-primary">{med.name}</td>
                      <td className="py-space-xs px-space-md text-on-surface-variant italic">{med.genericName}</td>
                      <td className="py-space-xs px-space-md font-mono font-semibold">{med.dosage}</td>
                      <td className="py-space-xs px-space-md">{med.frequency}</td>
                      <td className="py-space-xs px-space-md">{med.duration}</td>
                      <td className="py-space-xs px-space-md text-on-surface-variant">{med.instructions}</td>
                      <td className="py-space-xs px-space-md text-xs text-on-surface-variant truncate max-w-[140px]" title={med.sourceDocument}>
                        {med.sourceDocument}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* SECTION 3: MEDICAL INFORMATION */}
        <section className="bg-surface-container-lowest p-space-lg rounded-xl border border-surface-container shadow-sm flex flex-col gap-space-md print:border-gray-300">
          <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
            <div className="flex items-center gap-space-xs text-primary">
              <span className="material-symbols-outlined text-[22px]">medical_information</span>
              <h2 className="font-title-lg text-title-lg text-on-surface font-bold">3. Medical Information</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
            
            {/* Symptoms / Complaints */}
            <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col gap-1 border border-surface-container">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary">sick</span>
                <span>Symptoms / Presenting Complaints</span>
              </span>
              <ul className="list-disc pl-5 font-body-sm text-body-sm text-on-surface pt-1">
                {(medicalInformation.symptoms || []).map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            {/* Diagnoses */}
            <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col gap-1 border border-surface-container">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary">diagnosis</span>
                <span>Documented Diagnoses</span>
              </span>
              <ul className="list-disc pl-5 font-body-sm text-body-sm text-on-surface pt-1">
                {(medicalInformation.diagnoses || []).map((d, idx) => (
                  <li key={idx} className="font-semibold text-primary">{d}</li>
                ))}
              </ul>
            </div>

            {/* Documented Allergies */}
            <div className="p-space-md bg-amber-500/10 rounded-xl flex flex-col gap-1 border border-amber-500/25">
              <span className="font-label-sm text-label-sm text-amber-800 dark:text-amber-400 font-bold uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                <span>Allergies &amp; Adverse Reactions</span>
              </span>
              <p className="font-body-sm text-body-sm text-on-surface font-semibold pt-1">
                {medicalInformation.allergies}
              </p>
            </div>

            {/* Existing Medical Conditions */}
            <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col gap-1 border border-surface-container">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary">history</span>
                <span>Existing Medical Conditions</span>
              </span>
              <p className="font-body-sm text-body-sm text-on-surface pt-1">
                {medicalInformation.existingConditions}
              </p>
            </div>

            {/* Relevant Medical History / Clinical Notes */}
            <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col gap-1 border border-surface-container md:col-span-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary">notes</span>
                <span>Relevant Medical History &amp; Patient Notes</span>
              </span>
              <p className="font-body-sm text-body-sm text-on-surface pt-1 leading-relaxed">
                {medicalInformation.relevantHistory}
              </p>
            </div>

          </div>
        </section>

        {/* SECTION 4: INVESTIGATION SUMMARY (LAB/TEST RESULTS) */}
        <section className="bg-surface-container-lowest p-space-lg rounded-xl border border-surface-container shadow-sm flex flex-col gap-space-md print:border-gray-300">
          <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
            <div className="flex items-center gap-space-xs text-primary">
              <span className="material-symbols-outlined text-[22px]">biotech</span>
              <h2 className="font-title-lg text-title-lg text-on-surface font-bold">4. Investigation Summary</h2>
            </div>
            <span className="font-label-sm text-label-sm px-space-xs py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold">
              {(investigations.tests || []).length} Lab Test Results Documented
            </span>
          </div>

          {(investigations.tests || []).length === 0 ? (
            <div className="py-6 text-center text-on-surface-variant/70 italic font-body-sm">
              No diagnostic or laboratory tests documented in available records.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-surface-container">
              <table className="w-full text-left font-body-sm text-on-surface">
                <thead className="bg-surface-container text-on-surface font-label-md">
                  <tr>
                    <th className="py-space-xs px-space-md font-semibold">Test Name</th>
                    <th className="py-space-xs px-space-md font-semibold">Value</th>
                    <th className="py-space-xs px-space-md font-semibold">Unit</th>
                    <th className="py-space-xs px-space-md font-semibold">Reference Range</th>
                    <th className="py-space-xs px-space-md font-semibold">Status</th>
                    <th className="py-space-xs px-space-md font-semibold">Source Document</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {(investigations.tests || []).map((test, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-space-xs px-space-md font-semibold">{test.name}</td>
                      <td className="py-space-xs px-space-md font-mono font-bold text-primary">{test.value}</td>
                      <td className="py-space-xs px-space-md text-on-surface-variant">{test.unit || '—'}</td>
                      <td className="py-space-xs px-space-md text-on-surface-variant font-mono">{test.referenceRange}</td>
                      <td className="py-space-xs px-space-md">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            test.isAbnormal
                              ? 'bg-error-container text-on-error-container'
                              : 'bg-tertiary-fixed text-on-tertiary-fixed'
                          }`}
                        >
                          {test.status}
                        </span>
                      </td>
                      <td className="py-space-xs px-space-md text-xs text-on-surface-variant">{test.sourceDocument}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Observations */}
          {investigations.observations && investigations.observations.length > 0 && (
            <div className="p-space-sm bg-surface-container-low rounded-lg border border-surface-container flex flex-col gap-1 text-body-sm">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase">
                Relevant Clinical Observations:
              </span>
              <ul className="list-disc pl-5 text-on-surface">
                {investigations.observations.map((obs, idx) => (
                  <li key={idx}>{obs}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* SECTION 5: MEDICATION SAFETY SUMMARY */}
        <section className="bg-surface-container-lowest p-space-lg rounded-xl border border-surface-container shadow-sm flex flex-col gap-space-md print:border-gray-300">
          <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
            <div className="flex items-center gap-space-xs text-primary">
              <span className="material-symbols-outlined text-[22px]">health_and_safety</span>
              <h2 className="font-title-lg text-title-lg text-on-surface font-bold">5. Medication Safety Summary</h2>
            </div>
            <Link
              to="/interactions"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 print:hidden"
            >
              <span>Open Interaction Checker</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>

          <div className="flex flex-col gap-space-xs">
            {(medicationSafety.warnings || []).map((w, idx) => (
              <div
                key={idx}
                className="p-space-sm bg-surface-container-low rounded-lg border border-outline/25 flex items-start gap-space-xs"
              >
                <span className="material-symbols-outlined text-amber-600 text-[20px] mt-0.5 shrink-0">
                  report_problem
                </span>
                <p className="font-body-md text-body-md text-on-surface leading-snug">
                  {w}
                </p>
              </div>
            ))}
            <p className="text-xs text-on-surface-variant italic pt-1">
              {medicationSafety.safetyNotice}
            </p>
          </div>
        </section>

        {/* Mandatory Clinical Disclaimer */}
        <aside className="p-space-md bg-surface-container-low rounded-xl border border-outline/25 flex items-start gap-space-sm">
          <span className="material-symbols-outlined text-primary text-[20px] mt-0.5 shrink-0">info</span>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            This information is for informational purposes only. Consult a doctor or pharmacist for medical decisions. MEDIGUARD AI clinical summaries organize patient-provided and document-extracted health information for review by licensed healthcare professionals.
          </p>
        </aside>

      </div>
    </main>
  );
}
