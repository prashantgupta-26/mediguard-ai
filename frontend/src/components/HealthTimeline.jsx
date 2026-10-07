import React, { useState, useEffect } from 'react';
import { apiRequest, apiBlobRequest } from '../services/api';

export default function HealthTimeline({ user, healthId }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All time');
  const [viewingId, setViewingId] = useState(null);

  useEffect(() => {
    fetchHealthTimeline();

    const handleUpdate = () => {
      fetchHealthTimeline();
    };

    window.addEventListener('health-records-updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    return () => {
      window.removeEventListener('health-records-updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, [user?.id, healthId]);

  const fetchHealthTimeline = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiRequest('/patient/health-timeline', 'GET');
      if (data.success && Array.isArray(data.timeline)) {
        setTimeline(data.timeline);
      } else {
        setError('Unable to load your health timeline.');
      }
    } catch (err) {
      console.error('Error fetching health timeline:', err);
      setError(err.message || 'Unable to load your health timeline.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (docId) => {
    if (!docId) return;
    try {
      setViewingId(docId);
      const blob = await apiBlobRequest(`/patient/records/${docId}/view`);
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.warn('Direct blob view failed, falling back to URL open:', err);
      const token = localStorage.getItem('medikiosk_token') || localStorage.getItem('token') || '';
      window.open(`/api/patient/records/${docId}/view?token=${encodeURIComponent(token)}`, '_blank');
    } finally {
      setViewingId(null);
    }
  };

  // Filter items by type and date
  const filteredTimeline = timeline.filter((item) => {
    // Type Filter
    if (typeFilter !== 'All') {
      const typeLower = (item.documentType || '').toLowerCase();
      if (typeFilter === 'Blood Reports' && !typeLower.includes('blood') && !typeLower.includes('cbc') && !typeLower.includes('lab') && !typeLower.includes('pathology')) return false;
      if (typeFilter === 'Prescriptions' && !typeLower.includes('prescription') && !typeLower.includes('rx')) return false;
      if (typeFilter === 'Diagnostic Reports' && !typeLower.includes('diagnostic') && !typeLower.includes('x-ray') && !typeLower.includes('scan') && !typeLower.includes('mri')) return false;
      if (typeFilter === 'Other' && (typeLower.includes('blood') || typeLower.includes('cbc') || typeLower.includes('lab') || typeLower.includes('prescription') || typeLower.includes('diagnostic'))) return false;
    }

    // Date Filter
    if (dateFilter !== 'All time' && item.date) {
      const itemDate = new Date(item.date);
      if (!isNaN(itemDate.getTime())) {
        const now = new Date();
        const refDate = now.getFullYear() < 2026 ? new Date('2026-10-07') : now;
        const diffDays = (refDate - itemDate) / (1000 * 3600 * 24);
        if (diffDays >= 0) {
          if (dateFilter === 'Last 30 days' && diffDays > 30) return false;
          if (dateFilter === 'Last 6 months' && diffDays > 182) return false;
          if (dateFilter === 'Last 1 year' && diffDays > 365) return false;
        }
      }
    }

    return true;
  });

  if (loading) {
    return (
      <section class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container flex flex-col gap-space-md">
        <div class="flex items-center gap-space-sm">
          <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span class="font-body-md text-on-surface-variant">Loading your health timeline...</span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section class="bg-error-container/20 p-space-lg rounded-xl border border-error/30 flex items-center justify-between gap-space-md">
        <div class="flex items-center gap-space-sm text-error">
          <span class="material-symbols-outlined text-[24px]">error</span>
          <span class="font-body-md text-body-md font-semibold">{error}</span>
        </div>
        <button
          onClick={fetchHealthTimeline}
          class="px-space-md py-space-xs bg-error text-on-error hover:opacity-90 font-label-md text-label-md rounded-lg transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </section>
    );
  }

  return (
    <section class="flex flex-col gap-space-lg">
      {/* Header and Filter Controls */}
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div class="flex flex-col gap-space-2xs">
          <div class="flex items-center gap-space-xs text-primary font-label-md text-label-md">
            <span class="material-symbols-outlined text-[20px]">timeline</span>
            <span class="tracking-wide uppercase font-label-sm text-label-sm font-semibold">Chronological History</span>
          </div>
          <h2 class="font-headline-md text-headline-md text-on-surface tracking-tight">
            PATIENT HEALTH TIMELINE
          </h2>
          <p class="font-body-md text-body-md text-on-surface-variant">
            Your medical history organized chronologically from your uploaded records.
          </p>
        </div>

        {/* Filter Controls */}
        <div class="flex flex-wrap items-center gap-space-xs">
          {/* Document Type Filter */}
          <div class="flex items-center bg-surface-container-low p-1 rounded-lg border border-surface-container">
            {['All', 'Blood Reports', 'Prescriptions', 'Diagnostic Reports', 'Other'].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                class={`px-space-xs py-1 text-label-sm font-label-sm rounded-md transition-all cursor-pointer ${
                  typeFilter === type
                    ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <div class="flex items-center bg-surface-container-low px-space-xs py-1 rounded-lg border border-surface-container">
            <span class="material-symbols-outlined text-[18px] text-on-surface-variant mr-1">calendar_today</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              class="bg-transparent font-label-sm text-label-sm text-on-surface font-medium focus:outline-none cursor-pointer"
            >
              <option value="All time">All time</option>
              <option value="Last 30 days">Last 30 days</option>
              <option value="Last 6 months">Last 6 months</option>
              <option value="Last 1 year">Last 1 year</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchHealthTimeline}
            disabled={loading}
            title="Refresh Timeline"
            class="px-space-xs py-1 text-label-sm font-label-sm rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-primary border border-surface-container flex items-center gap-1 transition-all cursor-pointer"
          >
            <span class={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>sync</span>
            <span class="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredTimeline.length === 0 && (
        <div class="bg-surface-container-lowest p-space-2xl rounded-xl border border-surface-container text-center flex flex-col items-center gap-space-md">
          <div class="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
            <span class="material-symbols-outlined text-[36px]">schedule</span>
          </div>
          <div class="flex flex-col gap-space-2xs max-w-md">
            <h3 class="font-title-lg text-title-lg text-on-surface font-semibold">No Timeline Entries Found</h3>
            <p class="font-body-md text-body-md text-on-surface-variant">
              Your health timeline will appear here after your medical documents are analyzed.
            </p>
          </div>
          <button
            onClick={() => {
              const vaultEl = document.getElementById('my-health-records-vault');
              if (vaultEl) vaultEl.scrollIntoView({ behavior: 'smooth' });
            }}
            class="px-space-lg py-space-xs bg-primary text-on-primary font-label-lg text-label-lg rounded-lg shadow-sm hover:bg-primary-container transition-colors cursor-pointer"
          >
            Upload Medical Document
          </button>
        </div>
      )}

      {/* Vertical Timeline List */}
      {filteredTimeline.length > 0 && (
        <div class="relative pl-6 md:pl-8 flex flex-col gap-space-lg border-l-2 border-primary/30 my-space-xs">
          {filteredTimeline.map((item, index) => {
            const hasTests = item.tests && item.tests.length > 0;
            const hasMedicines = item.medicines && item.medicines.length > 0;
            const hasDiagnoses = item.diagnosesMentioned && item.diagnosesMentioned.length > 0;
            const hasObservations = item.observations && item.observations.length > 0;
            const isAnalyzed = item.aiAnalysisStatus === 'completed';

            return (
              <div key={item.documentId || index} class="relative flex flex-col gap-space-xs">
                {/* Timeline Dot Node */}
                <div class="absolute -left-[31px] md:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-primary border-4 border-surface shadow-xs"></div>

                {/* Date Display */}
                <div class="flex items-center gap-space-xs">
                  <span class="font-title-sm text-title-sm font-bold text-primary tracking-wide uppercase">
                    ● {item.date || 'Date N/A'}
                  </span>
                  {!isAnalyzed && (
                    <span class="px-space-xs py-0.5 rounded-full bg-amber-500/20 text-amber-700 font-label-sm text-label-sm font-semibold">
                      Document uploaded — AI analysis pending
                    </span>
                  )}
                </div>

                {/* Timeline Card */}
                <div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container flex flex-col gap-space-md">
                  {/* Card Title & Document Header */}
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs border-b border-surface-container pb-space-xs">
                    <div class="flex items-center gap-space-xs">
                      <span class="material-symbols-outlined text-primary text-[22px]">
                        {item.fileType?.includes('pdf') ? 'description' : 'image'}
                      </span>
                      <div class="flex flex-col">
                        <h4 class="font-title-md text-title-md text-on-surface font-semibold">
                          {item.documentType || 'Medical Report'}
                        </h4>
                        <span class="font-body-xs text-body-xs text-on-surface-variant font-mono">
                          {item.fileName}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewReport(item.documentId || item.id)}
                      disabled={viewingId === (item.documentId || item.id)}
                      class="px-space-md py-space-xs bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer w-fit disabled:opacity-50"
                    >
                      {viewingId === (item.documentId || item.id) ? (
                        <span class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <span class="material-symbols-outlined text-[18px]">visibility</span>
                      )}
                      <span>View Report</span>
                    </button>
                  </div>

                  {/* Pending Analysis Notice */}
                  {!isAnalyzed && (
                    <div class="p-space-xs rounded bg-surface-container-low text-on-surface-variant font-body-sm text-body-sm flex items-center gap-2">
                      <span class="material-symbols-outlined text-amber-600 text-[18px]">info</span>
                      <span>This record has not been analyzed yet. Click <strong>Analyze with AI</strong> in your Health Records vault to view extracted medical data.</span>
                    </div>
                  )}

                  {/* Extracted Data Sections */}
                  {isAnalyzed && (
                    <div class="flex flex-col gap-space-sm">
                      {/* Test Results Table */}
                      {hasTests && (
                        <div class="flex flex-col gap-space-2xs">
                          <span class="font-label-sm text-label-sm text-primary font-bold tracking-wider uppercase">
                            TEST RESULTS
                          </span>
                          <div class="overflow-x-auto rounded-lg border border-surface-container">
                            <table class="w-full text-left border-collapse">
                              <thead class="bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant">
                                <tr>
                                  <th class="p-space-xs border-b border-surface-container">Test Name</th>
                                  <th class="p-space-xs border-b border-surface-container">Result</th>
                                  <th class="p-space-xs border-b border-surface-container">Unit</th>
                                  <th class="p-space-xs border-b border-surface-container">Reference Range</th>
                                </tr>
                              </thead>
                              <tbody class="divide-y divide-surface-container font-body-sm text-body-sm text-on-surface">
                                {item.tests.map((t, idx) => (
                                  <tr key={idx} class="hover:bg-surface-container-lowest">
                                    <td class="p-space-xs font-medium">{t.name}</td>
                                    <td class="p-space-xs font-semibold text-primary">{t.value}</td>
                                    <td class="p-space-xs text-on-surface-variant">{t.unit || '-'}</td>
                                    <td class="p-space-xs text-on-surface-variant">{t.referenceRange || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Medicines Mentioned */}
                      {hasMedicines && (
                        <div class="flex flex-col gap-space-2xs pt-space-xs">
                          <span class="font-label-sm text-label-sm text-secondary font-bold tracking-wider uppercase">
                            MEDICINES MENTIONED
                          </span>
                          <div class="grid grid-cols-1 sm:grid-cols-2 gap-space-xs">
                            {item.medicines.map((m, idx) => (
                              <div key={idx} class="p-space-xs rounded bg-surface-container-low border border-surface-container flex flex-col">
                                <span class="font-title-sm text-title-sm text-on-surface font-semibold">{m.name}</span>
                                <div class="flex items-center gap-space-xs text-on-surface-variant font-body-xs text-body-xs">
                                  {m.dosage && <span>{m.dosage}</span>}
                                  {m.frequency && <span>• {m.frequency}</span>}
                                  {m.duration && <span>• {m.duration}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Diagnoses Mentioned */}
                      {hasDiagnoses && (
                        <div class="flex flex-col gap-space-2xs pt-space-xs">
                          <span class="font-label-sm text-label-sm text-tertiary font-bold tracking-wider uppercase">
                            DIAGNOSES MENTIONED IN REPORT
                          </span>
                          <ul class="list-disc list-inside font-body-sm text-body-sm text-on-surface bg-surface-container-low p-space-xs rounded-lg border border-surface-container space-y-1">
                            {item.diagnosesMentioned.map((d, idx) => (
                              <li key={idx} class="font-medium">{d}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Observations / Findings */}
                      {hasObservations && (
                        <div class="flex flex-col gap-space-2xs pt-space-xs">
                          <span class="font-label-sm text-label-sm text-on-surface-variant font-bold tracking-wider uppercase">
                            KEY OBSERVATIONS & FINDINGS
                          </span>
                          <ul class="list-disc list-inside font-body-sm text-body-sm text-on-surface-variant bg-surface-container-low p-space-xs rounded-lg border border-surface-container space-y-1">
                            {item.observations.map((o, idx) => (
                              <li key={idx}>{o}</li>
                            ))}
                          </ul>
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
