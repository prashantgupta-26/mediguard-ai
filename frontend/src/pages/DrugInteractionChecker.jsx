import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest, apiUploadRequest } from '../services/api';

const COMMON_MANUAL_SUGGESTIONS = [
  'Aspirin',
  'Ibuprofen',
  'Paracetamol',
  'Metformin',
  'Atorvastatin',
  'Omeprazole',
  'Amoxicillin',
  'Ciprofloxacin'
];

const COMMON_FOODS = [
  'Grapefruit / Juice',
  'Milk / Dairy',
  'Alcohol',
  'Green Tea',
  'Cranberry juice',
  'Leafy Greens (Vitamin K)',
  'Garlic / Supplements'
];

// Helper to extract clean medicines list from any document structure
function extractMedsFromDoc(doc) {
  if (!doc) return [];
  const extracted = doc.extractedData || doc.aiExtractedData || {};
  let rawList = [];

  if (extracted.prescription && Array.isArray(extracted.prescription.medicines)) {
    rawList = extracted.prescription.medicines;
  } else if (Array.isArray(extracted.medicines)) {
    rawList = extracted.medicines;
  } else if (extracted.dischargeSummary && Array.isArray(extracted.dischargeSummary.medications)) {
    rawList = extracted.dischargeSummary.medications;
  } else if (Array.isArray(extracted.medications)) {
    rawList = extracted.medications;
  }

  const results = [];
  rawList.forEach((item, idx) => {
    let name = '';
    let dosage = '';
    let frequency = '';

    if (typeof item === 'string') {
      name = item.trim();
    } else if (item && typeof item === 'object') {
      name = (item.medicineName || item.name || item.medicine || item.drug || '').trim();
      dosage = item.dosage || '';
      frequency = item.frequency || '';
    }

    if (name) {
      results.push({
        id: `${doc.id || doc._id || 'doc'}-med-${idx}`,
        name,
        dosage,
        frequency,
        documentId: doc.id || doc._id || doc.documentId || 'unknown',
        documentName: doc.originalFileName || 'Prescription Document'
      });
    }
  });

  return results;
}

export default function DrugInteractionChecker({ user }) {
  // Documents state
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [selectedDocId, setSelectedDocId] = useState('all'); // 'all' or specific documentId

  // Selected Document Medicines state
  const [docMedicines, setDocMedicines] = useState([]); // Array of { ...med, selected: true }
  
  // Manual Medicines state
  const [manualMedicines, setManualMedicines] = useState([]);
  const [manualInput, setManualInput] = useState('');

  // Foods state
  const [foods, setFoods] = useState([]);
  const [foodInput, setFoodInput] = useState('');

  // Direct Document Upload state
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Load uploaded patient documents on mount
  useEffect(() => {
    fetchPatientDocuments();
  }, [user]);

  const fetchPatientDocuments = async () => {
    try {
      setLoadingDocs(true);
      const data = await apiRequest('/patient/records', 'GET');
      if (data.success && Array.isArray(data.documents)) {
        setDocuments(data.documents);

        // Extract medicines from all documents
        const allExtracted = [];
        data.documents.forEach((d) => {
          const meds = extractMedsFromDoc(d);
          meds.forEach((m) => {
            // Avoid duplicate name from the same doc
            if (!allExtracted.some(existing => existing.name.toLowerCase() === m.name.toLowerCase() && existing.documentId === m.documentId)) {
              allExtracted.push({ ...m, selected: true });
            }
          });
        });

        setDocMedicines(allExtracted);

        // Default: if there's at least one document with medicines, select the first one with medicines or keep 'all'
        const docWithMeds = data.documents.find(d => extractMedsFromDoc(d).length > 0);
        if (docWithMeds) {
          setSelectedDocId(docWithMeds.id || docWithMeds._id || 'all');
        }
      }
    } catch (err) {
      console.error('Failed to load patient documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  // Switch selected document view
  const handleSelectDocument = (docId) => {
    setSelectedDocId(docId);
    setError('');
    setResult(null);

    if (docId === 'all') {
      // Select all medicines from all docs
      setDocMedicines(prev => prev.map(m => ({ ...m, selected: true })));
    } else {
      // Select medicines belonging to this document, unselect others
      setDocMedicines(prev => prev.map(m => ({
        ...m,
        selected: m.documentId === docId
      })));
    }
  };

  // Toggle selection of a specific document medicine
  const handleToggleDocMedicine = (medId) => {
    setDocMedicines(prev => prev.map(m => {
      if (m.id === medId) {
        return { ...m, selected: !m.selected };
      }
      return m;
    }));
    setError('');
  };

  // Select all / Deselect all document medicines for current view
  const handleSelectAllDocMeds = (select) => {
    setDocMedicines(prev => prev.map(m => {
      if (selectedDocId === 'all' || m.documentId === selectedDocId) {
        return { ...m, selected: select };
      }
      return m;
    }));
  };

  // Upload a new document directly in this section
  const handleDirectUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File size exceeds 15 MB limit.');
      return;
    }

    setUploadingDoc(true);
    setUploadError('');
    setError('');

    try {
      const formData = new FormData();
      formData.append('document', file);

      const res = await apiUploadRequest('/patient/records/upload', formData);
      if (res.success && res.documents && res.documents.length > 0) {
        const newDoc = res.documents[0];
        
        // Extract medicines from newly uploaded document
        const newMeds = extractMedsFromDoc(newDoc);

        // Prepend new document to list
        setDocuments(prev => [newDoc, ...prev]);

        // Add new extracted meds as selected
        setDocMedicines(prev => [
          ...newMeds.map(m => ({ ...m, selected: true })),
          ...prev
        ]);

        // Automatically switch view to the new document
        const newId = newDoc.id || newDoc._id || 'all';
        setSelectedDocId(newId);
      } else {
        setUploadError(res.message || 'Could not process document.');
      }
    } catch (err) {
      console.error('Direct upload error:', err);
      setUploadError(err.message || 'Failed to upload and extract document.');
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Add manual medicine
  const handleAddManualMed = (medName) => {
    const trimmed = (medName || manualInput).trim();
    if (!trimmed) return;

    if (!manualMedicines.some(m => m.toLowerCase() === trimmed.toLowerCase())) {
      setManualMedicines([...manualMedicines, trimmed]);
    }
    setManualInput('');
    setError('');
  };

  const handleRemoveManualMed = (index) => {
    setManualMedicines(manualMedicines.filter((_, i) => i !== index));
  };

  // Add food item
  const handleAddFood = (foodName) => {
    const trimmed = (foodName || foodInput).trim();
    if (!trimmed) return;

    if (!foods.some(f => f.toLowerCase() === trimmed.toLowerCase())) {
      setFoods([...foods, trimmed]);
    }
    setFoodInput('');
    setError('');
  };

  const handleRemoveFood = (index) => {
    setFoods(foods.filter((_, i) => i !== index));
  };

  // Filtered active document medicines
  const activeDocMedicines = docMedicines.filter(m => {
    if (selectedDocId === 'all') return m.selected;
    return m.documentId === selectedDocId && m.selected;
  });

  // Total active medicines to check
  const activeMedNames = [
    ...activeDocMedicines.map(m => m.name),
    ...manualMedicines
  ];

  // Submit interaction analysis
  const handleCheckInteractions = async () => {
    if (activeMedNames.length === 0 && foods.length === 0) {
      setError('Please select at least one medicine from your uploaded document or enter a medicine/food item.');
      return;
    }

    if (activeMedNames.length === 1 && foods.length === 0) {
      setError('To evaluate clinical interactions, please have at least two medicines selected, or one medicine and a food/beverage item.');
      return;
    }

    setAnalyzing(true);
    setError('');
    setResult(null);

    try {
      const response = await apiRequest('/interactions/check', 'POST', {
        medicines: activeMedNames,
        foods
      });

      if (response && response.success !== undefined) {
        setResult(response);
      } else {
        setError('Unable to analyze interactions at this time. Please try again.');
      }
    } catch (err) {
      console.error('Interaction checker error:', err);
      setError(err.message || 'Error communicating with the interaction analysis engine.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getSeverityBadgeClass = (severity) => {
    switch ((severity || '').toLowerCase()) {
      case 'high':
        return 'bg-error-container text-on-error-container border border-error/30';
      case 'moderate':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30';
      case 'low':
        return 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30';
      case 'none':
        return 'bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary/30';
      case 'unable to verify':
      default:
        return 'bg-surface-container-high text-on-surface-variant border border-outline/30';
    }
  };

  const getSeverityIcon = (severity) => {
    switch ((severity || '').toLowerCase()) {
      case 'high':
        return 'warning';
      case 'moderate':
        return 'report_problem';
      case 'low':
        return 'info';
      case 'none':
        return 'check_circle';
      default:
        return 'help';
    }
  };

  return (
    <main className="w-full pt-28 pb-16 bg-surface min-h-screen">
      <div className="max-w-6xl mx-auto px-space-md lg:px-space-xl flex flex-col gap-space-lg">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md">
          <Link to="/dashboard" className="hover:text-primary transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            <span>Dashboard</span>
          </Link>
          <span>/</span>
          <span className="text-on-surface font-semibold">Interaction Checker</span>
        </nav>

        {/* Section Header */}
        <section className="bg-gradient-to-r from-primary-container/30 via-surface-container-lowest to-secondary-container/20 p-space-lg lg:p-space-xl rounded-2xl border border-primary/20 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-space-lg">
          <div className="flex flex-col gap-space-xs max-w-3xl">
            <div className="inline-flex items-center gap-space-xs text-primary font-label-md font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[24px]">compare_arrows</span>
              <span>MEDIGUARD AI Clinical Safety Module</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-extrabold">
              Drug–Drug & Drug–Food Interaction Checker
            </h1>
            <p className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">
              Smart Medication Safety System &bull; Powered by MediKiosk
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1 leading-relaxed">
              Analyze safety and contraindications based directly on medications extracted from your <strong>uploaded prescriptions & medical documents</strong>, with the flexibility to input additional medicines or dietary items.
            </p>
          </div>

          <div className="hidden lg:flex flex-col items-end gap-space-xs text-right shrink-0">
            <span className="px-space-sm py-1 rounded-full bg-primary/10 text-primary font-label-sm font-semibold flex items-center gap-1 border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Document-Driven Gemini AI Engine
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Real-Time Clinical OCR &amp; Analysis</span>
          </div>
        </section>

        {/* Mandatory Clinical Disclaimer Alert */}
        <aside className="p-space-md bg-surface-container-low rounded-xl border border-outline/25 flex items-start gap-space-md shadow-xs">
          <span className="material-symbols-outlined text-primary text-[24px] mt-0.5 shrink-0">info</span>
          <div className="flex flex-col gap-0.5">
            <p className="font-title text-title text-on-surface font-semibold">
              Medical Disclaimer
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              This information is for informational purposes only. Consult a doctor or pharmacist for medical decisions. Do not discontinue, start, increase, or decrease medications without direct professional medical supervision.
            </p>
          </div>
        </aside>

        {/* PRIMARY SOURCE: UPLOADED DOCUMENT MEDICINES */}
        <section className="bg-surface-container-lowest p-space-lg rounded-2xl border-2 border-primary/30 shadow-sm flex flex-col gap-space-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-xs border-b border-surface-container">
            <div className="flex items-center gap-space-xs text-primary">
              <span className="material-symbols-outlined text-[26px]">document_scanner</span>
              <div>
                <h2 className="font-title-lg text-title-lg text-on-surface font-bold">
                  1. Medicines from Uploaded Documents
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Automatically extracted from your prescriptions via Gemini AI Vision OCR.
                </p>
              </div>
            </div>

            {/* Direct Upload Button */}
            <div className="flex items-center gap-space-xs">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                id="direct-doc-upload"
                onChange={handleDirectUpload}
                disabled={uploadingDoc}
              />
              <label
                htmlFor="direct-doc-upload"
                className="px-space-md py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg font-label-md text-label-md font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
              >
                {uploadingDoc ? (
                  <>
                    <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                    <span>Extracting with Gemini...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">upload_file</span>
                    <span>Upload New Prescription</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {uploadError && (
            <div className="p-space-sm bg-error-container text-on-error-container rounded-lg text-body-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{uploadError}</span>
            </div>
          )}

          {/* Document Selector & Controls */}
          {loadingDocs ? (
            <div className="py-8 flex items-center justify-center gap-space-xs text-on-surface-variant">
              <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
              <span className="font-body-md">Loading your uploaded medical records...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="p-space-xl bg-surface-container-low rounded-xl border border-dashed border-outline/30 flex flex-col items-center justify-center text-center gap-space-sm py-8">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant/60">description</span>
              <h3 className="font-title text-title text-on-surface font-semibold">
                No Prescriptions Uploaded Yet
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">
                Upload a prescription photo or hospital document to have its medicines extracted and analyzed automatically, or use the manual input option below.
              </p>
              <label
                htmlFor="direct-doc-upload"
                className="mt-2 px-space-lg py-2.5 bg-primary text-on-primary font-label-md rounded-lg shadow-sm flex items-center gap-2 hover:bg-primary-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
                <span>Upload Prescription Photo</span>
              </label>
            </div>
          ) : (
            <div className="flex flex-col gap-space-md">
              {/* Document Selector Bar */}
              <div className="flex flex-wrap items-center justify-between gap-space-xs bg-surface-container-low p-space-sm rounded-xl border border-surface-container">
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-md text-label-md text-on-surface-variant font-semibold">
                    Select Document Source:
                  </span>
                  <select
                    value={selectedDocId}
                    onChange={(e) => handleSelectDocument(e.target.value)}
                    className="h-10 px-space-sm rounded-lg bg-surface-container-lowest border border-outline/30 text-on-surface font-label-md font-semibold focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="all">
                      All Uploaded Documents ({docMedicines.length} total medicines)
                    </option>
                    {documents.map((doc) => {
                      const docId = doc.id || doc._id || doc.documentId;
                      const count = extractMedsFromDoc(doc).length;
                      return (
                        <option key={docId} value={docId}>
                          {doc.originalFileName || 'Prescription Document'} ({count} medicine{count === 1 ? '' : 's'})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Bulk Select/Deselect Actions */}
                <div className="flex items-center gap-space-xs">
                  <button
                    type="button"
                    onClick={() => handleSelectAllDocMeds(true)}
                    className="text-xs font-semibold text-primary hover:underline px-2 py-1 rounded cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-on-surface-variant/40">|</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAllDocMeds(false)}
                    className="text-xs font-semibold text-on-surface-variant hover:underline px-2 py-1 rounded cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Extracted Medicines Chips from Document */}
              <div className="flex flex-col gap-space-xs min-h-[64px] p-space-sm bg-surface-container-low/60 rounded-xl border border-outline/20">
                {activeDocMedicines.length === 0 ? (
                  <div className="py-4 text-center text-on-surface-variant/70 italic font-body-sm">
                    No medicines selected from this document. Click on any medicine badge to include it, or select all.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-space-xs">
                    {docMedicines
                      .filter(m => selectedDocId === 'all' || m.documentId === selectedDocId)
                      .map((med) => (
                        <button
                          key={med.id}
                          type="button"
                          onClick={() => handleToggleDocMedicine(med.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md font-semibold transition-all cursor-pointer ${
                            med.selected
                              ? 'bg-primary text-on-primary shadow-xs border border-primary'
                              : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant border border-outline/25 opacity-70'
                          }`}
                          title={`Click to ${med.selected ? 'exclude' : 'include'} in interaction check`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {med.selected ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                          <span>{med.name}</span>
                          {med.dosage && (
                            <span className={`text-[11px] font-mono px-1 rounded ${med.selected ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-highest'}`}>
                              {med.dosage}
                            </span>
                          )}
                          <span className={`text-[10px] font-normal uppercase opacity-75 ml-0.5`}>
                            ({med.documentName})
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* SECONDARY INPUTS: MANUAL MEDICINES & FOOD/BEVERAGE ITEMS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
          
          {/* Card 1: Manual Medicine Input Option */}
          <section className="bg-surface-container-lowest p-space-lg rounded-xl border border-surface-container shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
              <div className="flex items-center gap-space-xs text-primary">
                <span className="material-symbols-outlined text-[24px]">add_circle</span>
                <div>
                  <h3 className="font-title-lg text-title-lg text-on-surface font-bold">2. Manual Medicine Input Option</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Add extra OTC drugs, vitamins, or unlisted medicines.</p>
                </div>
              </div>
              <span className="font-label-sm text-label-sm px-space-xs py-0.5 rounded-full bg-primary-container text-on-primary-container font-semibold">
                {manualMedicines.length} Added
              </span>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddManualMed();
              }}
              className="flex items-center gap-space-xs"
            >
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Type additional medicine name (e.g. Ibuprofen)..."
                className="flex-grow h-12 px-space-md rounded-lg bg-surface-container-low border border-outline/30 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button
                type="submit"
                className="h-12 px-space-md bg-primary hover:bg-primary-container text-on-primary font-label-lg rounded-lg shadow-sm flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                <span>Add</span>
              </button>
            </form>

            {/* Manually Added Medicines Chips */}
            <div className="flex flex-col gap-space-2xs min-h-[56px] p-space-xs bg-surface-container-low/60 rounded-lg border border-dashed border-outline/30">
              {manualMedicines.length === 0 ? (
                <span className="text-on-surface-variant/70 italic font-body-sm text-center py-3">
                  No additional manual medicines entered. (Optional)
                </span>
              ) : (
                <div className="flex flex-wrap gap-space-xs">
                  {manualMedicines.map((med, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-label-md text-label-md font-semibold border border-primary/20"
                    >
                      <span className="material-symbols-outlined text-[16px]">person</span>
                      <span>{med}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveManualMed(idx)}
                        className="hover:text-error transition-colors cursor-pointer ml-1 flex items-center"
                        title="Remove medicine"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-col gap-space-2xs pt-space-xs">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                Quick Manual Add:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_MANUAL_SUGGESTIONS.map((med, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddManualMed(med)}
                    className="px-2.5 py-1 text-xs rounded-md bg-surface-container hover:bg-primary hover:text-on-primary text-on-surface transition-colors cursor-pointer border border-outline/15"
                  >
                    + {med}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Card 2: Food & Beverages Selection */}
          <section className="bg-surface-container-lowest p-space-lg rounded-xl border border-surface-container shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
              <div className="flex items-center gap-space-xs text-secondary">
                <span className="material-symbols-outlined text-[24px]">restaurant</span>
                <div>
                  <h3 className="font-title-lg text-title-lg text-on-surface font-bold">3. Food &amp; Beverage Items</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Check interactions against dietary foods &amp; drinks.</p>
                </div>
              </div>
              <span className="font-label-sm text-label-sm px-space-xs py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold">
                {foods.length} Added
              </span>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddFood();
              }}
              className="flex items-center gap-space-xs"
            >
              <input
                type="text"
                value={foodInput}
                onChange={(e) => setFoodInput(e.target.value)}
                placeholder="Type food / drink (e.g. Grapefruit, Milk, Alcohol)..."
                className="flex-grow h-12 px-space-md rounded-lg bg-surface-container-low border border-outline/30 text-on-surface font-body-md focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all"
              />
              <button
                type="submit"
                className="h-12 px-space-md bg-secondary hover:bg-secondary-container text-on-secondary font-label-lg rounded-lg shadow-sm flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                <span>Add</span>
              </button>
            </form>

            {/* Selected Foods Chips */}
            <div className="flex flex-col gap-space-2xs min-h-[56px] p-space-xs bg-surface-container-low/60 rounded-lg border border-dashed border-outline/30">
              {foods.length === 0 ? (
                <span className="text-on-surface-variant/70 italic font-body-sm text-center py-3">
                  No foods added. (Optional: test dietary interactions with document medicines)
                </span>
              ) : (
                <div className="flex flex-wrap gap-space-xs">
                  {foods.map((food, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/10 text-secondary font-label-md text-label-md font-semibold border border-secondary/20"
                    >
                      <span className="material-symbols-outlined text-[16px]">local_dining</span>
                      <span>{food}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFood(idx)}
                        className="hover:text-error transition-colors cursor-pointer ml-1 flex items-center"
                        title="Remove food"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Common Suggestions */}
            <div className="flex flex-col gap-space-2xs pt-space-xs">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                Common Interacting Foods:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_FOODS.map((food, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddFood(food)}
                    className="px-2.5 py-1 text-xs rounded-md bg-surface-container hover:bg-secondary hover:text-on-secondary text-on-surface transition-colors cursor-pointer border border-outline/15"
                  >
                    + {food}
                  </button>
                ))}
              </div>
            </div>
          </section>

        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-space-md bg-error-container text-on-error-container rounded-xl border border-error/20 flex items-start gap-space-sm">
            <span className="material-symbols-outlined text-error text-[22px] mt-0.5">error</span>
            <span className="font-body-md text-body-md font-medium">{error}</span>
          </div>
        )}

        {/* Primary Action Button */}
        <div className="flex flex-col items-center justify-center gap-space-xs pt-space-xs">
          <button
            type="button"
            onClick={handleCheckInteractions}
            disabled={analyzing || (activeMedNames.length === 0 && foods.length === 0)}
            className="w-full sm:w-auto min-w-[320px] h-14 px-space-2xl bg-primary hover:bg-primary-container text-on-primary font-title-lg text-title-lg rounded-xl shadow-lg flex items-center justify-center gap-space-sm transition-all duration-200 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {analyzing ? (
              <>
                <span className="w-6 h-6 border-3 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                <span>Analyzing Interactions with Gemini AI...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[26px]">network_intelligence_update</span>
                <span>Check Interactions</span>
              </>
            )}
          </button>
          <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
            Analyzing {activeDocMedicines.length} medicine{activeDocMedicines.length === 1 ? '' : 's'} from document{activeDocMedicines.length === 1 ? '' : 's'}, {manualMedicines.length} manual, {foods.length} food item{foods.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Analysis Results View */}
        {result && (
          <section className="bg-surface-container-lowest p-space-lg lg:p-space-xl rounded-2xl border border-surface-container shadow-md flex flex-col gap-space-lg mt-space-sm animate-fadeIn">
            
            {/* Results Header Banner */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md pb-space-md border-b border-surface-container">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-space-xs">
                  <span className={`material-symbols-outlined text-[28px] ${result.interactionsFound ? 'text-amber-500' : 'text-tertiary'}`}>
                    {result.interactionsFound ? 'crisis_alert' : 'verified'}
                  </span>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-extrabold tracking-tight">
                    {result.interactionsFound
                      ? 'Interactions Identified'
                      : 'No Known Significant Interactions Found'}
                  </h3>
                </div>
                {result.overallSummary && (
                  <p className="font-body-lg text-body-lg text-on-surface-variant mt-1 leading-relaxed">
                    {result.overallSummary}
                  </p>
                )}
              </div>

              {/* Highest Severity Tag */}
              <div className="flex flex-col items-start md:items-end gap-1 shrink-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase">
                  Highest Severity
                </span>
                <span
                  className={`px-3 py-1 rounded-full font-label-md text-label-md font-bold uppercase tracking-wider flex items-center gap-1.5 ${getSeverityBadgeClass(
                    result.highestSeverity
                  )}`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {getSeverityIcon(result.highestSeverity)}
                  </span>
                  <span>{result.highestSeverity || 'None'}</span>
                </span>
              </div>
            </div>

            {/* List of Interactions */}
            {result.interactionsFound && result.interactions && result.interactions.length > 0 ? (
              <div className="flex flex-col gap-space-md">
                <h4 className="font-title-lg text-title-lg text-on-surface font-bold">
                  Detailed Interaction Breakdown ({result.interactions.length})
                </h4>

                <div className="grid grid-cols-1 gap-space-md">
                  {result.interactions.map((item, idx) => (
                    <article
                      key={idx}
                      className="p-space-lg rounded-xl bg-surface-container-low border border-outline/20 flex flex-col gap-space-sm hover:border-primary/30 transition-colors shadow-xs"
                    >
                      {/* Interaction Meta Header */}
                      <div className="flex flex-wrap items-center justify-between gap-space-xs">
                        <div className="flex items-center gap-space-xs">
                          {/* Type Badge */}
                          <span className="px-2.5 py-0.5 rounded font-label-sm text-label-sm font-semibold bg-primary/10 text-primary border border-primary/20">
                            {item.type || 'Drug Interaction'}
                          </span>
                          {/* Interaction Pair */}
                          <span className="font-title text-title text-on-surface font-bold">
                            {item.item1} <span className="text-primary font-normal">&harr;</span> {item.item2}
                          </span>
                        </div>

                        {/* Severity Badge */}
                        <div className="flex items-center gap-space-2xs">
                          <span
                            className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm font-bold uppercase tracking-wider flex items-center gap-1 ${getSeverityBadgeClass(
                              item.severity
                            )}`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {getSeverityIcon(item.severity)}
                            </span>
                            <span>{item.severity}</span>
                          </span>
                        </div>
                      </div>

                      {/* Explanation */}
                      <div className="flex flex-col gap-1 pt-space-xs">
                        <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">
                          Explanation:
                        </span>
                        <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                          {item.explanation}
                        </p>
                      </div>

                      {/* Precautions */}
                      {item.precautions && (
                        <div className="p-space-md bg-surface-container-lowest rounded-lg border border-outline/20 flex items-start gap-space-sm">
                          <span className="material-symbols-outlined text-primary text-[20px] mt-0.5 shrink-0">
                            health_and_safety
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-label-md text-label-md text-primary font-semibold">
                              Recommended Precautions & Questions to Ask:
                            </span>
                            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                              {item.precautions}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Uncertainty Notice if Applicable */}
                      {(item.uncertainty || (item.severity && item.severity.toLowerCase() === 'unable to verify')) && (
                        <div className="p-space-sm bg-surface-container rounded-lg border border-outline/30 flex items-start gap-space-xs">
                          <span className="material-symbols-outlined text-on-surface-variant text-[18px] mt-0.5">
                            help_outline
                          </span>
                          <p className="font-body-sm text-body-sm text-on-surface-variant italic">
                            {item.uncertaintyReason || 'Unable to verify: Clinical evidence regarding this specific combination is limited or inconclusive. Consult a licensed pharmacist for clarification.'}
                          </p>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-space-xl bg-tertiary-fixed/15 rounded-xl border border-tertiary/20 flex flex-col items-center justify-center text-center gap-space-sm py-8">
                <div className="w-16 h-16 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[36px]">check_circle</span>
                </div>
                <h4 className="font-title-lg text-title-lg text-on-surface font-bold">
                  No Significant Interactions Detected
                </h4>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
                  Based on available pharmacological evidence, no major Drug–Drug or Drug–Food interactions were found among the analyzed medications and dietary items. Always inform your prescribing doctor of all supplements and dietary habits.
                </p>
              </div>
            )}

            {/* Model Provenance & Verification Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs pt-space-md border-t border-surface-container text-on-surface-variant font-label-sm text-label-sm">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
                Verified by Gemini AI Clinical Reasoning Engine &bull; Document-grounded analysis
              </span>
              <span>MEDIGUARD AI Medication Safety Module</span>
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
