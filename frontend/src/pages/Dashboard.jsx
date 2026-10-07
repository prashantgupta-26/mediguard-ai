import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import HealthRecords from '../components/HealthRecords';
import HealthSummary from '../components/HealthSummary';
import HealthTimeline from '../components/HealthTimeline';
import IntegrationStatusDashboard from '../components/IntegrationStatusDashboard';
import AbhaLinkingView from '../components/AbhaLinkingView';

export default function Dashboard({ user, onUpdateUser }) {
  const [patient, setPatient] = useState(user || null);
  const [loading, setLoading] = useState(!user);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (user) {
      setPatient(user);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/patient/dashboard', 'GET');
      if (data.success && data.patient) {
        setPatient(data.patient);
        if (onUpdateUser) {
          onUpdateUser(data.patient);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const copyHealthId = () => {
    if (patient?.healthId) {
      navigator.clipboard.writeText(patient.healthId);
      setToastMessage('Health ID copied to clipboard!');
      setTimeout(() => setToastMessage(''), 2500);
    }
  };

  if (loading) {
    return (
      <div class="min-h-screen bg-surface flex items-center justify-center pt-20">
        <div class="flex flex-col items-center gap-space-md">
          <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p class="font-body-md text-on-surface-variant">Loading patient dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <main class="w-full pt-24 bg-surface min-h-screen pb-16">
      {/* Toast Feedback */}
      {toastMessage && (
        <div class="fixed top-24 right-6 z-50 flex items-center gap-space-sm bg-inverse-surface text-inverse-on-surface px-space-md py-space-sm rounded-xl shadow-xl animate-bounce">
          <span class="material-symbols-outlined text-primary-fixed text-[20px]">content_copy</span>
          <span class="font-label-md text-label-md">{toastMessage}</span>
        </div>
      )}

      <div class="max-w-7xl mx-auto w-full px-space-md lg:px-space-xl py-space-md flex flex-col gap-space-2xl">
        
        {/* Top Greeting Section & Profile Readiness Status */}
        <section class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-lg">
          <div class="flex flex-col gap-space-2xs max-w-2xl">
            <div class="flex items-center gap-space-xs text-primary font-label-md text-label-md">
              <span class="material-symbols-outlined text-[18px]">verified</span>
              <span class="tracking-wide uppercase font-label-sm text-label-sm">Active OPD Session • MEDIGUARD AI Safety System</span>
            </div>
            <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Good day, {patient?.name || 'Patient'} 👋
            </h1>
            <p class="font-body-lg text-body-lg text-on-surface-variant">
              Your health history is organized and protected by MEDIGUARD AI (Health ID{' '}
              <span
                onClick={copyHealthId}
                class="font-label-lg text-label-lg text-primary font-semibold cursor-pointer underline decoration-dotted"
                title="Click to copy Health ID"
              >
                {patient?.healthId || 'Generating...'}
              </span>).
            </p>
          </div>

          {/* Profile Completion Gauge Module */}
          <div class="w-full lg:w-auto min-w-[320px] bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-xs border border-surface-container">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-space-xs">
                <span class="material-symbols-outlined text-tertiary text-[20px]">check_circle</span>
                <span class="font-label-md text-label-md text-on-surface">Intake Readiness</span>
              </div>
              <span class="px-space-xs py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm">
                100% Verified
              </span>
            </div>
            <div class="w-full h-2.5 bg-surface-container rounded-full overflow-hidden flex">
              <div class="h-full bg-tertiary rounded-full transition-all duration-700 w-[100%]"></div>
            </div>
            <div class="flex justify-between items-center text-on-surface-variant font-label-sm text-label-sm pt-space-2xs">
              <span>Verified Patient Account</span>
              <span class="text-primary font-semibold">Ready for consultation</span>
            </div>
          </div>
        </section>

        {/* Hero Action Card */}
        <section class="relative rounded-xl overflow-hidden bg-gradient-to-br from-primary via-primary-container to-primary text-on-primary shadow-xl">
          <div class="absolute -right-16 -bottom-16 w-96 h-96 rounded-full bg-primary-fixed/10 blur-3xl pointer-events-none"></div>
          <div class="relative z-10 p-space-lg lg:p-space-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-xl">
            <div class="flex flex-col gap-space-sm max-w-2xl">
              <div class="inline-flex items-center gap-space-xs px-space-sm py-space-2xs rounded-full bg-primary-fixed/20 backdrop-blur-md w-fit">
                <span class="material-symbols-outlined text-primary-fixed text-[18px]">security</span>
                <span class="font-label-sm text-label-sm text-primary-fixed font-semibold tracking-wide uppercase">
                  Smart Medication Safety System
                </span>
              </div>
              <h2 class="font-headline-md text-headline-md text-on-primary tracking-tight">
                Welcome to MEDIGUARD AI
              </h2>
              <p class="font-body-lg text-body-lg text-on-primary-container">
                Your account is linked to email <strong class="underline">{patient?.email}</strong> and unique Health ID <strong class="font-mono bg-primary-fixed/20 px-2 py-0.5 rounded">{patient?.healthId}</strong>.
              </p>
              <div class="flex flex-wrap items-center gap-y-space-xs gap-x-space-md pt-space-xs font-label-md text-label-md text-primary-fixed-dim">
                <div class="flex items-center gap-space-2xs">
                  <span class="material-symbols-outlined text-[18px]">cake</span>
                  <span>DOB: {patient?.dateOfBirth || 'N/A'}</span>
                </div>
                <span class="opacity-40">•</span>
                <div class="flex items-center gap-space-2xs">
                  <span class="material-symbols-outlined text-[18px]">person</span>
                  <span>Gender: {patient?.gender || 'N/A'}</span>
                </div>
                <span class="opacity-40">•</span>
                <div class="flex items-center gap-space-2xs">
                  <span class="material-symbols-outlined text-[18px]">verified</span>
                  <span>Email Verified</span>
                </div>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-space-sm w-full lg:w-auto">
              <Link
                to="/profile"
                class="h-touch-target-min px-space-xl bg-surface-container-lowest text-primary hover:bg-primary-fixed font-title text-title rounded-lg shadow-md flex items-center justify-center gap-space-sm transition-all duration-200 active:scale-95 group"
              >
                <span class="material-symbols-outlined text-[24px] text-primary group-hover:rotate-12 transition-transform">edit_note</span>
                <span>View & Edit Profile</span>
                <span class="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Core Status Grid Cards */}
        <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
          {/* Card 1: Health Profile Details */}
          <div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container flex flex-col justify-between gap-space-lg">
            <div class="flex flex-col gap-space-md">
              <div class="flex items-center justify-between">
                <div class="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                  <span class="material-symbols-outlined text-[26px]">folder_shared</span>
                </div>
                <span class="font-label-sm text-label-sm px-space-xs py-0.5 rounded bg-surface-container text-on-surface-variant font-medium">Profile</span>
              </div>
              <div class="flex flex-col gap-space-xs">
                <h3 class="font-headline-sm text-headline-sm text-on-surface">Patient Details</h3>
                <p class="font-body-sm text-body-sm text-on-surface-variant">Real-time MongoDB record details.</p>
              </div>

              <div class="flex flex-col gap-space-xs pt-space-xs">
                <div class="p-space-xs rounded bg-surface-container-low flex items-start gap-space-xs">
                  <span class="material-symbols-outlined text-primary text-[18px] mt-0.5">person</span>
                  <div class="flex flex-col">
                    <span class="font-label-sm text-label-sm text-on-surface font-semibold">Name</span>
                    <span class="font-body-sm text-body-sm text-on-surface-variant">{patient?.name}</span>
                  </div>
                </div>
                <div class="p-space-xs rounded bg-surface-container-low flex items-start gap-space-xs">
                  <span class="material-symbols-outlined text-secondary text-[18px] mt-0.5">mail</span>
                  <div class="flex flex-col">
                    <span class="font-label-sm text-label-sm text-on-surface font-semibold">Email</span>
                    <span class="font-body-sm text-body-sm text-on-surface-variant">{patient?.email}</span>
                  </div>
                </div>
                <div class="p-space-xs rounded bg-surface-container-low flex items-start gap-space-xs">
                  <span class="material-symbols-outlined text-tertiary text-[18px] mt-0.5">badge</span>
                  <div class="flex flex-col">
                    <span class="font-label-sm text-label-sm text-on-surface font-semibold">Health ID</span>
                    <span class="font-body-sm text-body-sm text-on-surface-variant font-mono font-bold">{patient?.healthId}</span>
                  </div>
                </div>
              </div>
            </div>
            <Link
              to="/profile"
              class="h-12 w-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg rounded-lg flex items-center justify-center gap-space-xs transition-colors"
            >
              <span>Manage Profile</span>
              <span class="material-symbols-outlined text-[18px]">chevron_right</span>
            </Link>
          </div>

          {/* Card 2: Security & Status */}
          <div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container flex flex-col justify-between gap-space-lg">
            <div class="flex flex-col gap-space-md">
              <div class="flex items-center justify-between">
                <div class="w-12 h-12 rounded-lg bg-tertiary-fixed/30 flex items-center justify-center text-tertiary">
                  <span class="material-symbols-outlined text-[26px]">verified_user</span>
                </div>
                <span class="font-label-sm text-label-sm px-space-xs py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-semibold">Verified</span>
              </div>
              <div class="flex flex-col gap-space-xs">
                <h3 class="font-headline-sm text-headline-sm text-on-surface">Account Security</h3>
                <p class="font-body-sm text-body-sm text-on-surface-variant">Authentication & Verification status.</p>
              </div>

              <div class="flex flex-col gap-space-xs pt-space-xs">
                <div class="p-space-xs rounded bg-surface-container-low flex items-center justify-between">
                  <span class="font-body-sm text-body-sm text-on-surface font-semibold">Email Verification</span>
                  <span class="text-tertiary font-bold text-label-sm flex items-center gap-1">
                    <span class="material-symbols-outlined text-[16px]">check_circle</span> Verified
                  </span>
                </div>
                <div class="p-space-xs rounded bg-surface-container-low flex items-center justify-between">
                  <span class="font-body-sm text-body-sm text-on-surface font-semibold">Password Storage</span>
                  <span class="text-primary font-bold text-label-sm">Bcrypt Hashed</span>
                </div>
                <div class="p-space-xs rounded bg-surface-container-low flex items-center justify-between">
                  <span class="font-body-sm text-body-sm text-on-surface font-semibold">Auth Session</span>
                  <span class="text-secondary font-bold text-label-sm">JWT Bearer Token</span>
                </div>
              </div>
            </div>
            <button
              onClick={copyHealthId}
              class="h-12 w-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg rounded-lg flex items-center justify-center gap-space-xs transition-colors cursor-pointer"
            >
              <span class="material-symbols-outlined text-[18px]">content_copy</span>
              <span>Copy Health ID</span>
            </button>
          </div>

          {/* Card 3: Quick Info */}
          <div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container flex flex-col justify-between gap-space-lg">
            <div class="flex flex-col gap-space-md">
              <div class="flex items-center justify-between">
                <div class="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary">
                  <span class="material-symbols-outlined text-[26px]">medical_services</span>
                </div>
                <span class="font-label-sm text-label-sm px-space-xs py-0.5 rounded bg-surface-container text-on-surface-variant font-medium">Kiosk Ready</span>
              </div>
              <div class="flex flex-col gap-space-xs">
                <h3 class="font-headline-sm text-headline-sm text-on-surface">Outpatient Kiosk</h3>
                <p class="font-body-sm text-body-sm text-on-surface-variant">Connected to hospital receptionist kiosk.</p>
              </div>

              <div class="p-space-md rounded-lg bg-primary-container/10 border border-primary/20 text-on-surface flex flex-col gap-space-2xs">
                <span class="font-label-sm text-label-sm text-primary font-bold uppercase">Patient ID Card</span>
                <p class="font-body-sm text-body-sm text-on-surface-variant">
                  Show your Health ID <strong class="text-primary font-mono">{patient?.healthId}</strong> at any hospital MEDIGUARD AI terminal.
                </p>
              </div>
            </div>
            <Link
              to="/profile"
              class="h-12 w-full bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg rounded-lg flex items-center justify-center gap-space-xs transition-colors"
            >
              <span>View Full Health Profile</span>
            </Link>
          </div>
        </section>

        {/* FEATURE 1: MY HEALTH RECORDS VAULT */}
        <div id="my-health-records-vault">
          <HealthRecords healthId={patient?.healthId} />
        </div>

        {/* STEP 5: INTEROPERABILITY & ABDM INTEGRATION DASHBOARD */}
        <IntegrationStatusDashboard patientId={patient?._id} />

        {/* STEP 5: ABHA LINKING MODULE */}
        <AbhaLinkingView patient={patient} onUpdated={fetchDashboardData} />

        {/* FEATURE 3: MY HEALTH SUMMARY */}
        <HealthSummary healthId={patient?.healthId} />

        {/* FEATURE: PATIENT KIOSK MODE CARD */}
        <section class="bg-gradient-to-r from-secondary-container/40 via-surface-container-lowest to-primary-container/30 p-space-lg rounded-xl shadow-md border-2 border-secondary/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-space-lg">
          <div class="flex flex-col gap-space-xs max-w-2xl">
            <div class="flex items-center gap-space-xs text-secondary font-label-md text-label-md">
              <span class="material-symbols-outlined text-[24px]">touch_app</span>
              <span class="tracking-wide uppercase font-label-sm text-label-sm font-bold">OPD Touchscreen Kiosk</span>
            </div>
            <h2 class="font-headline-sm text-headline-sm text-on-surface font-black tracking-tight">
              LAUNCH PATIENT KIOSK MODE
            </h2>
            <p class="font-body-md text-body-md text-on-surface-variant">
              Dedicated touch-friendly, high-contrast kiosk experience for elderly and low-literacy patients with English, Hindi, and Bengali support.
            </p>
          </div>

          <Link
            to="/kiosk"
            class="px-space-xl h-14 bg-secondary text-on-secondary hover:bg-secondary-container font-title-lg text-title-lg rounded-xl shadow-lg flex items-center justify-center gap-space-sm transition-all duration-200 active:scale-95 group shrink-0"
          >
            <span class="material-symbols-outlined text-[24px]">play_circle</span>
            <span>Launch Kiosk Mode</span>
          </Link>
        </section>

        {/* FEATURE 4: SMART PATIENT INTAKE CARD */}
        <section class="bg-gradient-to-r from-primary-container/20 via-surface-container-lowest to-tertiary-container/20 p-space-lg rounded-xl shadow-sm border border-primary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-space-lg">
          <div class="flex flex-col gap-space-xs max-w-2xl">
            <div class="flex items-center gap-space-xs text-primary font-label-md text-label-md">
              <span class="material-symbols-outlined text-[20px]">assignment_turned_in</span>
              <span class="tracking-wide uppercase font-label-sm text-label-sm font-semibold">Intake Kiosk Module</span>
            </div>
            <h2 class="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
              SMART PATIENT INTAKE
            </h2>
            <p class="font-body-md text-body-md text-on-surface-variant">
              Your medical information organized for a faster consultation experience.
            </p>
          </div>

          <Link
            to="/smart-intake"
            class="px-space-xl h-12 bg-primary text-on-primary hover:bg-primary-container font-title text-title rounded-lg shadow-md flex items-center justify-center gap-space-xs transition-all duration-200 active:scale-95 group shrink-0"
          >
            <span class="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">open_in_new</span>
            <span>Open Smart Intake</span>
          </Link>
        </section>

        {/* NEW SECTION: DRUG–DRUG & DRUG–FOOD INTERACTION CHECKER */}
        <section class="bg-gradient-to-r from-primary-container/30 via-surface-container-lowest to-secondary-container/20 p-space-lg rounded-xl shadow-sm border border-primary/25 flex flex-col md:flex-row items-start md:items-center justify-between gap-space-lg">
          <div class="flex flex-col gap-space-xs max-w-2xl">
            <div class="flex items-center gap-space-xs text-primary font-label-md text-label-md">
              <span class="material-symbols-outlined text-[22px]">compare_arrows</span>
              <span class="tracking-wide uppercase font-label-sm text-label-sm font-bold">Clinical Safety Module</span>
            </div>
            <h2 class="font-headline-sm text-headline-sm text-on-surface font-extrabold tracking-tight">
              DRUG–DRUG & DRUG–FOOD INTERACTION CHECKER
            </h2>
            <p class="font-body-md text-body-md text-on-surface-variant">
              Check multi-medication and dietary safety in real time using Gemini AI pharmacological intelligence. Evaluate potential contraindications, severity levels, and clinical precautions.
            </p>
          </div>

          <Link
            to="/interactions"
            class="px-space-xl h-12 bg-primary text-on-primary hover:bg-primary-container font-title text-title rounded-lg shadow-md flex items-center justify-center gap-space-xs transition-all duration-200 active:scale-95 group shrink-0"
          >
            <span class="material-symbols-outlined text-[20px] group-hover:rotate-12 transition-transform">health_and_safety</span>
            <span>Check Interactions</span>
          </Link>
        </section>

        {/* NEW SECTION: DOCTOR CLINICAL SUMMARY */}
        <section class="bg-gradient-to-r from-secondary-container/30 via-surface-container-lowest to-primary-container/20 p-space-lg rounded-xl shadow-sm border border-secondary/25 flex flex-col md:flex-row items-start md:items-center justify-between gap-space-lg">
          <div class="flex flex-col gap-space-xs max-w-2xl">
            <div class="flex items-center gap-space-xs text-secondary font-label-md text-label-md">
              <span class="material-symbols-outlined text-[22px]">clinical_notes</span>
              <span class="tracking-wide uppercase font-label-sm text-label-sm font-bold">Physician Consultation Briefing</span>
            </div>
            <h2 class="font-headline-sm text-headline-sm text-on-surface font-extrabold tracking-tight">
              DOCTOR CLINICAL SUMMARY
            </h2>
            <p class="font-body-md text-body-md text-on-surface-variant">
              Comprehensive clinical consultation briefing organizing all available prescription records, diagnoses, lab investigations, safety alerts, and Gemini AI synthesis for the consulting doctor.
            </p>
          </div>

          <Link
            to="/doctor-summary"
            class="px-space-xl h-12 bg-secondary text-on-secondary hover:bg-secondary-container font-title text-title rounded-lg shadow-md flex items-center justify-center gap-space-xs transition-all duration-200 active:scale-95 group shrink-0"
          >
            <span class="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">assignment_ind</span>
            <span>Open Doctor Summary</span>
          </Link>
        </section>

        {/* FEATURE 3: PATIENT HEALTH TIMELINE */}
        <HealthTimeline user={patient} healthId={patient?.healthId} />

        {/* ABOUT MEDIGUARD AI & PLATFORM PROVENANCE */}
        <section class="bg-surface-container-lowest p-space-lg lg:p-space-xl rounded-xl border border-surface-container shadow-sm flex flex-col gap-space-md">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-sm border-b border-surface-container">
            <div class="flex items-center gap-space-sm">
              <div class="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
                <span class="material-symbols-outlined text-[24px]">shield</span>
              </div>
              <div>
                <h3 class="font-title text-title font-bold text-on-surface">About MEDIGUARD AI</h3>
                <p class="font-body-sm text-body-sm text-primary font-semibold">Smart Medication Safety System</p>
              </div>
            </div>
            <div class="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold border border-outline/20">
              <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span>Powered by MediKiosk</span>
            </div>
          </div>
          <p class="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            <strong>MEDIGUARD AI</strong> is an intelligent medication safety and patient intake platform. Built as an advanced safety extension powered by the <strong>MediKiosk</strong> platform, it provides real-time prescription OCR parsing, drug interaction checks, dosage verification, and seamless clinical history management.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-space-md pt-space-xs">
            <div class="p-space-sm rounded-lg bg-surface-container-low border border-surface-container flex items-start gap-space-xs">
              <span class="material-symbols-outlined text-primary text-[20px] mt-0.5">document_scanner</span>
              <div>
                <h4 class="font-label-md text-label-md font-bold text-on-surface">Prescription OCR</h4>
                <p class="font-body-sm text-body-sm text-on-surface-variant">Automated clinical extraction via Gemini Vision models.</p>
              </div>
            </div>
            <div class="p-space-sm rounded-lg bg-surface-container-low border border-surface-container flex items-start gap-space-xs">
              <span class="material-symbols-outlined text-primary text-[20px] mt-0.5">health_and_safety</span>
              <div>
                <h4 class="font-label-md text-label-md font-bold text-on-surface">Medication Safety</h4>
                <p class="font-body-sm text-body-sm text-on-surface-variant">Dosage guidance, allergy alerts, and drug interaction safeguards.</p>
              </div>
            </div>
            <div class="p-space-sm rounded-lg bg-surface-container-low border border-surface-container flex items-start gap-space-xs">
              <span class="material-symbols-outlined text-primary text-[20px] mt-0.5">hub</span>
              <div>
                <h4 class="font-label-md text-label-md font-bold text-on-surface">Interoperable EHR</h4>
                <p class="font-body-sm text-body-sm text-on-surface-variant">ABDM and FHIR R4 standard compliance powered by MediKiosk.</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
