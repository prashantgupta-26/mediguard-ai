import React, { useState } from 'react';
import { translations } from '../../kiosk/translations';

export default function KioskControls({
  lang = 'en',
  onBack,
  onNext,
  onSkip,
  onRepeat,
  canGoBack = true,
  isLastQuestion = false,
  disableNext = false
}) {
  const t = translations[lang] || translations.en;
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleRepeatClick = () => {
    if (onRepeat) {
      onRepeat();
    }
    // Web Speech API fallback for audio repeat button
    if ('speechSynthesis' in window) {
      try {
        const speakText = onRepeat?.() || '';
        if (speakText) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(speakText);
          if (lang === 'hi') utterance.lang = 'hi-IN';
          else if (lang === 'bn') utterance.lang = 'bn-IN';
          else utterance.lang = 'en-US';

          utterance.onstart = () => setIsSpeaking(true);
          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = () => setIsSpeaking(false);

          window.speechSynthesis.speak(utterance);
        }
      } catch (err) {
        console.warn('Speech synthesis unavailable:', err);
      }
    }
  };

  return (
    <div class="w-full bg-surface-container-lowest border-t-2 border-surface-container px-space-md py-space-md flex flex-wrap items-center justify-between gap-space-md shadow-lg sticky bottom-0 z-40">
      {/* Left Group: Back & Repeat Question */}
      <div class="flex items-center gap-space-sm sm:gap-space-md w-full sm:w-auto">
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          class={`min-h-[64px] min-w-[130px] px-space-lg rounded-2xl font-title text-title font-bold flex items-center justify-center gap-space-xs transition-all active:scale-95 shadow-md ${
            canGoBack
              ? 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface border-2 border-surface-container'
              : 'bg-surface-container text-on-surface-variant/40 border border-transparent cursor-not-allowed'
          }`}
          aria-label={t.backBtn}
        >
          <span class="material-symbols-outlined text-[28px]">arrow_back</span>
          <span>{t.backBtn}</span>
        </button>

        <button
          type="button"
          onClick={handleRepeatClick}
          class={`min-h-[64px] px-space-lg rounded-2xl font-title text-title font-bold flex items-center justify-center gap-space-xs transition-all active:scale-95 shadow-md ${
            isSpeaking
              ? 'bg-tertiary text-on-tertiary animate-pulse'
              : 'bg-secondary-container hover:bg-secondary-container/80 text-on-secondary-container border-2 border-secondary/20'
          }`}
          aria-label={t.repeatBtn}
        >
          <span class="material-symbols-outlined text-[28px]">
            {isSpeaking ? 'volume_up' : 'campaign'}
          </span>
          <span>{t.repeatBtn}</span>
        </button>
      </div>

      {/* Right Group: Skip & Next / Submit */}
      <div class="flex items-center gap-space-sm sm:gap-space-md w-full sm:w-auto justify-end">
        {!isLastQuestion && onSkip && (
          <button
            type="button"
            onClick={onSkip}
            class="min-h-[64px] px-space-md sm:px-space-lg rounded-2xl font-title text-title font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface-variant border-2 border-surface-container flex items-center justify-center gap-space-2xs transition-all active:scale-95"
            aria-label={t.skipBtn}
          >
            <span>{t.skipBtn}</span>
            <span class="material-symbols-outlined text-[24px]">double_arrow</span>
          </button>
        )}

        <button
          type="button"
          onClick={onNext}
          disabled={disableNext}
          class={`min-h-[64px] min-w-[160px] px-space-xl rounded-2xl font-headline text-headline font-bold flex items-center justify-center gap-space-xs transition-all active:scale-95 shadow-lg ${
            disableNext
              ? 'bg-surface-container-highest text-on-surface-variant/50 cursor-not-allowed'
              : 'bg-primary hover:bg-primary-container text-on-primary ring-4 ring-primary/20'
          }`}
          aria-label={isLastQuestion ? t.submitBtn : t.nextBtn}
        >
          <span>{isLastQuestion ? t.submitBtn : t.nextBtn}</span>
          <span class="material-symbols-outlined text-[32px]">
            {isLastQuestion ? 'check_circle' : 'arrow_forward'}
          </span>
        </button>
      </div>
    </div>
  );
}
