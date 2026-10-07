import React, { useState, useEffect } from 'react';
import { apiRequest, API_BASE_URL } from '../services/api';

export default function DocumentReviewModal({ isOpen, docId, onClose, onSaveSuccess }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [docData, setDocData] = useState(null);
  const [extracted, setExtracted] = useState(null);
  const [activeTab, setActiveTab] = useState('extracted'); // 'extracted' | 'preview'

  useEffect(() => {
    if (isOpen && docId) {
      fetchDocDetails();
    }
  }, [isOpen, docId]);

  const fetchDocDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiRequest(`/patient/records/${docId}`, 'GET');
      if (data.success && data.document) {
        setDocData(data.document);
        setExtracted(data.document.extractedData || {});
      } else {
        setError('Failed to load document details.');
      }
    } catch (err) {
      console.error('Error fetching document review details:', err);
      setError(err.message || 'Error fetching document review details.');
    } finally {
      setLoading(false);
    }
  };

  const handleMedicineChange = (index, field, value) => {
    setExtracted((prev) => {
      const meds = [...(prev.prescription?.medicines || [])];
      meds[index] = { ...meds[index], [field]: value };
      return {
        ...prev,
        prescription: {
          ...prev.prescription,
          medicines: meds
        }
      };
    });
  };

  const handleAddMedicine = () => {
    setExtracted((prev) => ({
      ...prev,
      prescription: {
        ...prev.prescription,
        medicines: [
          ...(prev.prescription?.medicines || []),
          { medicineName: '', dosage: '', frequency: '', duration: '', confidence: 1.0, needsReview: false }
        ]
      }
    }));
  };

  const handleRemoveMedicine = (index) => {
    setExtracted((prev) => {
      const meds = (prev.prescription?.medicines || []).filter((_, i) => i !== index);
      return {
        ...prev,
        prescription: {
          ...prev.prescription,
          medicines: meds
        }
      };
    });
  };

  const handleLabTestChange = (index, field, value) => {
    setExtracted((prev) => {
      const tests = [...(prev.laboratoryReport?.tests || [])];
      tests[index] = { ...tests[index], [field]: value };
      return {
        ...prev,
        laboratoryReport: {
          ...prev.laboratoryReport,
          tests
        }
      };
    });
  };

  const handleAddLabTest = () => {
    setExtracted((prev) => ({
      ...prev,
      laboratoryReport: {
        ...prev.laboratoryReport,
        tests: [
          ...(prev.laboratoryReport?.tests || []),
          { testName: '', result: '', unit: '', referenceRange: '', abnormalFlag: false, confidence: 1.0, needsReview: false }
        ]
      }
    }));
  };

  const handleRemoveLabTest = (index) => {
    setExtracted((prev) => {
      const tests = (prev.laboratoryReport?.tests || []).filter((_, i) => i !== index);
      return {
        ...prev,
        laboratoryReport: {
          ...prev.laboratoryReport,
          tests
        }
      };
    });
  };

  const handleSaveVerification = async () => {
    try {
      setSaving(true);
      const res = await apiRequest(`/patient/records/${docId}`, 'PATCH', {
        extractedData: extracted,
        documentType: docData?.documentType
      });

      if (res.success) {
        if (onSaveSuccess) onSaveSuccess(res.document);
        onClose();
      }
    } catch (err) {
      console.error('Error saving document verification:', err);
      alert('Failed to save document verification: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const token = localStorage.getItem('medikiosk_token');
  const previewUrl = docId ? `${API_BASE_URL}/patient/records/${docId}/view?token=${token}` : '';

  return (
    <div class="fixed inset-0 z-50 bg-on-surface/80 backdrop-blur-md flex items-center justify-center p-space-sm sm:p-space-md animate-fade-in select-none">
      <div class="bg-surface-container-lowest border-2 border-surface-container rounded-3xl p-space-lg max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Modal Header */}
        <div class="flex items-center justify-between border-b border-surface-container pb-space-xs shrink-0">
          <div class="flex items-center gap-space-sm">
            <div class="w-10 h-10 rounded-xl bg-primary-container text-primary flex items-center justify-center font-bold">
              <span class="material-symbols-outlined text-[24px]">fact_check</span>
            </div>
            <div class="flex flex-col text-left">
              <h2 class="font-headline-sm text-headline-sm font-black text-on-surface">
                Verify Document Information
              </h2>
              <span class="font-label-sm text-label-sm text-on-surface-variant">
                {docData?.originalFileName || 'Medical Document'}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-space-xs">
            {/* View Switch Tabs */}
            <div class="flex bg-surface-container rounded-xl p-1">
              <button
                type="button"
                onClick={() => setActiveTab('extracted')}
                class={`px-space-md py-1 rounded-lg font-title-sm text-title-sm font-bold transition-all ${
                  activeTab === 'extracted' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
                }`}
              >
                Extracted Data
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                class={`px-space-md py-1 rounded-lg font-title-sm text-title-sm font-bold transition-all ${
                  activeTab === 'preview' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
                }`}
              >
                Document Preview
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              class="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high font-bold flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>

        {/* AI Disclaimer Banner */}
        <div class="bg-tertiary-container/40 border border-tertiary/40 rounded-2xl p-space-sm my-space-xs flex items-center justify-between gap-space-sm shrink-0">
          <div class="flex items-center gap-space-xs text-on-surface text-left">
            <span class="material-symbols-outlined text-tertiary text-[22px]">info</span>
            <span class="font-title-sm text-title-sm font-bold">
              AI-extracted information — please verify details before confirming.
            </span>
          </div>
          {docData?.extractionConfidence > 0 && (
            <span class="px-space-xs py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-mono text-label-xs font-bold shrink-0">
              {Math.round(docData.extractionConfidence * 100)}% Confidence
            </span>
          )}
        </div>

        {/* Content Body */}
        {loading ? (
          <div class="py-20 flex flex-col items-center justify-center gap-space-md my-auto">
            <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p class="font-title-md text-title-md font-bold text-on-surface-variant">Loading document details...</p>
          </div>
        ) : error ? (
          <div class="py-16 text-center text-error font-bold text-title-lg my-auto">{error}</div>
        ) : (
          <div class="flex-grow overflow-y-auto pr-space-2xs py-space-xs flex flex-col gap-space-lg text-left">
            
            {/* TAB 1: EXTRACTED DATA EDITOR */}
            {activeTab === 'extracted' && extracted && (
              <div class="flex flex-col gap-space-lg">
                
                {/* 1. DOCUMENT METADATA */}
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-space-md bg-surface-container-low p-space-md rounded-2xl border border-surface-container">
                  <div class="flex flex-col">
                    <label class="font-label-xs text-label-xs font-bold uppercase text-on-surface-variant">Document Type</label>
                    <select
                      value={docData?.documentType || 'medical_report'}
                      onChange={(e) => setDocData({ ...docData, documentType: e.target.value })}
                      class="p-2 rounded-xl bg-surface-container-lowest border border-surface-container font-title-sm text-title-sm font-bold text-on-surface focus:outline-none"
                    >
                      <option value="prescription">Prescription</option>
                      <option value="laboratory_report">Laboratory Report</option>
                      <option value="discharge_summary">Discharge Summary</option>
                      <option value="diagnostic_report">Diagnostic Report</option>
                      <option value="medical_report">Medical Report</option>
                      <option value="other">Other Medical Document</option>
                    </select>
                  </div>

                  <div class="flex flex-col">
                    <label class="font-label-xs text-label-xs font-bold uppercase text-on-surface-variant">Doctor Name</label>
                    <input
                      type="text"
                      value={extracted.facility?.doctorName || ''}
                      onChange={(e) => setExtracted({ ...extracted, facility: { ...extracted.facility, doctorName: e.target.value } })}
                      placeholder="Doctor Name"
                      class="p-2 rounded-xl bg-surface-container-lowest border border-surface-container font-title-sm text-title-sm font-bold text-on-surface focus:outline-none"
                    />
                  </div>

                  <div class="flex flex-col">
                    <label class="font-label-xs text-label-xs font-bold uppercase text-on-surface-variant">Hospital / Clinic / Lab</label>
                    <input
                      type="text"
                      value={extracted.facility?.hospitalOrClinic || ''}
                      onChange={(e) => setExtracted({ ...extracted, facility: { ...extracted.facility, hospitalOrClinic: e.target.value } })}
                      placeholder="Hospital or Lab Name"
                      class="p-2 rounded-xl bg-surface-container-lowest border border-surface-container font-title-sm text-title-sm font-bold text-on-surface focus:outline-none"
                    />
                  </div>
                </div>

                {/* 2. PRESCRIPTION MEDICINES SECTION */}
                <div class="bg-surface-container-lowest border border-surface-container rounded-2xl p-space-md flex flex-col gap-space-md">
                  <div class="flex items-center justify-between border-b border-surface-container pb-space-xs text-secondary">
                    <div class="flex items-center gap-space-xs">
                      <span class="material-symbols-outlined text-[22px]">medication</span>
                      <h3 class="font-title-md text-title-md font-bold text-on-surface uppercase">
                        Prescription Medicines ({extracted.prescription?.medicines?.length || 0})
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddMedicine}
                      class="px-space-md py-1 bg-secondary text-on-secondary font-title-sm text-title-sm font-bold rounded-lg hover:opacity-90 flex items-center gap-1"
                    >
                      <span>+ Add Medicine</span>
                    </button>
                  </div>

                  {(!extracted.prescription?.medicines || extracted.prescription.medicines.length === 0) ? (
                    <p class="font-body-sm text-body-sm text-on-surface-variant italic">No medicines extracted from this document.</p>
                  ) : (
                    <div class="flex flex-col gap-space-xs">
                      {extracted.prescription.medicines.map((med, idx) => (
                        <div
                          key={idx}
                          class={`p-space-md rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-sm ${
                            med.needsReview ? 'bg-error-container/20 border-error/40' : 'bg-surface-container-low border-surface-container'
                          }`}
                        >
                          <div class="grid grid-cols-1 sm:grid-cols-4 gap-space-xs w-full">
                            <input
                              type="text"
                              value={med.medicineName || ''}
                              onChange={(e) => handleMedicineChange(idx, 'medicineName', e.target.value)}
                              placeholder="Medicine Name"
                              class="p-2 rounded-lg bg-surface-container-lowest border border-surface-container font-title-sm text-title-sm font-bold"
                            />
                            <input
                              type="text"
                              value={med.dosage || ''}
                              onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                              placeholder="Dosage (e.g. 500mg)"
                              class="p-2 rounded-lg bg-surface-container-lowest border border-surface-container font-body-sm text-body-sm"
                            />
                            <input
                              type="text"
                              value={med.frequency || ''}
                              onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                              placeholder="Frequency (e.g. 2x daily)"
                              class="p-2 rounded-lg bg-surface-container-lowest border border-surface-container font-body-sm text-body-sm"
                            />
                            <input
                              type="text"
                              value={med.duration || ''}
                              onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                              placeholder="Duration (e.g. 5 days)"
                              class="p-2 rounded-lg bg-surface-container-lowest border border-surface-container font-body-sm text-body-sm"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveMedicine(idx)}
                            class="p-2 text-error hover:bg-error-container rounded-lg shrink-0"
                            title="Remove Medicine"
                          >
                            <span class="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. LABORATORY TESTS SECTION */}
                <div class="bg-surface-container-lowest border border-surface-container rounded-2xl p-space-md flex flex-col gap-space-md">
                  <div class="flex items-center justify-between border-b border-surface-container pb-space-xs text-primary">
                    <div class="flex items-center gap-space-xs">
                      <span class="material-symbols-outlined text-[22px]">science</span>
                      <h3 class="font-title-md text-title-md font-bold text-on-surface uppercase">
                        Laboratory Tests ({extracted.laboratoryReport?.tests?.length || 0})
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddLabTest}
                      class="px-space-md py-1 bg-primary text-on-primary font-title-sm text-title-sm font-bold rounded-lg hover:opacity-90 flex items-center gap-1"
                    >
                      <span>+ Add Test</span>
                    </button>
                  </div>

                  {(!extracted.laboratoryReport?.tests || extracted.laboratoryReport.tests.length === 0) ? (
                    <p class="font-body-sm text-body-sm text-on-surface-variant italic">No laboratory test results extracted.</p>
                  ) : (
                    <div class="flex flex-col gap-space-xs">
                      {extracted.laboratoryReport.tests.map((test, idx) => (
                        <div
                          key={idx}
                          class={`p-space-md rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-sm ${
                            test.abnormalFlag ? 'bg-error-container/30 border-error/50' : 'bg-surface-container-low border-surface-container'
                          }`}
                        >
                          <div class="grid grid-cols-1 sm:grid-cols-4 gap-space-xs w-full">
                            <input
                              type="text"
                              value={test.testName || ''}
                              onChange={(e) => handleLabTestChange(idx, 'testName', e.target.value)}
                              placeholder="Test Name"
                              class="p-2 rounded-lg bg-surface-container-lowest border border-surface-container font-title-sm text-title-sm font-bold"
                            />
                            <input
                              type="text"
                              value={test.result || ''}
                              onChange={(e) => handleLabTestChange(idx, 'result', e.target.value)}
                              placeholder="Result Value"
                              class="p-2 rounded-lg bg-surface-container-lowest border border-surface-container font-headline-sm text-headline-sm font-bold text-primary"
                            />
                            <input
                              type="text"
                              value={test.unit || ''}
                              onChange={(e) => handleLabTestChange(idx, 'unit', e.target.value)}
                              placeholder="Unit (e.g. g/dL)"
                              class="p-2 rounded-lg bg-surface-container-lowest border border-surface-container font-body-sm text-body-sm"
                            />
                            <input
                              type="text"
                              value={test.referenceRange || ''}
                              onChange={(e) => handleLabTestChange(idx, 'referenceRange', e.target.value)}
                              placeholder="Reference Range (e.g. 12-16)"
                              class="p-2 rounded-lg bg-surface-container-lowest border border-surface-container font-body-sm text-body-sm"
                            />
                          </div>

                          {test.statusMessage && (
                            <span class={`font-label-xs text-label-xs font-bold px-2 py-1 rounded shrink-0 ${test.abnormalFlag ? 'bg-error text-on-error' : 'bg-tertiary-container text-tertiary'}`}>
                              {test.statusMessage}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveLabTest(idx)}
                            class="p-2 text-error hover:bg-error-container rounded-lg shrink-0"
                            title="Remove Test"
                          >
                            <span class="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. DISCHARGE SUMMARY & DIAGNOSES */}
                {extracted.dischargeSummary && (
                  <div class="bg-surface-container-lowest border border-surface-container rounded-2xl p-space-md flex flex-col gap-space-xs">
                    <h3 class="font-title-md text-title-md font-bold text-on-surface uppercase border-b border-surface-container pb-1">
                      Discharge Summary Details
                    </h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-space-sm pt-2">
                      <div class="flex flex-col">
                        <label class="font-label-xs text-label-xs font-bold text-on-surface-variant">Diagnosis</label>
                        <input
                          type="text"
                          value={extracted.dischargeSummary.diagnosis || ''}
                          onChange={(e) => setExtracted({ ...extracted, dischargeSummary: { ...extracted.dischargeSummary, diagnosis: e.target.value } })}
                          class="p-2 rounded-lg bg-surface-container-low border border-surface-container font-body-sm text-body-sm"
                        />
                      </div>
                      <div class="flex flex-col">
                        <label class="font-label-xs text-label-xs font-bold text-on-surface-variant">Follow-up Instructions</label>
                        <input
                          type="text"
                          value={extracted.dischargeSummary.followUpInstructions || ''}
                          onChange={(e) => setExtracted({ ...extracted, dischargeSummary: { ...extracted.dischargeSummary, followUpInstructions: e.target.value } })}
                          class="p-2 rounded-lg bg-surface-container-low border border-surface-container font-body-sm text-body-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB 2: DOCUMENT PREVIEW */}
            {activeTab === 'preview' && (
              <div class="w-full h-[550px] bg-black rounded-2xl overflow-hidden border-2 border-surface-container flex items-center justify-center">
                {docData?.fileType?.includes('pdf') ? (
                  <iframe
                    src={previewUrl}
                    title="PDF Document Preview"
                    class="w-full h-full border-none"
                  ></iframe>
                ) : (
                  <img
                    src={previewUrl}
                    alt="Medical Document Preview"
                    class="w-full h-full object-contain"
                  />
                )}
              </div>
            )}

          </div>
        )}

        {/* Modal Footer */}
        <div class="flex items-center justify-between border-t border-surface-container pt-space-xs shrink-0 mt-space-xs">
          <span class="font-label-sm text-label-sm text-on-surface-variant">
            {docData?.isUserVerified ? '✓ Verified by patient' : 'Needs review & patient verification'}
          </span>

          <div class="flex items-center gap-space-sm">
            <button
              type="button"
              onClick={onClose}
              class="px-space-md py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-title-sm text-title-sm font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveVerification}
              disabled={saving}
              class="px-space-xl py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-headline-sm font-bold shadow-md flex items-center gap-space-xs disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <div class="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span class="material-symbols-outlined text-[22px]">verified</span>
                  <span>Confirm & Save Verification</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
