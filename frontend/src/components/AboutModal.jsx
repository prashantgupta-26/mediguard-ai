import React from 'react';

export default function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 flex flex-col gap-5 text-left animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[24px]">shield</span>
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-xl flex items-center gap-2">
                MEDIGUARD AI
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                  v2.4
                </span>
              </h2>
              <p className="text-teal-700 font-semibold text-xs">Smart Medication Safety System</p>
            </div>
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
          
          {/* Extension Notice */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex gap-3 items-start">
            <span className="material-symbols-outlined text-teal-700 text-[24px] shrink-0 mt-0.5">verified</span>
            <div>
              <h4 className="font-bold text-teal-900 text-sm mb-1">Powered by MediKiosk</h4>
              <p className="text-teal-800 text-xs leading-relaxed">
                <strong>MEDIGUARD AI</strong> is an advanced medication safety intelligence extension built directly upon the established <strong>MediKiosk</strong> patient intake platform. It augments the original hospital kiosk architecture with real-time prescription OCR parsing, drug contraindication detection, and proactive dosage protection.
              </p>
            </div>
          </div>

          {/* Core Capabilities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-teal-700 font-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-[18px]">document_scanner</span>
                Prescription OCR
              </div>
              <p className="text-slate-600 text-xs">
                Extracts medications, dosages, frequency, and instructions using Google Gemini Vision models.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-teal-700 font-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-[18px]">medical_services</span>
                Medication Safety
              </div>
              <p className="text-slate-600 text-xs">
                Checks for duplicate therapies, drug-drug contraindications, and abnormal clinical parameters.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-teal-700 font-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-[18px]">touch_app</span>
                Kiosk Touchscreen
              </div>
              <p className="text-slate-600 text-xs">
                Accessible OPD kiosk with multi-lingual voice guidance (English, Hindi, Bengali).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-teal-700 font-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-[18px]">hub</span>
                FHIR & ABDM
              </div>
              <p className="text-slate-600 text-xs">
                Interoperable FHIR R4 Bundle exports and national ABDM health record synchronization.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
          <span>Powered by MediKiosk • All rights reserved</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
