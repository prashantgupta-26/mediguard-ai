import React from 'react';
import { translations } from '../../kiosk/translations';
import { KIOSK_QUESTIONS } from '../../kiosk/questions';

export default function KioskReview({
  lang = 'en',
  answers = {},
  patientInfo = null,
  onEditSection,
  onSubmit,
  submitting = false
}) {
  const t = translations[lang] || translations.en;

  // Group questions by section
  const sectionsMap = {};
  KIOSK_QUESTIONS.forEach((q) => {
    if (!sectionsMap[q.section]) {
      sectionsMap[q.section] = [];
    }
    sectionsMap[q.section].push(q);
  });

  const getAnswerDisplay = (question, rawVal) => {
    if (!rawVal || (typeof rawVal === 'object' && Object.keys(rawVal).length === 0)) {
      return <span class="text-on-surface-variant/50 italic text-title">Skipped / Not provided</span>;
    }

    if (question.type === 'single_choice' || question.type === 'multiple_choice' || question.type === 'body_location') {
      const selectedIds = Array.isArray(rawVal) ? rawVal : [rawVal];
      const selectedLabels = selectedIds.map((id) => {
        const found = question.options?.find((o) => o.id === id);
        return found ? found.label[lang] || found.label.en : id;
      });
      return (
        <div class="flex flex-wrap gap-2">
          {selectedLabels.map((lbl, i) => (
            <span key={i} class="px-3 py-1 rounded-xl bg-primary-container/30 text-on-primary-container font-title text-title font-semibold">
              {lbl}
            </span>
          ))}
        </div>
      );
    }

    if (question.type === 'duration_picker') {
      if (typeof rawVal === 'object') {
        return (
          <span class="font-title text-headline font-bold text-primary">
            {rawVal.count} {rawVal.unit}
          </span>
        );
      }
      return <span class="font-title text-headline font-bold text-primary">{String(rawVal)}</span>;
    }

    if (question.type === 'severity_scale') {
      const num = Number(rawVal) || 5;
      return (
        <div class="flex items-center gap-3">
          <span class="px-4 py-1.5 rounded-xl bg-error-container text-on-error-container font-headline text-headline font-bold">
            {num} / 10
          </span>
          <span class="font-body-md text-on-surface-variant">
            {num <= 3 ? 'Mild' : num <= 6 ? 'Moderate' : 'Severe'}
          </span>
        </div>
      );
    }

    if (question.type === 'yes_no_with_text') {
      if (typeof rawVal === 'object') {
        return (
          <div class="flex flex-col gap-1">
            <span className={`px-3 py-1 rounded-lg w-fit font-title text-title font-bold ${rawVal.hasValue ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
              {rawVal.hasValue ? 'Yes' : 'No'}
            </span>
            {rawVal.details && (
              <span class="font-body-lg text-on-surface bg-surface-container p-2 rounded-lg mt-1 border border-surface-container-high">
                {rawVal.details}
              </span>
            )}
          </div>
        );
      }
    }

    return <span class="font-title text-title text-on-surface font-semibold">{String(rawVal)}</span>;
  };

  return (
    <div class="w-full max-w-5xl mx-auto px-space-md py-space-lg flex flex-col gap-space-xl">
      {/* Header Title */}
      <div class="flex flex-col gap-space-2xs text-center sm:text-left">
        <div class="inline-flex items-center gap-space-xs text-primary font-label-md text-label-md justify-center sm:justify-start">
          <span class="material-symbols-outlined text-[24px]">fact_check</span>
          <span class="tracking-wide uppercase font-title text-title font-bold">MediKiosk Summary Review</span>
        </div>
        <h1 class="font-display-md text-display-md text-on-surface font-extrabold tracking-tight">
          {t.reviewTitle}
        </h1>
        <p class="font-body-lg text-body-lg text-on-surface-variant">
          {t.reviewSubtitle}
        </p>
      </div>

      {/* Mandatory Physician Review Banner */}
      <div class="bg-primary-container/20 border-2 border-primary/40 rounded-3xl p-space-lg shadow-md flex flex-col sm:flex-row items-start sm:items-center gap-space-md">
        <div class="w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-sm">
          <span class="material-symbols-outlined text-[36px]">medical_services</span>
        </div>
        <div class="flex flex-col gap-space-2xs">
          <h2 class="font-headline-sm text-headline-sm text-on-surface font-extrabold">
            {t.physicianDisclaimer}
          </h2>
          <p class="font-body-md text-body-md text-on-surface-variant">
            {t.physicianDisclaimerSub}
          </p>
        </div>
      </div>

      {/* Patient Header Details if linked */}
      {patientInfo && (
        <div class="bg-surface-container-lowest border-2 border-surface-container rounded-2xl p-space-md flex flex-wrap items-center justify-between gap-space-md">
          <div class="flex items-center gap-space-md">
            <div class="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container font-headline text-headline font-bold flex items-center justify-center">
              {patientInfo.name ? patientInfo.name.charAt(0).toUpperCase() : 'P'}
            </div>
            <div class="flex flex-col">
              <span class="font-title-lg text-title-lg text-on-surface font-bold">{patientInfo.name || 'Guest Patient'}</span>
              {patientInfo.healthId && (
                <span class="font-mono font-bold text-primary text-body-md">Health ID: {patientInfo.healthId}</span>
              )}
            </div>
          </div>
          <span class="px-space-md py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-title text-title font-bold">
            Intake Session Active
          </span>
        </div>
      )}

      {/* Sections Summary Grid */}
      <div class="flex flex-col gap-space-lg">
        {Object.entries(sectionsMap).map(([sectionKey, qList]) => (
          <div
            key={sectionKey}
            class="bg-surface-container-lowest border-2 border-surface-container rounded-3xl p-space-lg shadow-sm flex flex-col gap-space-md hover:border-primary/30 transition-colors"
          >
            <div class="flex items-center justify-between border-b-2 border-surface-container pb-space-xs">
              <div class="flex items-center gap-space-xs text-primary">
                <span class="material-symbols-outlined text-[28px]">folder</span>
                <h3 class="font-headline-sm text-headline-sm text-on-surface font-extrabold uppercase">
                  {t.sections[sectionKey] || sectionKey}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onEditSection && onEditSection(sectionKey)}
                class="px-space-md py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary font-title text-title font-bold flex items-center gap-1 transition-all active:scale-95"
              >
                <span class="material-symbols-outlined text-[20px]">edit</span>
                <span>{t.editSectionBtn}</span>
              </button>
            </div>

            <div class="flex flex-col gap-space-md">
              {qList.map((q) => (
                <div key={q.id} class="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs p-space-sm bg-surface-container-low rounded-2xl">
                  <span class="font-title-md text-title-md text-on-surface-variant font-medium max-w-md">
                    {q.text[lang] || q.text.en}
                  </span>
                  <div class="sm:text-right shrink-0">
                    {getAnswerDisplay(q, answers[q.id])}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Action Box */}
      <div class="bg-surface-container-lowest border-2 border-surface-container rounded-3xl p-space-xl shadow-lg flex flex-col items-center text-center gap-space-md">
        <h3 class="font-headline-md text-headline-md text-on-surface font-extrabold">
          Ready to submit your health history?
        </h3>
        <p class="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
          Once submitted, your data will be available at the physician consultation desk.
        </p>

        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          class="w-full sm:w-auto min-h-[72px] px-space-2xl bg-primary hover:bg-primary-container text-on-primary font-display-sm text-display-sm font-bold rounded-2xl shadow-xl flex items-center justify-center gap-space-md transition-all active:scale-95 disabled:opacity-50 ring-4 ring-primary/20 cursor-pointer"
        >
          {submitting ? (
            <>
              <div class="w-8 h-8 border-4 border-on-primary border-t-transparent rounded-full animate-spin"></div>
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <span class="material-symbols-outlined text-[36px]">send</span>
              <span>{t.submitBtn}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
