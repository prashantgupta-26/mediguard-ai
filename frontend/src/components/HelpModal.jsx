import React from 'react';

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 flex flex-col gap-5 text-left animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-sky-600 font-bold text-lg">
            <span className="material-symbols-outlined text-[24px]">help_center</span>
            <span>MEDIGUARD AI Patient Guide & Help</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1 text-slate-700 font-sans text-sm">
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex gap-3 items-start">
            <span className="material-symbols-outlined text-sky-600 text-[22px] shrink-0 mt-0.5">badge</span>
            <div>
              <h4 className="font-semibold text-slate-900 mb-0.5">What is my MediGuard Health ID?</h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                Your Health ID (e.g. <strong className="font-mono text-sky-700">MK-XXXXXX</strong>) is your unique digital identification number across MEDIGUARD AI hospital kiosks and outpatient clinics (powered by MediKiosk). Show or enter this ID to access your records instantly.
              </p>
            </div>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex gap-3 items-start">
            <span className="material-symbols-outlined text-teal-600 text-[22px] shrink-0 mt-0.5">upload_file</span>
            <div>
              <h4 className="font-semibold text-slate-900 mb-0.5">How do Medical Document Uploads work?</h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                You can upload prescriptions, laboratory reports, and discharge summaries in PDF, JPG, or PNG format (up to 10 MB). Documents are securely stored in your personal health vault.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3 items-start">
            <span className="material-symbols-outlined text-slate-600 text-[22px] shrink-0 mt-0.5">timeline</span>
            <div>
              <h4 className="font-semibold text-slate-900 mb-0.5">What is the Health Timeline?</h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                The Health Timeline organizes your medical events chronologically, letting you track lab results, prescriptions, and medical reports over time.
              </p>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 items-start">
            <span className="material-symbols-outlined text-emerald-600 text-[22px] shrink-0 mt-0.5">touch_app</span>
            <div>
              <h4 className="font-semibold text-slate-900 mb-0.5">Hospital Touchscreen Kiosk Mode</h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                If visiting an outpatient clinic terminal, switch to <strong>Kiosk Mode</strong> for a high-contrast touch interface with voice assistance.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
          >
            Got it, thanks!
          </button>
        </div>

      </div>
    </div>
  );
}
