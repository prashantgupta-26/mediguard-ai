import React, { useState } from 'react';

export default function MedicalTimeline({
  timeline = [],
  documents = [],
  onViewRecord,
  onReviewRecord,
  onDeleteRecord,
  onUploadClick
}) {
  const [typeFilter, setTypeFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');

  // Collect unique years from timeline items
  const availableYears = Array.from(
    new Set(
      timeline
        .map((t) => t.year)
        .filter((y) => y && y !== 'Unknown' && y !== 'N/A')
    )
  ).sort((a, b) => Number(b) - Number(a));

  // Filter timeline items
  const filteredItems = timeline.filter((item) => {
    // Type Filter
    if (typeFilter !== 'All') {
      const typeLower = (item.documentType || '').toLowerCase();
      if (typeFilter === 'Prescriptions' && !typeLower.includes('prescription')) return false;
      if (typeFilter === 'Lab Reports' && !typeLower.includes('lab')) return false;
      if (typeFilter === 'Discharge Summaries' && !typeLower.includes('discharge')) return false;
      if (typeFilter === 'Medical Reports' && (!typeLower.includes('report') || typeLower.includes('lab'))) return false;
    }

    // Year Filter
    if (yearFilter !== 'All' && item.year !== yearFilter) {
      return false;
    }

    return true;
  });

  const getDocTypeBadge = (docType) => {
    const type = (docType || 'unknown').toLowerCase();
    if (type.includes('prescription')) {
      return { label: 'Prescription', icon: 'medication', bg: 'bg-secondary-container/40 text-secondary border-secondary/30' };
    }
    if (type.includes('lab')) {
      return { label: 'Laboratory Report', icon: 'science', bg: 'bg-primary-container/40 text-primary border-primary/30' };
    }
    if (type.includes('discharge')) {
      return { label: 'Discharge Summary', icon: 'local_hospital', bg: 'bg-tertiary-container/40 text-tertiary border-tertiary/30' };
    }
    if (type.includes('diagnostic')) {
      return { label: 'Diagnostic Report', icon: 'medical_services', bg: 'bg-surface-container-high text-on-surface border-surface-container' };
    }
    return { label: 'Medical Document', icon: 'description', bg: 'bg-surface-container-high text-on-surface border-surface-container' };
  };

  const getStatusChip = (status, isUserVerified) => {
    if (isUserVerified) {
      return (
        <span class="px-space-xs py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-xs text-label-xs font-bold flex items-center gap-1">
          <span class="material-symbols-outlined text-[14px]">verified</span> Patient Verified
        </span>
      );
    }
    if (status === 'needs_review') {
      return (
        <span class="px-space-xs py-0.5 rounded-full bg-warning-container text-on-warning-container font-label-xs text-label-xs font-bold flex items-center gap-1 animate-pulse">
          <span class="material-symbols-outlined text-[14px]">rate_review</span> Needs Review
        </span>
      );
    }
    if (status === 'processing') {
      return (
        <span class="px-space-xs py-0.5 rounded-full bg-primary-container text-primary font-label-xs text-label-xs font-bold flex items-center gap-1">
          <div class="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> AI Analyzing...
        </span>
      );
    }
    if (status === 'processed') {
      return (
        <span class="px-space-xs py-0.5 rounded-full bg-tertiary-container text-tertiary font-label-xs text-label-xs font-bold flex items-center gap-1">
          <span class="material-symbols-outlined text-[14px]">check_circle</span> Processed
        </span>
      );
    }
    return (
      <span class="px-space-xs py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-xs text-label-xs font-medium">
        Uploaded
      </span>
    );
  };

  return (
    <section class="flex flex-col gap-space-lg select-none">
      
      {/* Header & Filter Controls Bar */}
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-space-md border-b border-surface-container pb-space-sm">
        <div class="flex flex-col gap-space-2xs text-left">
          <div class="flex items-center gap-space-xs text-primary font-label-md text-label-md">
            <span class="material-symbols-outlined text-[20px]">timeline</span>
            <span class="tracking-wide uppercase font-label-sm text-label-sm font-semibold">Medical Records Timeline</span>
          </div>
          <h2 class="font-headline-md text-headline-md text-on-surface font-black tracking-tight">
            MEDICAL HISTORY TIMELINE
          </h2>
          <p class="font-body-sm text-body-sm text-on-surface-variant">
            Chronological progression of your medical records, prescriptions, and lab tests.
          </p>
        </div>

        {/* Filter Group */}
        <div class="flex flex-wrap items-center gap-space-xs">
          {/* Document Type Pills */}
          <div class="flex items-center bg-surface-container-low p-1 rounded-xl border border-surface-container">
            {['All', 'Prescriptions', 'Lab Reports', 'Discharge Summaries'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
                class={`px-space-sm py-1 font-label-xs text-label-xs font-bold rounded-lg transition-all cursor-pointer ${
                  typeFilter === type
                    ? 'bg-surface-container-lowest text-primary shadow-xs font-black'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Year Select Filter */}
          {availableYears.length > 0 && (
            <div class="flex items-center bg-surface-container-low px-space-xs py-1 rounded-xl border border-surface-container">
              <span class="material-symbols-outlined text-[16px] text-on-surface-variant mr-1">calendar_today</span>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                class="bg-transparent font-label-xs text-label-xs text-on-surface font-bold focus:outline-none cursor-pointer"
              >
                <option value="All">All Years</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div class="bg-surface-container-lowest p-space-2xl rounded-3xl border-2 border-surface-container text-center flex flex-col items-center gap-space-md shadow-sm">
          <div class="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary">
            <span class="material-symbols-outlined text-[36px]">schedule</span>
          </div>
          <div class="flex flex-col gap-space-2xs max-w-md">
            <h3 class="font-title-lg text-title-lg text-on-surface font-bold">No Medical Timeline Entries</h3>
            <p class="font-body-sm text-body-sm text-on-surface-variant">
              Upload your prescriptions, lab reports, or discharge summaries to automatically construct your medical history timeline.
            </p>
          </div>
          {onUploadClick && (
            <button
              type="button"
              onClick={onUploadClick}
              class="px-space-xl py-space-xs bg-primary text-on-primary font-title-sm text-title-sm font-bold rounded-xl shadow-md hover:bg-primary-container transition-colors cursor-pointer"
            >
              Upload Medical Document
            </button>
          )}
        </div>
      )}

      {/* Timeline Node Chain */}
      {filteredItems.length > 0 && (
        <div class="relative pl-6 md:pl-10 flex flex-col gap-space-xl border-l-3 border-primary/30 my-space-xs">
          {filteredItems.map((item, index) => {
            const badge = getDocTypeBadge(item.documentType);
            const parentDoc = documents.find((d) => d.id === item.id);

            return (
              <div key={item.id || index} class="relative flex flex-col gap-space-xs text-left">
                {/* Timeline Dot Node */}
                <div class="absolute -left-[31px] md:-left-[47px] top-2 w-5 h-5 rounded-full bg-primary border-4 border-surface shadow-md"></div>

                {/* Node Date Badge & Status */}
                <div class="flex flex-wrap items-center gap-space-xs">
                  <span class="font-title-sm text-title-sm font-black text-primary tracking-wide">
                    {item.formattedDate || 'Date N/A'}
                  </span>
                  {getStatusChip(item.processingStatus, item.isUserVerified)}
                </div>

                {/* Timeline Record Card */}
                <div class="bg-surface-container-lowest p-space-lg rounded-3xl shadow-sm border-2 border-surface-container flex flex-col gap-space-md hover:border-primary/40 transition-all">
                  
                  {/* Card Title Header */}
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs border-b border-surface-container pb-space-xs">
                    <div class="flex items-center gap-space-xs">
                      <span class={`px-space-xs py-1 rounded-xl border flex items-center gap-1 font-title-xs text-title-xs font-bold ${badge.bg}`}>
                        <span class="material-symbols-outlined text-[16px]">{badge.icon}</span>
                        <span>{badge.label}</span>
                      </span>
                      <span class="font-title-md text-title-md text-on-surface font-bold">
                        {item.summaryText}
                      </span>
                    </div>

                    <div class="flex items-center gap-space-xs">
                      <button
                        type="button"
                        onClick={() => onViewRecord && onViewRecord(item.id)}
                        class="px-space-md py-1 bg-surface-container hover:bg-surface-container-high text-on-surface font-title-sm text-title-sm font-bold rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <span class="material-symbols-outlined text-[18px]">visibility</span>
                        <span>View</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onReviewRecord && onReviewRecord(item.id)}
                        class="px-space-md py-1 bg-primary-container/40 hover:bg-primary-container text-primary font-title-sm text-title-sm font-bold rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <span class="material-symbols-outlined text-[18px]">fact_check</span>
                        <span>Review Data</span>
                      </button>

                      {onDeleteRecord && (
                        <button
                          type="button"
                          onClick={() => onDeleteRecord(item.id)}
                          class="p-1 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-colors"
                          title="Delete document"
                        >
                          <span class="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Document Extracted Details Quick Preview */}
                  {parentDoc?.extractedData && (
                    <div class="flex flex-col gap-space-xs bg-surface-container-low p-space-sm rounded-2xl border border-surface-container font-body-sm text-body-sm">
                      {parentDoc.extractedData.prescription?.medicines?.length > 0 && (
                        <div class="flex flex-col gap-1">
                          <span class="font-label-xs text-label-xs font-bold uppercase text-secondary">Extracted Medicines:</span>
                          <div class="flex flex-wrap gap-space-2xs">
                            {parentDoc.extractedData.prescription.medicines.map((m, mIdx) => (
                              <span key={mIdx} class="px-2 py-0.5 rounded bg-secondary-container/30 font-title-xs text-title-xs text-secondary font-bold">
                                💊 {m.medicineName} {m.dosage ? `(${m.dosage})` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {parentDoc.extractedData.laboratoryReport?.tests?.length > 0 && (
                        <div class="flex flex-col gap-1 pt-1 border-t border-surface-container">
                          <span class="font-label-xs text-label-xs font-bold uppercase text-primary">Lab Results Extracted:</span>
                          <div class="flex flex-wrap gap-space-2xs">
                            {parentDoc.extractedData.laboratoryReport.tests.map((t, tIdx) => (
                              <span
                                key={tIdx}
                                class={`px-2 py-0.5 rounded font-title-xs text-title-xs font-bold ${
                                  t.abnormalFlag ? 'bg-error-container text-error' : 'bg-surface-container-lowest text-on-surface'
                                }`}
                              >
                                🧪 {t.testName}: <strong class="text-primary">{t.result}</strong> {t.unit || ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

    </section>
  );
}
