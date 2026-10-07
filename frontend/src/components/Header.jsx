import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AboutModal from './AboutModal';

export default function Header({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const handleCopyHealthId = () => {
    if (user?.healthId) {
      navigator.clipboard.writeText(user.healthId);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  const currentPath = location.pathname;

  return (
    <>
      <header class="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div class="h-20 max-w-7xl mx-auto px-space-md lg:px-space-xl flex items-center justify-between gap-space-md">
          <div class="flex items-center gap-space-xl">
            <Link to="/dashboard" class="flex items-center gap-space-sm" title="MEDIGUARD AI — Smart Medication Safety System">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 44" fill="none" class="h-8 w-auto">
                <rect x="2" y="4" width="36" height="36" rx="10" fill="#0D9488"/>
                <path d="M20 12V28M12 20H28" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="20" cy="20" r="3.5" fill="#5EEAD4"/>
                <circle cx="28" cy="12" r="2.5" fill="#5EEAD4"/>
                <text x="48" y="26" font-family="'Plus Jakarta Sans', sans-serif" font-size="20" font-weight="800" fill="#0F172A" letter-spacing="-0.5px">MEDI<tspan fill="#0D9488">GUARD AI</tspan></text>
                <text x="48" y="37" font-family="'Plus Jakarta Sans', sans-serif" font-size="7.5" font-weight="700" fill="#0D9488" letter-spacing="1.2px">SMART MEDICATION SAFETY</text>
              </svg>
            </Link>
            {user && (
              <nav class="hidden xl:flex items-center gap-space-lg">
                <Link
                  to="/dashboard"
                  class={`transition-colors ${currentPath === '/dashboard' ? 'text-primary font-title font-semibold' : 'text-on-surface-variant font-label-md text-label-md hover:text-on-surface'}`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  class={`transition-colors ${currentPath === '/profile' ? 'text-primary font-title font-semibold' : 'text-on-surface-variant font-label-md text-label-md hover:text-on-surface'}`}
                >
                  Health Profile
                </Link>
                <Link
                  to="/kiosk"
                  class={`transition-colors ${currentPath.startsWith('/kiosk') ? 'text-primary font-title font-semibold' : 'text-on-surface-variant font-label-md text-label-md hover:text-on-surface'}`}
                >
                  Kiosk Mode
                </Link>
                <Link
                  to="/interactions"
                  class={`transition-colors ${currentPath === '/interactions' ? 'text-primary font-title font-semibold' : 'text-on-surface-variant font-label-md text-label-md hover:text-on-surface'}`}
                >
                  Interaction Checker
                </Link>
                <Link
                  to="/doctor-summary"
                  class={`transition-colors ${currentPath === '/doctor-summary' ? 'text-primary font-title font-semibold' : 'text-on-surface-variant font-label-md text-label-md hover:text-on-surface'}`}
                >
                  Doctor Summary
                </Link>
                <button
                  type="button"
                  onClick={() => setAboutOpen(true)}
                  class="text-on-surface-variant font-label-md text-label-md hover:text-primary transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>About</span>
                  <span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-surface-container text-primary">v2.4</span>
                </button>
              </nav>
            )}
          </div>

          <div class="flex items-center gap-space-md">
            <div class="hidden md:flex items-center gap-space-2xs px-space-sm py-space-xs bg-surface-container-low rounded-full">
              <span class="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
              <span class="font-label-sm text-label-sm text-on-surface-variant">AI Assistant Active</span>
            </div>

            {user && user.healthId && (
              <div
                onClick={handleCopyHealthId}
                class="hidden sm:flex items-center gap-space-xs px-space-sm py-space-xs bg-surface-container rounded-lg group cursor-pointer hover:bg-surface-container-high transition-colors"
                title="Click to copy Health ID"
              >
                <span class="font-label-sm text-label-sm text-on-surface font-semibold">Health ID: {user.healthId}</span>
                <button aria-label="Copy Health ID" class="flex items-center text-on-surface-variant group-hover:text-primary transition-colors">
                  <span class="material-symbols-outlined text-[16px]">content_copy</span>
                </button>
              </div>
            )}

            {user ? (
              <div class="relative flex items-center gap-space-sm pl-space-xs cursor-pointer">
                <div
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  class="flex items-center gap-space-xs cursor-pointer"
                >
                  <div class="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-title text-title font-semibold shadow-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'P'}
                  </div>
                  <div class="hidden lg:flex flex-col text-left">
                    <span class="font-label-md text-label-md text-on-surface leading-tight">{user.name}</span>
                    <span class="font-label-sm text-label-sm text-on-surface-variant leading-tight">Patient</span>
                  </div>
                  <span class={`material-symbols-outlined text-on-surface-variant text-[20px] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </div>

                {dropdownOpen && (
                  <div class="absolute right-0 top-full mt-space-xs w-52 bg-surface-container-lowest rounded-xl shadow-[0_12px_32px_-4px_rgba(15,23,42,0.08)] py-space-xs z-50 border border-surface-container">
                    <div class="px-space-md py-space-xs border-b border-surface-container lg:hidden">
                      <p class="font-label-md text-label-md text-on-surface">{user.name}</p>
                      {user.healthId && <p class="font-label-sm text-label-sm text-on-surface-variant">Health ID: {user.healthId}</p>}
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      class="flex items-center gap-space-sm px-space-md py-space-xs text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high hover:text-on-surface transition-colors"
                    >
                      <span class="material-symbols-outlined text-[18px]">person</span>
                      Profile
                    </Link>
                    <Link
                      to="/interactions"
                      onClick={() => setDropdownOpen(false)}
                      class="flex items-center gap-space-sm px-space-md py-space-xs text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high hover:text-on-surface transition-colors"
                    >
                      <span class="material-symbols-outlined text-[18px]">compare_arrows</span>
                      Interaction Checker
                    </Link>
                    <Link
                      to="/doctor-summary"
                      onClick={() => setDropdownOpen(false)}
                      class="flex items-center gap-space-sm px-space-md py-space-xs text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high hover:text-on-surface transition-colors"
                    >
                      <span class="material-symbols-outlined text-[18px]">clinical_notes</span>
                      Doctor Summary
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        setAboutOpen(true);
                      }}
                      class="w-full flex items-center gap-space-sm px-space-md py-space-xs text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high hover:text-on-surface transition-colors text-left cursor-pointer"
                    >
                      <span class="material-symbols-outlined text-[18px]">info</span>
                      About MEDIGUARD AI
                    </button>
                    <div class="my-space-2xs border-t border-surface-container"></div>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onLogout();
                      }}
                      class="w-full flex items-center gap-space-sm px-space-md py-space-xs text-error font-label-md text-label-md hover:bg-error-container hover:text-on-error-container transition-colors text-left"
                    >
                      <span class="material-symbols-outlined text-[18px]">logout</span>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div class="flex items-center gap-space-xs">
                <Link
                  to="/login"
                  class="px-space-md py-space-xs font-label-md text-label-md text-primary hover:bg-surface-container rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  class="px-space-md py-space-xs font-label-md text-label-md bg-primary text-on-primary hover:bg-primary-container rounded-lg shadow-sm transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Copy Toast Feedback */}
      {copiedToast && (
        <div class="fixed top-24 right-6 z-50 flex items-center gap-space-sm bg-inverse-surface text-inverse-on-surface px-space-md py-space-sm rounded-xl shadow-xl animate-bounce">
          <span class="material-symbols-outlined text-primary-fixed text-[20px]">content_copy</span>
          <span class="font-label-md text-label-md">Health ID copied to clipboard!</span>
        </div>
      )}

      {/* About MEDIGUARD AI Modal */}
      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}
