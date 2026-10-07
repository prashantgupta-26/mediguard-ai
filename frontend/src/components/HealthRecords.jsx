import React, { useState, useEffect } from 'react';
import { apiRequest, apiUploadRequest, apiBlobRequest } from '../services/api';
import ExtractedDataModal from './ExtractedDataModal';
import CameraCaptureModal from './CameraCaptureModal';
import DocumentReviewModal from './DocumentReviewModal';
import MedicalTimeline from './MedicalTimeline';

export default function HealthRecords({ healthId }) {
  const [documents, setDocuments] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [analyzingId, setAnalyzingId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDocId, setReviewDocId] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Active AI Extraction Modal State
  const [activeAnalysisData, setActiveAnalysisData] = useState(null);
  const [activeFileName, setActiveFileName] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [healthId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/patient/records', 'GET');
      if (data.success && Array.isArray(data.documents)) {
        setDocuments(data.documents);
        if (data.timeline && Array.isArray(data.timeline)) {
          setTimeline(data.timeline);
        }
      }
    } catch (err) {
      console.error('Error fetching medical records:', err);
      setError(err.message || 'Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    setError('');

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds maximum allowed limit of 10 MB.');
      setSelectedFile(null);
      return;
    }

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png'];
    if (!allowedExts.includes(ext)) {
      setError('Unsupported file type. Please select a PDF, JPG, JPEG, or PNG file.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedFile) {
      setError('Please select a medical document to upload.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('files', selectedFile);

      const response = await apiUploadRequest('/patient/records/upload', formData);

      if (response.success) {
        setToastMessage('Medical document uploaded and processed successfully.');
        setTimeout(() => setToastMessage(''), 3500);
        setSelectedFile(null);
        setShowModal(false);
        fetchDocuments();
        window.dispatchEvent(new CustomEvent('health-records-updated'));
      } else {
        setError(response.message || 'Failed to upload document');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCameraPhotoCaptured = (photoFile) => {
    setSelectedFile(photoFile);
    setShowModal(true);
  };

  const handleView = async (docId) => {
    try {
      setViewingId(docId);
      const blob = await apiBlobRequest(`/patient/records/${docId}/view`);
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error('View document error:', err);
      setToastMessage(`Unable to open file: ${err.message}`);
      setTimeout(() => setToastMessage(''), 3000);
    } finally {
      setViewingId(null);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this medical document?')) {
      return;
    }

    try {
      setDeletingId(docId);
      const response = await apiRequest(`/patient/records/${docId}`, 'DELETE');
      if (response.success) {
        setToastMessage('Medical document deleted successfully');
        setTimeout(() => setToastMessage(''), 3000);
        setDocuments(documents.filter((d) => d.id !== docId));
        setTimeline(timeline.filter((t) => t.id !== docId && t.documentId !== docId));
        window.dispatchEvent(new CustomEvent('health-records-updated'));
      } else {
        setError(response.message || 'Failed to delete document');
      }
    } catch (err) {
      console.error('Delete document error:', err);
      setError(err.message || 'Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  // Trigger Gemini AI Re-Processing
  const handleProcessDocument = async (docId) => {
    try {
      setAnalyzingId(docId);
      setDocuments((prevDocs) =>
        prevDocs.map((d) =>
          d.id === docId ? { ...d, processingStatus: 'processing' } : d
        )
      );

      const response = await apiRequest(`/patient/records/${docId}/process`, 'POST');

      if (response.success) {
        setToastMessage('✓ AI Document Processing Completed Successfully');
        setTimeout(() => setToastMessage(''), 3000);
        fetchDocuments();
        window.dispatchEvent(new CustomEvent('health-records-updated'));

        // Open review modal
        setReviewDocId(docId);
        setShowReviewModal(true);
      } else {
        throw new Error(response.message || 'Processing failed');
      }
    } catch (err) {
      console.error('AI Processing error:', err);
      setToastMessage('Unable to process document. Please try again.');
      setTimeout(() => setToastMessage(''), 3000);
      setDocuments((prevDocs) =>
        prevDocs.map((d) =>
          d.id === docId ? { ...d, processingStatus: 'failed' } : d
        )
      );
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleOpenReview = (docId) => {
    setReviewDocId(docId);
    setShowReviewModal(true);
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status, isVerified) => {
    if (isVerified) {
      return (
        <span class="p-space-xs rounded-lg bg-tertiary-fixed/30 text-on-tertiary-fixed-variant flex items-center gap-space-xs font-label-sm text-label-sm font-bold">
          <span class="material-symbols-outlined text-[16px] text-tertiary">verified</span>
          <span>✓ Patient Verified</span>
        </span>
      );
    }
    if (status === 'processing') {
      return (
        <div class="p-space-xs rounded-lg bg-surface-container-high text-primary flex items-center gap-space-xs font-label-sm text-label-sm font-semibold">
          <span class="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
          <span>AI Analyzing Document...</span>
        </div>
      );
    }
    if (status === 'needs_review') {
      return (
        <div class="p-space-xs rounded-lg bg-warning-container text-on-warning-container flex items-center gap-space-xs font-label-sm text-label-sm font-bold animate-pulse">
          <span class="material-symbols-outlined text-[16px]">rate_review</span>
          <span>Needs Patient Review</span>
        </div>
      );
    }
    if (status === 'processed') {
      return (
        <div class="p-space-xs rounded-lg bg-tertiary-container/40 text-tertiary flex items-center gap-space-xs font-label-sm text-label-sm font-semibold">
          <span class="material-symbols-outlined text-[16px]">check_circle</span>
          <span>✓ AI Extracted & Ready</span>
        </div>
      );
    }
    if (status === 'failed') {
      return (
        <div class="p-space-xs rounded-lg bg-error-container/40 text-on-error-container flex items-center gap-space-xs font-label-sm text-label-sm font-semibold">
          <span class="material-symbols-outlined text-[16px] text-error">error</span>
          <span>Processing Failed</span>
        </div>
      );
    }
    return (
      <div class="p-space-xs rounded-lg bg-surface-container text-on-surface-variant flex items-center gap-space-xs font-label-sm text-label-sm">
        <span class="material-symbols-outlined text-[16px]">info</span>
        <span>Uploaded</span>
      </div>
    );
  };

  return (
    <section id="my-health-records-vault" class="bg-surface-container-lowest p-space-lg lg:p-space-xl rounded-3xl shadow-sm border-2 border-surface-container flex flex-col gap-space-xl w-full select-none">
      
      {/* Toast Feedback */}
      {toastMessage && (
        <div class="fixed top-24 right-6 z-50 flex items-center gap-space-sm bg-inverse-surface text-inverse-on-surface px-space-md py-space-sm rounded-xl shadow-xl animate-bounce">
          <span class="material-symbols-outlined text-tertiary-fixed text-[20px]">check_circle</span>
          <span class="font-label-md text-label-md">{toastMessage}</span>
        </div>
      )}

      {/* Card Section Header */}
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md border-b border-surface-container pb-space-md">
        <div class="flex flex-col gap-space-2xs text-left">
          <div class="flex items-center gap-space-xs text-primary font-label-md text-label-md">
            <span class="material-symbols-outlined text-[20px]">folder_special</span>
            <span class="tracking-wide uppercase font-label-sm text-label-sm font-semibold">Medical Document Vault & Gemini Intelligence</span>
          </div>
          <h2 class="font-headline-md text-headline-md text-on-surface font-black tracking-tight">MY HEALTH RECORDS</h2>
          <p class="font-body-sm text-body-sm text-on-surface-variant">
            Upload prescriptions, lab tests, and discharge summaries. AI extracts structured information for your Health ID <strong class="text-primary font-mono">{healthId}</strong>.
          </p>
        </div>

        <div class="flex items-center gap-space-xs shrink-0">
          <button
            type="button"
            onClick={() => setShowCameraModal(true)}
            class="h-12 px-space-md bg-secondary hover:bg-secondary-container text-on-secondary font-title-sm text-title-sm font-bold rounded-xl shadow-md flex items-center justify-center gap-space-2xs transition-all active:scale-95 cursor-pointer"
          >
            <span class="material-symbols-outlined text-[20px]">photo_camera</span>
            <span>Camera Photo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setError('');
              setSelectedFile(null);
              setShowModal(true);
            }}
            class="h-12 px-space-lg bg-primary hover:bg-primary-container text-on-primary font-title-sm text-title-sm font-bold rounded-xl shadow-md flex items-center justify-center gap-space-xs transition-all active:scale-95 cursor-pointer"
          >
            <span class="material-symbols-outlined text-[22px]">upload_file</span>
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && !showModal && (
        <div class="p-space-md bg-error-container text-on-error-container rounded-2xl flex items-start gap-space-sm border border-error/20">
          <span class="material-symbols-outlined text-error text-[20px] mt-0.5">error</span>
          <span class="font-body-sm text-body-sm">{error}</span>
        </div>
      )}

      {/* Documents Grid */}
      {loading ? (
        <div class="py-space-2xl flex flex-col items-center justify-center gap-space-sm">
          <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span class="font-body-md text-on-surface-variant">Loading medical records...</span>
        </div>
      ) : documents.length === 0 ? (
        /* Empty State */
        <div class="py-space-2xl px-space-md bg-surface-container-low rounded-3xl border-2 border-dashed border-outline/30 flex flex-col items-center text-center gap-space-md my-space-xs">
          <div class="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary">
            <span class="material-symbols-outlined text-[40px]">folder_open</span>
          </div>
          <div class="flex flex-col gap-space-2xs max-w-md">
            <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold">No medical documents uploaded yet.</h3>
            <p class="font-body-sm text-body-sm text-on-surface-variant">
              Upload prescriptions, lab reports, or discharge summaries to keep them organized and extracted automatically.
            </p>
          </div>
          <div class="flex items-center gap-space-xs pt-space-xs">
            <button
              type="button"
              onClick={() => setShowCameraModal(true)}
              class="h-12 px-space-lg bg-secondary text-on-secondary font-title-sm text-title-sm font-bold rounded-xl shadow-md flex items-center gap-space-2xs"
            >
              <span class="material-symbols-outlined text-[20px]">photo_camera</span>
              <span>Take Photo</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setError('');
                setSelectedFile(null);
                setShowModal(true);
              }}
              class="h-12 px-space-xl bg-primary text-on-primary font-title-sm text-title-sm font-bold rounded-xl shadow-md flex items-center gap-space-xs"
            >
              <span class="material-symbols-outlined text-[20px]">upload_file</span>
              <span>Upload File</span>
            </button>
          </div>
        </div>
      ) : (
        /* Document Cards Grid */
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md text-left">
          {documents.map((doc) => {
            const isImg = (doc.fileType && doc.fileType.includes('image')) || ['.jpg', '.jpeg', '.png'].some((ext) => doc.originalFileName.toLowerCase().endsWith(ext));
            const status = doc.processingStatus || doc.aiAnalysisStatus || 'uploaded';
            const isProcessing = status === 'processing' || analyzingId === doc.id;

            return (
              <div
                key={doc.id}
                class="bg-surface-container-lowest p-space-md rounded-2xl border-2 border-surface-container shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-space-md group"
              >
                <div class="flex flex-col gap-space-sm">
                  <div class="flex items-start gap-space-md">
                    {/* File Icon */}
                    <div class={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      isImg ? 'bg-secondary-container text-secondary' : 'bg-primary-container text-primary'
                    }`}>
                      <span class="material-symbols-outlined text-[28px]">
                        {isImg ? 'image' : 'picture_as_pdf'}
                      </span>
                    </div>

                    {/* Document Details */}
                    <div class="flex flex-col gap-space-2xs min-w-0 flex-1">
                      <h4 class="font-title-md text-title-md text-on-surface font-bold truncate" title={doc.originalFileName}>
                        {doc.originalFileName}
                      </h4>
                      <span class="font-label-sm text-label-sm text-on-surface-variant font-medium">
                        {(doc.documentType || 'Document').replace(/_/g, ' ').toUpperCase()} • {formatFileSize(doc.fileSize)}
                      </span>
                      <span class="font-label-xs text-label-xs text-outline">
                        Uploaded {formatDate(doc.uploadedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Processing Status Chip */}
                  <div class="pt-space-2xs">
                    {getStatusBadge(status, doc.isUserVerified)}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div class="flex flex-wrap items-center gap-space-2xs pt-space-xs border-t border-surface-container">
                  <button
                    type="button"
                    onClick={() => handleView(doc.id)}
                    disabled={viewingId === doc.id}
                    class="flex-1 h-9 px-space-xs bg-surface-container hover:bg-surface-container-high text-on-surface font-title-sm text-title-sm font-bold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {viewingId === doc.id ? (
                      <span class="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span class="material-symbols-outlined text-[18px]">visibility</span>
                        <span>View</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenReview(doc.id)}
                    class="flex-1 h-9 px-space-xs bg-primary-container/40 hover:bg-primary-container text-primary font-title-sm text-title-sm font-bold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[18px]">fact_check</span>
                    <span>Review Data</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleProcessDocument(doc.id)}
                    disabled={isProcessing}
                    class="h-9 px-2 bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-title-sm text-title-sm font-bold rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                    title="Re-process with AI"
                  >
                    <span class="material-symbols-outlined text-[18px]">refresh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id || isProcessing}
                    class="h-9 px-2 bg-error-container/30 hover:bg-error-container text-error font-title-sm text-title-sm font-bold rounded-xl flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                    title="Delete document"
                  >
                    {deletingId === doc.id ? (
                      <span class="w-3.5 h-3.5 border-2 border-error border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <span class="material-symbols-outlined text-[18px]">delete</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CHRONOLOGICAL MEDICAL TIMELINE COMPONENT */}
      <div class="pt-space-md border-t-2 border-surface-container">
        <MedicalTimeline
          timeline={timeline}
          documents={documents}
          onViewRecord={handleView}
          onReviewRecord={handleOpenReview}
          onDeleteRecord={handleDelete}
          onUploadClick={() => setShowModal(true)}
        />
      </div>

      {/* Upload File Modal */}
      {showModal && (
        <div class="fixed inset-0 z-50 bg-on-surface/70 backdrop-blur-md flex items-center justify-center p-space-md select-none">
          <div class="w-full max-w-lg bg-surface-container-lowest p-space-xl rounded-3xl shadow-2xl border-2 border-surface-container flex flex-col gap-space-lg text-left">
            
            <div class="flex items-center justify-between border-b border-surface-container pb-space-sm">
              <div class="flex items-center gap-space-xs text-primary font-headline-sm text-headline-sm font-bold">
                <span class="material-symbols-outlined text-[24px]">upload_file</span>
                <span>Upload Medical Document</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!uploading) {
                    setShowModal(false);
                    setSelectedFile(null);
                    setError('');
                  }
                }}
                class="w-8 h-8 rounded-full bg-surface-container font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {error && (
              <div class="p-space-md bg-error-container text-on-error-container rounded-2xl flex items-start gap-space-sm border border-error/20">
                <span class="material-symbols-outlined text-error text-[20px] mt-0.5">error</span>
                <span class="font-body-sm text-body-sm font-bold">{error}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} class="flex flex-col gap-space-md">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                class="flex flex-col items-center justify-center p-space-xl bg-surface-container-low border-2 border-dashed border-primary/40 rounded-2xl hover:bg-surface-container transition-colors text-center relative cursor-pointer group"
              >
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  disabled={uploading}
                  class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <span class="material-symbols-outlined text-primary text-[48px] mb-space-xs group-hover:scale-110 transition-transform">
                  cloud_upload
                </span>
                <p class="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Drag and drop file here or click to browse
                </p>
                <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Supported: <strong>PDF, JPG, JPEG, PNG</strong> (Max: 10 MB)
                </p>
              </div>

              {selectedFile && (
                <div class="p-space-md rounded-2xl bg-primary-container/20 border border-primary/30 flex items-center justify-between gap-space-md">
                  <div class="flex items-center gap-space-sm min-w-0">
                    <span class="material-symbols-outlined text-primary text-[24px]">description</span>
                    <div class="flex flex-col min-w-0">
                      <span class="font-title-sm text-title-sm text-on-surface font-bold truncate">
                        {selectedFile.name}
                      </span>
                      <span class="font-body-sm text-body-sm text-on-surface-variant">
                        Size: {formatFileSize(selectedFile.size)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    class="text-on-surface-variant hover:text-error transition-colors"
                  >
                    <span class="material-symbols-outlined text-[20px]">cancel</span>
                  </button>
                </div>
              )}

              <div class="flex items-center justify-end gap-space-md pt-space-sm border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedFile(null);
                    setError('');
                  }}
                  disabled={uploading}
                  class="px-space-lg py-2 bg-surface-container text-on-surface font-title-sm text-title-sm font-bold rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  class="px-space-xl py-2 bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-headline-sm font-bold rounded-xl shadow-md flex items-center justify-center gap-space-xs disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <span class="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                      <span>Uploading & Processing...</span>
                    </>
                  ) : (
                    <>
                      <span class="material-symbols-outlined text-[20px]">upload</span>
                      <span>Upload & Process with AI</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapturePhoto={handleCameraPhotoCaptured}
      />

      {/* Patient Document Review & Verification Modal */}
      <DocumentReviewModal
        isOpen={showReviewModal}
        docId={reviewDocId}
        onClose={() => {
          setShowReviewModal(false);
          setReviewDocId(null);
        }}
        onSaveSuccess={() => {
          setToastMessage('✓ Document Information Verified & Saved');
          setTimeout(() => setToastMessage(''), 3000);
          fetchDocuments();
          window.dispatchEvent(new CustomEvent('health-records-updated'));
        }}
      />

    </section>
  );
}
