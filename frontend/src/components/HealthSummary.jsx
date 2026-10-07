import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

export default function HealthSummary({ healthId }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHealthSummary();
  }, [healthId]);

  const fetchHealthSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiRequest('/patient/health-summary', 'GET');
      if (data.success && data.summary) {
        setSummary(data.summary);
      } else {
        setError('Unable to load your health summary.');
      }
    } catch (err) {
      console.error('Error fetching health summary:', err);
      setError(err.message || 'Unable to load your health summary.');
    } finally {
      setLoading(false);
    }
  };

  const renderValue = (val) => {
    if (!val || val === 'null' || val === 'undefined') {
      return <span class="text-on-surface-variant/60 italic font-body-sm text-body-sm">Not provided</span>;
    }
    return <span class="font-body-sm text-body-sm text-on-surface font-medium">{val}</span>;
  };

  if (loading) {
    return (
      <section class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container flex flex-col gap-space-md">
        <div class="flex items-center gap-space-sm">
          <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span class="font-body-md text-on-surface-variant">Loading your health summary...</span>
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
          onClick={fetchHealthSummary}
          class="px-space-md py-space-xs bg-error text-on-error hover:opacity-90 font-label-md text-label-md rounded-lg transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </section>
    );
  }

  const { patient, healthInformation, records } = summary || {};

  return (
    <section class="flex flex-col gap-space-md">
      <div class="flex flex-col gap-space-2xs">
        <div class="flex items-center gap-space-xs text-primary font-label-md text-label-md">
          <span class="material-symbols-outlined text-[20px]">analytics</span>
          <span class="tracking-wide uppercase font-label-sm text-label-sm font-semibold">Structured Patient Record</span>
        </div>
        <h2 class="font-headline-md text-headline-md text-on-surface tracking-tight">
          MY HEALTH SUMMARY
        </h2>
        <p class="font-body-md text-body-md text-on-surface-variant">
          Structured medical summary compiled from your verified health records.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        {/* Card 1: Patient Details */}
        <div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container flex flex-col justify-between gap-space-md">
          <div class="flex flex-col gap-space-sm">
            <div class="flex items-center justify-between border-b border-surface-container pb-space-xs">
              <div class="flex items-center gap-space-xs text-primary">
                <span class="material-symbols-outlined text-[22px]">badge</span>
                <h3 class="font-title-md text-title-md text-on-surface font-semibold">PATIENT</h3>
              </div>
              <span class="font-mono font-bold text-label-sm px-space-xs py-0.5 rounded bg-primary-container/30 text-primary">
                {patient?.healthId || 'N/A'}
              </span>
            </div>

            <div class="flex flex-col gap-space-xs pt-space-xs">
              <div class="flex justify-between items-center py-1">
                <span class="font-label-sm text-label-sm text-on-surface-variant">Name</span>
                <span class="font-title-sm text-title-sm text-on-surface font-bold tracking-tight">{patient?.name || 'N/A'}</span>
              </div>
              <div class="flex justify-between items-center py-1 border-t border-surface-container-low">
                <span class="font-label-sm text-label-sm text-on-surface-variant">Health ID</span>
                <span class="font-mono text-label-sm font-bold text-primary">{patient?.healthId || 'N/A'}</span>
              </div>
              <div class="flex justify-between items-center py-1 border-t border-surface-container-low">
                <span class="font-label-sm text-label-sm text-on-surface-variant">Gender</span>
                <span class="font-body-sm text-body-sm text-on-surface font-medium">{patient?.gender || 'N/A'}</span>
              </div>
              <div class="flex justify-between items-center py-1 border-t border-surface-container-low">
                <span class="font-label-sm text-label-sm text-on-surface-variant">Date of Birth</span>
                <span class="font-body-sm text-body-sm text-on-surface font-medium">{patient?.dateOfBirth || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Health Information */}
        <div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container flex flex-col justify-between gap-space-md">
          <div class="flex flex-col gap-space-sm">
            <div class="flex items-center justify-between border-b border-surface-container pb-space-xs">
              <div class="flex items-center gap-space-xs text-secondary">
                <span class="material-symbols-outlined text-[22px]">health_metrics</span>
                <h3 class="font-title-md text-title-md text-on-surface font-semibold">HEALTH INFORMATION</h3>
              </div>
            </div>

            <div class="flex flex-col gap-space-xs pt-space-xs">
              <div class="flex justify-between items-center py-1">
                <span class="font-label-sm text-label-sm text-on-surface-variant">Blood Group</span>
                {renderValue(healthInformation?.bloodGroup)}
              </div>
              <div class="flex justify-between items-center py-1 border-t border-surface-container-low">
                <span class="font-label-sm text-label-sm text-on-surface-variant">Height</span>
                {renderValue(healthInformation?.height)}
              </div>
              <div class="flex justify-between items-center py-1 border-t border-surface-container-low">
                <span class="font-label-sm text-label-sm text-on-surface-variant">Weight</span>
                {renderValue(healthInformation?.weight)}
              </div>
              <div class="flex justify-between items-center py-1 border-t border-surface-container-low">
                <span class="font-label-sm text-label-sm text-on-surface-variant">Allergies</span>
                {renderValue(healthInformation?.allergies)}
              </div>
              <div class="flex justify-between items-center py-1 border-t border-surface-container-low">
                <span class="font-label-sm text-label-sm text-on-surface-variant">Existing Conditions</span>
                {renderValue(healthInformation?.existingConditions)}
              </div>
              <div class="flex justify-between items-center py-1 border-t border-surface-container-low">
                <span class="font-label-sm text-label-sm text-on-surface-variant">Current Medications</span>
                {renderValue(healthInformation?.currentMedications)}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Medical Records Statistics */}
        <div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container flex flex-col justify-between gap-space-md">
          <div class="flex flex-col gap-space-sm">
            <div class="flex items-center justify-between border-b border-surface-container pb-space-xs">
              <div class="flex items-center gap-space-xs text-tertiary">
                <span class="material-symbols-outlined text-[22px]">folder_special</span>
                <h3 class="font-title-md text-title-md text-on-surface font-semibold">MEDICAL RECORDS</h3>
              </div>
            </div>

            <div class="flex flex-col gap-space-xs pt-space-xs">
              <div class="flex justify-between items-center py-2">
                <span class="font-label-sm text-label-sm text-on-surface-variant">Total Documents</span>
                <span class="px-space-xs py-0.5 rounded-full bg-surface-container-high text-on-surface font-title-sm text-title-sm font-bold">
                  {records?.totalDocuments ?? 0}
                </span>
              </div>
              <div class="flex justify-between items-center py-2 border-t border-surface-container-low">
                <span class="font-label-sm text-label-sm text-on-surface-variant">AI Analyzed</span>
                <span class="px-space-xs py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-title-sm text-title-sm font-bold">
                  {records?.analyzedDocuments ?? 0}
                </span>
              </div>
              <div class="flex justify-between items-center py-2 border-t border-surface-container-low">
                <span class="font-label-sm text-label-sm text-on-surface-variant">Latest Report</span>
                <span class="font-label-md text-label-md text-primary font-bold">
                  {records?.latestReportDate || 'Not provided'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
