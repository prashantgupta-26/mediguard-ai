import React, { useState, useEffect } from 'react';
import { apiRequest, apiBlobRequest } from '../services/api';

export default function AIClinicalSummary({ healthId, patientId, onScrollToTimeline }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchSummary();
  }, [healthId, patientId]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const targetId = healthId || patientId;
      const endpoint = targetId ? `/clinical-summary/patient/${targetId}` : '/clinical-summary/current';
      const response = await apiRequest(endpoint, 'GET');
      if (response && response.success) {
        setSummary(response.summary || null);
      } else {
        setSummary(null);
      }
    } catch (err) {
      console.warn('Could not load clinical summary:', err);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    try {
      setGenerating(true);
      setError('');
      const targetId = healthId || patientId;
      const endpoint = targetId ? `/clinical-summary/patient/${targetId}` : '/clinical-summary/generate';
      const body = { healthId: targetId, patientId };
      const response = await apiRequest(endpoint, 'POST', body);

      if (response && response.success && response.summary) {
        setSummary(response.summary);
      } else {
        throw new Error(response?.message || 'Failed to generate clinical summary');
      }
    } catch (err) {
      console.error('Summary generation error:', err);
      setError(err.message || 'Clinical summary could not be generated.');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewSource = async (docId) => {
    if (!docId) return;
    try {
      const blob = await apiBlobRequest(`/patient/records/${docId}/view`);
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      const token = localStorage.getItem('medikiosk_token');
      window.open(`/api/patient/records/${docId}/view?token=${token}`, '_blank');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <section className="bg-white p-6 lg:p-8 rounded-3xl border border-[#0F625C]/15 shadow-sm flex flex-col items-center justify-center gap-3 font-sans my-4">
        <div className="w-8 h-8 border-3 border-[#0F625C] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-bold text-[#0F625C]">Loading AI Clinical Summary...</span>
      </section>
    );
  }

  const generatedData = summary?.generatedSummary || {};
  const rawOverview = generatedData.patientOverview || {};
  const rawName = rawOverview.name && rawOverview.name !== 'undefined undefined' && rawOverview.name !== 'undefined'
    ? rawOverview.name
    : (summary?.patientName && summary.patientName !== 'undefined undefined' ? summary.patientName : 'Patient');
  const rawAge = rawOverview.age && rawOverview.age !== 'Not specified' && typeof rawOverview.age === 'string' && !rawOverview.age.includes('null') && !rawOverview.age.includes('undefined')
    ? rawOverview.age
    : (summary?.patientAge ? `${summary.patientAge} years` : 'Not specified');
  const rawHealthId = rawOverview.healthId && rawOverview.healthId !== 'MK-PENDING'
    ? rawOverview.healthId
    : (summary?.patientHealthId || healthId || 'MK-PENDING');

  const overview = {
    name: rawName,
    age: rawAge,
    gender: rawOverview.gender || summary?.patientGender || 'Not specified',
    healthId: rawHealthId
  };

  const medicalHistory = Array.isArray(generatedData.medicalHistory) ? generatedData.medicalHistory : [];
  const chronologicalCourse = Array.isArray(generatedData.chronologicalCourse) ? generatedData.chronologicalCourse : [];
  const diagnoses = Array.isArray(generatedData.diagnoses) ? generatedData.diagnoses : [];
  const medications = Array.isArray(generatedData.medications) ? generatedData.medications : [];
  const investigations = Array.isArray(generatedData.investigations) ? generatedData.investigations : [];
  const allergies = Array.isArray(generatedData.allergies) ? generatedData.allergies : [];
  const previousTreatments = Array.isArray(generatedData.previousTreatments) ? generatedData.previousTreatments : [];
  const recentUpdates = Array.isArray(generatedData.recentUpdates) ? generatedData.recentUpdates : [];
  const importantPoints = Array.isArray(generatedData.importantPoints) ? generatedData.importantPoints : [];
  const generatedAt = summary?.generatedAt || generatedData.generatedAt || summary?.updatedAt;
  const isOutdated = Boolean(summary?.isOutdated);

  return (
    <section className="bg-white rounded-3xl border border-[#0F625C]/15 shadow-sm overflow-hidden font-sans my-4 transition-all">
      
      {/* SECTION HEADER BAR */}
      <div className="bg-gradient-to-r from-[#0F625C] to-[#0D534E] text-white p-6 lg:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-teal-200 text-xs font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            <span>Intelligent Overview</span>
          </div>
          <h2 className="text-xl lg:text-2xl font-black tracking-tight">AI CLINICAL SUMMARY</h2>
          {generatedAt && (
            <span className="text-xs text-teal-100 font-medium flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              <span>Last updated: {formatDate(generatedAt)}</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onScrollToTimeline && (
            <button
              onClick={onScrollToTimeline}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
              <span>View Full Timeline</span>
            </button>
          )}

          <button
            onClick={handleGenerateSummary}
            disabled={generating}
            className="px-5 py-2.5 bg-white text-[#0F625C] hover:bg-teal-50 text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {generating ? (
              <>
                <span className="w-4 h-4 border-2 border-[#0F625C] border-t-transparent rounded-full animate-spin"></span>
                <span>Analyzing patient timeline…</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">autorenew</span>
                <span>{summary ? 'Regenerate Summary' : 'Generate Summary'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* OUTDATED WARNING BANNER */}
      {isOutdated && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="material-symbols-outlined text-amber-600 text-[20px]">notification_important</span>
            <span>New medical information available — Clinical summary may be outdated.</span>
          </div>
          <button
            onClick={handleGenerateSummary}
            disabled={generating}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            Update Clinical Summary
          </button>
        </div>
      )}

      {/* ERROR ALERT */}
      {error && (
        <div className="m-6 p-4 bg-red-50 text-red-800 rounded-2xl flex items-center justify-between gap-3 border border-red-200 text-xs font-medium">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600 text-[20px]">error</span>
            <span>Clinical summary could not be generated.</span>
          </div>
          <button
            onClick={handleGenerateSummary}
            className="px-3 py-1 bg-red-600 text-white font-bold text-xs rounded-lg hover:bg-red-700 cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* EMPTY STATE */}
      {!summary && !generating && !error && (
        <div className="p-8 lg:p-12 text-center flex flex-col items-center justify-center gap-3 bg-[#EEF6F5]/40">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#0F625C] flex items-center justify-center border border-teal-200/80 shadow-xs">
            <span className="material-symbols-outlined text-[32px]">folder_off</span>
          </div>
          <div className="flex flex-col gap-1 max-w-md">
            <h3 className="text-sm font-bold text-slate-900">No medical history summary generated yet</h3>
            <p className="text-xs text-slate-500">
              Upload and process medical documents or click "Generate Summary" to create a concise, source-traceable overview of the patient's medical records.
            </p>
          </div>
          <button
            onClick={handleGenerateSummary}
            className="mt-2 px-5 py-2.5 bg-[#0F625C] hover:bg-[#0D534E] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
            <span>Generate Clinical Summary</span>
          </button>
        </div>
      )}

      {/* GENERATED SUMMARY BODY */}
      {summary && !generating && (
        <div className="p-6 lg:p-8 flex flex-col gap-6">
          
          {/* DOCTOR VERIFICATION DISCLAIMER NOTE */}
          <div className="p-3.5 bg-sky-50/80 border border-sky-200/90 rounded-2xl flex items-start gap-2.5 text-sky-900 text-xs">
            <span className="material-symbols-outlined text-sky-600 text-[18px] shrink-0 mt-0.5">verified_user</span>
            <p className="font-medium leading-relaxed">
              <strong>Clinical Verification Note:</strong> AI-generated summary based on available patient records. Verify important information with the original medical documents.
            </p>
          </div>

          {/* 1. PATIENT OVERVIEW CARD */}
          <div className="bg-[#EEF6F5]/60 p-5 rounded-2xl border border-[#0F625C]/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0F625C] text-white font-bold flex items-center justify-center text-sm shadow-xs uppercase">
                {overview.name ? overview.name.charAt(0) : 'P'}
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-slate-900">{overview.name}</h3>
                <span className="text-xs text-slate-500 font-medium">
                  Age: {overview.age} • Gender: {overview.gender}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-medium">
                <span className="text-slate-400">Health ID:</span> <strong className="font-mono text-[#0F625C]">{overview.healthId}</strong>
              </div>
            </div>
          </div>

          {/* 10-SECTION GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 2. MEDICAL HISTORY */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
              <h4 className="text-xs font-bold text-[#0F625C] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="material-symbols-outlined text-[18px]">history</span>
                2. Medical History
              </h4>
              <ul className="space-y-1.5">
                {medicalHistory.map((item, idx) => (
                  <li key={idx} className="text-xs text-slate-700 font-medium flex items-start gap-2">
                    <span className="text-[#0F625C] font-bold">•</span>
                    <span>{typeof item === 'string' ? item : item.name || item.value}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. CHRONOLOGICAL COURSE */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
              <h4 className="text-xs font-bold text-[#0F625C] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="material-symbols-outlined text-[18px]">timeline</span>
                3. Chronological Course
              </h4>
              <div className="flex flex-col gap-2">
                {chronologicalCourse.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#0F625C] text-[11px]">{item.date || 'Date N/A'}</span>
                      <span className="text-slate-800 font-medium">{item.event || item.text || item}</span>
                    </div>
                    {item.documentId && (
                      <button
                        onClick={() => handleViewSource(item.documentId)}
                        className="px-2.5 py-1 bg-white hover:bg-teal-50 text-[#0F625C] font-bold text-[11px] rounded-lg border border-[#0F625C]/20 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                      >
                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                        <span>View Source</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 4. DIAGNOSES / CONDITIONS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
              <h4 className="text-xs font-bold text-[#0F625C] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="material-symbols-outlined text-[18px]">clinical_notes</span>
                4. Diagnoses / Conditions
              </h4>
              <div className="flex flex-col gap-2">
                {diagnoses.map((d, idx) => {
                  const dName = typeof d === 'string' ? d : d.name;
                  const dDate = typeof d === 'object' ? d.date : null;
                  const docId = typeof d === 'object' ? d.documentId : null;
                  return (
                    <div key={idx} className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-200/60 flex items-center justify-between gap-2 text-xs">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{dName}</span>
                        {dDate && <span className="text-[10px] text-slate-500">Documented: {dDate}</span>}
                      </div>
                      {docId && (
                        <button
                          onClick={() => handleViewSource(docId)}
                          className="px-2 py-1 bg-white hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-lg border border-emerald-300 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                        >
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                          <span>View Source</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. MEDICATIONS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
              <h4 className="text-xs font-bold text-[#0F625C] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="material-symbols-outlined text-[18px]">medication</span>
                5. Medications
              </h4>
              <div className="flex flex-col gap-2">
                {medications.map((m, idx) => {
                  const mName = typeof m === 'string' ? m : m.name;
                  const mDose = m.dose ? `(${m.dose})` : '';
                  const mFreq = m.frequency ? `- ${m.frequency}` : '';
                  const docId = m.documentId;
                  return (
                    <div key={idx} className="p-2.5 rounded-xl bg-teal-50/50 border border-teal-200/60 flex items-center justify-between gap-2 text-xs">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{mName} {mDose} {mFreq}</span>
                        {m.date && <span className="text-[10px] text-slate-500">Documented: {m.date}</span>}
                      </div>
                      {docId && (
                        <button
                          onClick={() => handleViewSource(docId)}
                          className="px-2 py-1 bg-white hover:bg-teal-100 text-teal-800 font-bold text-[11px] rounded-lg border border-teal-300 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                        >
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                          <span>View Source</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 6. INVESTIGATIONS / REPORTS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3 lg:col-span-2">
              <h4 className="text-xs font-bold text-[#0F625C] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="material-symbols-outlined text-[18px]">biomedical</span>
                6. Investigations / Reports
              </h4>
              {investigations.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Test Name</th>
                        <th className="p-2.5">Result</th>
                        <th className="p-2.5">Unit</th>
                        <th className="p-2.5">Ref Range</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5 text-right">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {investigations.map((inv, idx) => {
                        const isAbnormal = inv.isAbnormal;
                        return (
                          <tr key={idx} className={isAbnormal ? 'bg-red-50/60 font-semibold' : 'hover:bg-slate-50/50'}>
                            <td className="p-2.5 font-bold">{inv.testName || inv.test}</td>
                            <td className={`p-2.5 ${isAbnormal ? 'text-red-700 font-black' : 'text-[#0F625C] font-bold'}`}>
                              {inv.resultValue || inv.value || 'Reported'}
                            </td>
                            <td className="p-2.5 text-slate-500">{inv.unit || '-'}</td>
                            <td className="p-2.5 text-slate-500">{inv.referenceRange || '-'}</td>
                            <td className="p-2.5 text-slate-500">{inv.testDate || '-'}</td>
                            <td className="p-2.5 text-right">
                              {inv.documentId ? (
                                <button
                                  onClick={() => handleViewSource(inv.documentId)}
                                  className="px-2 py-0.5 bg-white hover:bg-slate-100 text-[#0F625C] font-bold text-[11px] rounded border border-slate-300 inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[13px]">visibility</span>
                                  <span>View Source</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">Record</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <span className="text-xs text-slate-500 italic">Not documented in available records.</span>
              )}
            </div>

            {/* 7. ALLERGIES */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
              <h4 className="text-xs font-bold text-[#0F625C] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                7. Allergies
              </h4>
              <ul className="space-y-1">
                {allergies.map((a, idx) => (
                  <li key={idx} className="text-xs font-bold text-slate-800 bg-red-50/50 p-2 rounded-xl border border-red-200/50">
                    ⚠️ {typeof a === 'string' ? a : a.allergen}
                  </li>
                ))}
              </ul>
            </div>

            {/* 8. PREVIOUS TREATMENTS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
              <h4 className="text-xs font-bold text-[#0F625C] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="material-symbols-outlined text-[18px]">healing</span>
                8. Previous Treatments
              </h4>
              <ul className="space-y-1">
                {previousTreatments.map((pt, idx) => (
                  <li key={idx} className="text-xs text-slate-700 font-medium">
                    • {typeof pt === 'string' ? pt : pt.procedure}
                  </li>
                ))}
              </ul>
            </div>

            {/* 9. RECENT UPDATES */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
              <h4 className="text-xs font-bold text-[#0F625C] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="material-symbols-outlined text-[18px]">update</span>
                9. Recent Updates
              </h4>
              <div className="flex flex-col gap-2">
                {recentUpdates.map((ru, idx) => {
                  const text = typeof ru === 'string' ? ru : ru.text;
                  const docId = typeof ru === 'object' ? ru.documentId : null;
                  return (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                      <span className="text-slate-800 font-medium">{text}</span>
                      {docId && (
                        <button
                          onClick={() => handleViewSource(docId)}
                          className="px-2 py-1 bg-white hover:bg-slate-100 text-[#0F625C] font-bold text-[11px] rounded border border-slate-300 inline-flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <span className="material-symbols-outlined text-[13px]">visibility</span>
                          <span>View Source</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 10. IMPORTANT POINTS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
              <h4 className="text-xs font-bold text-[#0F625C] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="material-symbols-outlined text-[18px]">info</span>
                10. Important Points
              </h4>
              <ul className="space-y-1.5">
                {importantPoints.map((ip, idx) => (
                  <li key={idx} className="text-xs text-slate-800 font-semibold flex items-start gap-2">
                    <span className="text-[#0F625C]">•</span>
                    <span>{typeof ip === 'string' ? ip : ip.point}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

        </div>
      )}

    </section>
  );
}
