import React from 'react';

export default function ExtractedDataModal({ analysis, fileName, onClose }) {
  if (!analysis) return null;

  const {
    documentType = 'Medical Report',
    patient = {},
    hospital = null,
    doctor = null,
    reportDate = null,
    tests = [],
    medicines = [],
    diagnosesMentioned = [],
    observations = [],
    confidence = 'High'
  } = analysis;

  return (
    <div class="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-xs flex items-center justify-center p-space-md overflow-y-auto">
      <div class="w-full max-w-3xl bg-surface-container-lowest p-space-xl rounded-xl shadow-[0_16px_40px_-8px_rgba(15,23,42,0.16)] border border-surface-container flex flex-col gap-space-lg max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div class="flex items-start justify-between border-b border-surface-container pb-space-md">
          <div class="flex flex-col gap-space-2xs">
            <div class="flex items-center gap-space-xs text-primary font-label-md text-label-md">
              <span class="material-symbols-outlined text-[20px]">auto_awesome</span>
              <span class="tracking-wide uppercase font-label-sm text-label-sm font-semibold">MEDIGUARD AI Safe Extraction</span>
            </div>
            <h2 class="font-headline-md text-headline-md text-on-surface tracking-tight">
              AI EXTRACTED HEALTH INFORMATION
            </h2>
            <p class="font-body-sm text-body-sm text-on-surface-variant">
              Information explicitly extracted from <strong class="text-on-surface">{fileName}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            class="text-on-surface-variant hover:text-on-surface p-1.5 rounded-full hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span class="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Metadata Summary Banner */}
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-space-sm p-space-md rounded-xl bg-surface-container-low border border-surface-container">
          <div class="flex flex-col">
            <span class="font-label-sm text-label-sm text-on-surface-variant">Document Type</span>
            <span class="font-title text-title text-primary font-semibold">{documentType || 'N/A'}</span>
          </div>

          <div class="flex flex-col">
            <span class="font-label-sm text-label-sm text-on-surface-variant">Report Date</span>
            <span class="font-title text-title text-on-surface font-semibold">{reportDate || 'N/A'}</span>
          </div>

          <div class="flex flex-col">
            <span class="font-label-sm text-label-sm text-on-surface-variant">Hospital / Lab</span>
            <span class="font-title text-title text-on-surface font-semibold truncate" title={hospital || 'N/A'}>
              {hospital || 'N/A'}
            </span>
          </div>

          <div class="flex flex-col">
            <span class="font-label-sm text-label-sm text-on-surface-variant">Doctor / Clinician</span>
            <span class="font-title text-title text-on-surface font-semibold truncate" title={doctor || 'N/A'}>
              {doctor || 'N/A'}
            </span>
          </div>
        </div>

        {/* Patient Metadata (If explicitly present) */}
        {(patient?.name || patient?.age || patient?.gender) && (
          <div class="p-space-xs rounded-lg bg-surface-container/40 flex flex-wrap items-center gap-space-md font-body-sm text-body-sm text-on-surface">
            <span class="font-semibold text-primary">Patient Info in Document:</span>
            {patient.name && <span>Name: <strong>{patient.name}</strong></span>}
            {patient.age && <span>Age: <strong>{patient.age}</strong></span>}
            {patient.gender && <span>Gender: <strong>{patient.gender}</strong></span>}
          </div>
        )}

        {/* Section 1: TEST RESULTS */}
        {tests && tests.length > 0 && (
          <div class="flex flex-col gap-space-xs">
            <div class="flex items-center gap-space-xs text-primary font-headline-sm text-headline-sm font-semibold">
              <span class="material-symbols-outlined text-[20px]">vital_signs</span>
              <h3>TEST RESULTS</h3>
            </div>

            <div class="overflow-x-auto rounded-xl border border-surface-container">
              <table class="w-full text-left font-body-sm">
                <thead class="bg-surface-container text-on-surface font-label-md">
                  <tr>
                    <th class="py-space-xs px-space-md">Test Name</th>
                    <th class="py-space-xs px-space-md">Value</th>
                    <th class="py-space-xs px-space-md">Unit</th>
                    <th class="py-space-xs px-space-md">Reference Range</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-surface-container">
                  {tests.map((test, index) => (
                    <tr key={index} class="hover:bg-surface-container-low transition-colors">
                      <td class="py-space-xs px-space-md font-semibold text-on-surface">{test.name}</td>
                      <td class="py-space-xs px-space-md font-mono font-bold text-primary">{test.value || 'N/A'}</td>
                      <td class="py-space-xs px-space-md text-on-surface-variant">{test.unit || '—'}</td>
                      <td class="py-space-xs px-space-md text-on-surface-variant font-mono">{test.referenceRange || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 2: MEDICINES MENTIONED */}
        {medicines && medicines.length > 0 && (
          <div class="flex flex-col gap-space-xs">
            <div class="flex items-center gap-space-xs text-tertiary font-headline-sm text-headline-sm font-semibold">
              <span class="material-symbols-outlined text-[20px]">medication</span>
              <h3>MEDICINES MENTIONED</h3>
            </div>

            <div class="overflow-x-auto rounded-xl border border-surface-container">
              <table class="w-full text-left font-body-sm">
                <thead class="bg-surface-container text-on-surface font-label-md">
                  <tr>
                    <th class="py-space-xs px-space-md">Medicine Name</th>
                    <th class="py-space-xs px-space-md">Dosage</th>
                    <th class="py-space-xs px-space-md">Frequency</th>
                    <th class="py-space-xs px-space-md">Duration</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-surface-container">
                  {medicines.map((med, index) => (
                    <tr key={index} class="hover:bg-surface-container-low transition-colors">
                      <td class="py-space-xs px-space-md font-semibold text-on-surface">{med.name}</td>
                      <td class="py-space-xs px-space-md font-mono text-tertiary font-bold">{med.dosage || '—'}</td>
                      <td class="py-space-xs px-space-md text-on-surface-variant">{med.frequency || '—'}</td>
                      <td class="py-space-xs px-space-md text-on-surface-variant">{med.duration || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 3: DIAGNOSES MENTIONED */}
        {diagnosesMentioned && diagnosesMentioned.length > 0 && (
          <div class="flex flex-col gap-space-xs">
            <div class="flex items-center gap-space-xs text-secondary font-headline-sm text-headline-sm font-semibold">
              <span class="material-symbols-outlined text-[20px]">assignment_turned_in</span>
              <h3>DIAGNOSES MENTIONED IN REPORT</h3>
            </div>
            <div class="flex flex-wrap gap-space-xs">
              {diagnosesMentioned.map((diag, index) => (
                <span key={index} class="px-space-md py-space-xs rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-md font-semibold flex items-center gap-space-2xs">
                  <span class="material-symbols-outlined text-[16px]">check_circle</span>
                  {diag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: OBSERVATIONS */}
        {observations && observations.length > 0 && (
          <div class="flex flex-col gap-space-xs">
            <div class="flex items-center gap-space-xs text-on-surface font-headline-sm text-headline-sm font-semibold">
              <span class="material-symbols-outlined text-[20px]">notes</span>
              <h3>CLINICAL OBSERVATIONS</h3>
            </div>
            <ul class="list-disc list-inside flex flex-col gap-1 text-on-surface-variant font-body-sm bg-surface-container-low p-space-md rounded-xl">
              {observations.map((obs, index) => (
                <li key={index} class="leading-relaxed">{obs}</li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Disclaimer Box */}
        <div class="p-space-md rounded-xl bg-surface-container border border-outline/20 text-on-surface-variant text-body-sm flex items-start gap-space-sm mt-space-xs">
          <span class="material-symbols-outlined text-primary text-[20px] mt-0.5">info</span>
          <p class="leading-normal">
            <strong>AI Disclaimer:</strong> AI-generated information is extracted strictly from your uploaded document and may contain errors. It is not a medical diagnosis or treatment recommendation.
          </p>
        </div>

        {/* Footer Close Button */}
        <div class="flex justify-end pt-space-xs border-t border-surface-container">
          <button
            onClick={onClose}
            class="h-touch-target-min px-space-xl bg-primary hover:bg-primary-container text-on-primary font-title text-title rounded-lg shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            Close Extracted Information
          </button>
        </div>

      </div>
    </div>
  );
}
