import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AboutModal from './AboutModal';

export default function Footer() {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <>
      <footer className="w-full bg-surface-container-lowest border-t border-surface-container py-10 mt-auto print:hidden">
        <div className="max-w-7xl mx-auto px-space-md lg:px-space-xl flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Col 1: Brand & Tagline */}
            <div className="flex flex-col gap-3 md:col-span-2">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 44" fill="none" className="h-8 w-auto">
                  <rect x="2" y="4" width="36" height="36" rx="10" fill="#0D9488"/>
                  <path d="M20 12V28M12 20H28" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="20" cy="20" r="3.5" fill="#5EEAD4"/>
                  <circle cx="28" cy="12" r="2.5" fill="#5EEAD4"/>
                  <text x="48" y="26" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="20" fontWeight="800" fill="#0F172A" letterSpacing="-0.5px">MEDI<tspan fill="#0D9488">GUARD AI</tspan></text>
                  <text x="48" y="37" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="7.5" fontWeight="700" fill="#0D9488" letterSpacing="1.2px">SMART MEDICATION SAFETY</text>
                </svg>
              </div>
              <p className="text-sm font-semibold text-primary">Smart Medication Safety System</p>
              <p className="text-sm text-on-surface-variant max-w-md leading-relaxed">
                Intelligent medication safety, real-time prescription OCR parsing, drug interaction checks, and patient clinical intake platform.
              </p>
              
              {/* Powered by MediKiosk Badge */}
              <div 
                onClick={() => setAboutOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-low border border-primary/20 text-on-surface-variant text-xs font-semibold w-fit cursor-pointer hover:bg-surface-container hover:border-primary/40 transition-colors"
                title="Click to view platform provenance"
              >
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span>⚡ Powered by MediKiosk • Intelligent Intake Platform Extension</span>
                <span className="material-symbols-outlined text-[14px] text-primary">info</span>
              </div>
            </div>

            {/* Col 2: About Information */}
            <div className="flex flex-col gap-3">
              <h4 className="font-title text-title text-on-surface font-bold">About MEDIGUARD AI</h4>
              <ul className="text-sm text-on-surface-variant flex flex-col gap-2">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
                  <span>Medication Safety Engine</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary">document_scanner</span>
                  <span>Gemini Prescription OCR</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary">hub</span>
                  <span>FHIR R4 & ABDM Interoperable</span>
                </li>
                <li>
                  <button 
                    onClick={() => setAboutOpen(true)}
                    className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View System Overview & Provenance</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Navigation */}
            <div className="flex flex-col gap-3">
              <h4 className="font-title text-title text-on-surface font-bold">Platform Quick Links</h4>
              <div className="flex flex-col gap-2 text-sm text-on-surface-variant">
                <Link to="/dashboard" className="hover:text-primary transition-colors">Patient Dashboard</Link>
                <Link to="/profile" className="hover:text-primary transition-colors">Health Profile</Link>
                <Link to="/kiosk" className="hover:text-primary transition-colors">Hospital Kiosk Mode</Link>
                <Link to="/smart-intake" className="hover:text-primary transition-colors">Smart Clinical Intake</Link>
              </div>
            </div>

          </div>

          {/* Bottom copyright & attribution */}
          <div className="pt-6 border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
            <p>© {new Date().getFullYear()} MEDIGUARD AI — Smart Medication Safety System. All rights reserved.</p>
            <div className="flex items-center gap-2 font-medium">
              <button 
                onClick={() => setAboutOpen(true)}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Powered by MediKiosk
              </button>
              <span className="opacity-40">•</span>
              <span>Version 2.4.0</span>
            </div>
          </div>
        </div>
      </footer>

      {/* About Modal */}
      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}
