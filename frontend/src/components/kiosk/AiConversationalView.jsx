import React, { useState, useEffect, useRef } from 'react';
import { voiceInputService } from '../../services/voiceInputService';
import { speechOutputService } from '../../services/speechOutputService';

export default function AiConversationalView({
  lang = 'en',
  sessionId,
  currentQuestion,
  currentSection,
  suggestedOptions = [],
  extractedInformation = {},
  isRedFlag = false,
  redFlags = [],
  onSendMessage,
  loading = false,
  apiError = null,
  onSwitchToGuided,
  onReviewAndSubmit
}) {
  const [textInput, setTextInput] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'got_it' | 'error'
  const [interimText, setInterimText] = useState('');
  const [voiceErrorMsg, setVoiceErrorMsg] = useState('');
  const [isTtsSpeaking, setIsTtsSpeaking] = useState(false);
  const [showExtractedPreview, setShowExtractedPreview] = useState(false);

  const inputRef = useRef(null);

  // Auto-speak question when question changes if TTS is supported
  useEffect(() => {
    if (currentQuestion) {
      handleSpeakQuestion();
    }
    return () => {
      speechOutputService.stop();
      voiceInputService.stop();
    };
  }, [currentQuestion, lang]);

  const handleSpeakQuestion = () => {
    if (!currentQuestion) return;
    speechOutputService.speak(currentQuestion, lang, {
      onStart: () => setIsTtsSpeaking(true),
      onEnd: () => setIsTtsSpeaking(false),
      onError: () => setIsTtsSpeaking(false)
    });
  };

  const handleStopSpeech = () => {
    speechOutputService.stop();
    setIsTtsSpeaking(false);
  };

  // Handle Voice Recording
  const handleToggleVoice = () => {
    if (voiceStatus === 'listening') {
      voiceInputService.stop();
      setVoiceStatus('idle');
      return;
    }

    setVoiceErrorMsg('');
    handleStopSpeech(); // Stop TTS while recording

    voiceInputService.start(lang, {
      onResult: (finalText) => {
        setVoiceStatus('got_it');
        setTextInput(finalText);
        setTimeout(() => {
          setVoiceStatus('idle');
          handleSend(finalText, 'voice');
        }, 600);
      },
      onError: (friendlyMsg) => {
        setVoiceStatus('error');
        setVoiceErrorMsg(friendlyMsg);
      },
      onStateChange: (state, text = '') => {
        setVoiceStatus(state);
        if (state === 'listening') {
          setInterimText(text);
        }
      }
    });
  };

  const handleSend = (textToSend = textInput, inputMethod = 'touch') => {
    const message = (textToSend || textInput).trim();
    if (!message || loading) return;

    handleStopSpeech();
    voiceInputService.stop();
    setVoiceStatus('idle');
    setInterimText('');
    setVoiceErrorMsg('');

    onSendMessage(message, inputMethod);
    setTextInput('');
  };

  // Section titles translation map
  const SECTION_TITLES = {
    chief_complaint: { en: 'Chief Complaint', hi: 'मुख्य शिकायत', bn: 'প্রধান সমস্যা' },
    hpi: { en: 'History of Present Illness', hi: 'वर्तमान बीमारी का इतिहास', bn: 'বর্তমান রোগের ইতিহাস' },
    past_medical: { en: 'Past Medical History', hi: 'पुराना चिकित्सा इतिहास', bn: 'পূর্ববর্তী চিকিৎসার ইতিহাস' },
    past_surgical: { en: 'Past Surgical History', hi: 'सर्जरी का इतिहास', bn: 'অস্ত্রোপচারের ইতিহাস' },
    current_meds: { en: 'Current Medications', hi: 'वर्तमान दवाएं', bn: 'বর্তমান ওষুধপত্র' },
    drug_allergies: { en: 'Drug Allergies', hi: 'दवा एलर्जी', bn: 'ওষুধের অ্যালার্জি' },
    family_history: { en: 'Family History', hi: 'पारिवारिक इतिहास', bn: 'পারিবারিক ইতিহাস' },
    personal_history: { en: 'Personal & Lifestyle', hi: 'व्यक्तिगत इतिहास', bn: 'ব্যক্তিগত ইতিহাস' },
    diet: { en: 'Diet History', hi: 'आहार इतिहास', bn: 'খাদ্যাভ্যাস' },
    sleep: { en: 'Sleep History', hi: 'नींद का इतिहास', bn: 'ঘুমের ইতিহাস' },
    substance_use: { en: 'Substance Use', hi: 'पदार्थ का उपयोग', bn: 'নেশাজাতীয় ব্যবহার' },
    ros: { en: 'Review of Systems', hi: 'शारीरिक प्रणाली समीक्षा', bn: 'শারীরিক পরীক্ষা' },
    previous_investigations: { en: 'Previous Investigations', hi: 'पिछली जांचें', bn: 'পূর্ববর্তী পরীক্ষা' },
    previous_diagnoses: { en: 'Previous Diagnoses', hi: 'पिछला निदान', bn: 'পূর্ববর্তী ডায়াগনোসিস' },
    additional_notes: { en: 'Additional Information', hi: 'अतिरिक्त जानकारी', bn: 'অতিরিক্ত তথ্য' }
  };

  const sectionName = (SECTION_TITLES[currentSection]?.[lang] || SECTION_TITLES[currentSection]?.en || currentSection || 'Clinical Intake').toUpperCase();

  return (
    <div class="flex flex-col items-center gap-space-lg w-full max-w-4xl mx-auto my-auto py-space-sm select-none">
      
      {/* 🚨 RED FLAG EMERGENCY TRIAGE ALERT BANNER */}
      {isRedFlag && (
        <div class="w-full bg-error-container border-4 border-error rounded-3xl p-space-lg shadow-2xl animate-bounce flex flex-col sm:flex-row items-center gap-space-md text-on-error-container">
          <div class="w-16 h-16 rounded-2xl bg-error text-on-error flex items-center justify-center shrink-0 shadow-lg">
            <span class="material-symbols-outlined text-[44px]">warning</span>
          </div>
          <div class="flex flex-col gap-space-2xs text-center sm:text-left">
            <span class="font-headline-sm text-headline-sm font-black text-error uppercase tracking-wide">
              ⚠️ Urgent Triage Notice
            </span>
            <p class="font-title-lg text-title-lg font-bold leading-snug">
              Your reported symptoms may require urgent medical attention. Please inform the healthcare staff or clinic nurse immediately.
            </p>
            <span class="font-label-sm text-label-sm font-medium opacity-90">
              * Note: MediKiosk does not diagnose diseases. Please wait for healthcare staff to assist you.
            </span>
          </div>
        </div>
      )}

      {/* API ERROR / GEMINI TEMPORARY FAILURE FALLBACK BANNER */}
      {apiError && (
        <div class="w-full bg-warning-container/30 border-2 border-warning/60 rounded-2xl p-space-md flex items-center justify-between gap-space-md">
          <div class="flex items-center gap-space-xs text-on-surface">
            <span class="material-symbols-outlined text-warning text-[28px]">error_outline</span>
            <p class="font-title-md text-title-md font-bold">{apiError}</p>
          </div>
          <button
            type="button"
            onClick={() => handleSend(textInput || 'Retry', 'touch')}
            class="px-space-md py-2 bg-primary text-on-primary font-title-sm text-title-sm font-bold rounded-xl shadow hover:bg-primary-container"
          >
            Retry
          </button>
        </div>
      )}

      {/* ACTIVE CLINICAL SECTION BADGE */}
      <div class="flex items-center justify-between w-full px-space-xs">
        <div class="flex items-center gap-space-xs px-space-md py-1.5 rounded-full bg-primary-container/40 text-primary font-title-md text-title-md font-black border border-primary/20">
          <span class="material-symbols-outlined text-[20px]">clinical_notes</span>
          <span>{sectionName}</span>
        </div>

        <button
          type="button"
          onClick={() => setShowExtractedPreview(!showExtractedPreview)}
          class="px-space-md py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-title-sm text-title-sm font-bold flex items-center gap-1 border border-surface-container transition-colors"
        >
          <span class="material-symbols-outlined text-[18px]">fact_check</span>
          <span>{showExtractedPreview ? 'Hide Details' : 'View Extracted Data'}</span>
        </button>
      </div>

      {/* EXTRACTED CLINICAL SUMMARY PREVIEW DRAWER */}
      {showExtractedPreview && (
        <div class="w-full bg-surface-container-lowest border-2 border-primary/30 rounded-3xl p-space-lg shadow-xl flex flex-col gap-space-xs animate-fade-in text-left">
          <h3 class="font-title-lg text-title-lg font-black text-primary border-b border-surface-container pb-space-2xs uppercase">
            Extracted Clinical Data (Live Summary)
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-space-sm pt-space-xs max-h-48 overflow-y-auto">
            {Object.keys(extractedInformation).length === 0 ? (
              <p class="font-body-sm text-body-sm text-on-surface-variant italic">No clinical information extracted yet. Answer the question below to begin.</p>
            ) : (
              Object.entries(extractedInformation).map(([key, val]) => (
                <div key={key} class="flex flex-col bg-surface-container-low p-space-xs rounded-xl border border-surface-container">
                  <span class="font-label-xs text-label-xs font-bold uppercase text-on-surface-variant">{key.replace(/_/g, ' ')}</span>
                  <span class="font-body-sm text-body-sm font-bold text-on-surface">
                    {Array.isArray(val) ? val.join(', ') : typeof val === 'object' ? JSON.stringify(val) : String(val)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MAIN QUESTION CARD */}
      <div class="w-full bg-surface-container-lowest border-3 border-surface-container rounded-3xl p-space-xl shadow-xl flex flex-col items-center text-center gap-space-md relative">
        
        {/* TTS Listen Button (🔊 Listen / Replay) */}
        <div class="flex items-center justify-between w-full border-b border-surface-container pb-space-xs">
          <span class="font-title-md text-title-md font-bold text-on-surface-variant flex items-center gap-1">
            <span class="material-symbols-outlined text-primary text-[22px]">smart_toy</span>
            <span>MediKiosk Assistant</span>
          </span>

          <button
            type="button"
            onClick={isTtsSpeaking ? handleStopSpeech : handleSpeakQuestion}
            class={`px-space-md py-2 rounded-2xl font-title-sm text-title-sm font-bold flex items-center gap- space-xs transition-all active:scale-95 shadow-md ${
              isTtsSpeaking
                ? 'bg-tertiary text-on-tertiary animate-pulse'
                : 'bg-secondary-container hover:bg-secondary-container/80 text-on-secondary-container border border-secondary/20'
            }`}
            title="Read question aloud"
          >
            <span class="material-symbols-outlined text-[22px]">
              {isTtsSpeaking ? 'volume_up' : 'campaign'}
            </span>
            <span>{isTtsSpeaking ? 'Speaking...' : '🔊 Listen'}</span>
          </button>
        </div>

        {/* Question Text */}
        <h1 class="font-display-md text-display-md text-on-surface font-black tracking-tight leading-tight py-space-xs">
          {currentQuestion || 'What problem or symptom is bringing you in today?'}
        </h1>

        {/* VOICE INPUT STATUS INDICATOR BANNER */}
        {voiceStatus === 'listening' && (
          <div class="flex items-center gap-space-sm px-space-lg py-space-xs rounded-full bg-error-container text-error font-title-lg text-title-lg font-extrabold animate-pulse shadow-md">
            <span class="w-3.5 h-3.5 rounded-full bg-error animate-ping"></span>
            <span>Listening... Speak now</span>
            {interimText && <span class="font-normal italic text-body-md opacity-90">"{interimText}"</span>}
          </div>
        )}

        {voiceStatus === 'processing' && (
          <div class="flex items-center gap-space-sm px-space-lg py-space-xs rounded-full bg-primary-container text-primary font-title-lg text-title-lg font-extrabold animate-pulse shadow-md">
            <div class="w-5 h-5 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span>Processing response with Gemini AI...</span>
          </div>
        )}

        {voiceStatus === 'got_it' && (
          <div class="flex items-center gap-space-xs px-space-lg py-space-xs rounded-full bg-tertiary-container text-tertiary font-title-lg text-title-lg font-extrabold shadow-md">
            <span class="material-symbols-outlined text-[24px]">check_circle</span>
            <span>Got it!</span>
          </div>
        )}

        {voiceErrorMsg && (
          <p class="font-title-sm text-title-sm text-error font-bold pt-1">{voiceErrorMsg}</p>
        )}
      </div>

      {/* DYNAMIC SUGGESTED TOUCH OPTIONS PILLS */}
      {suggestedOptions && suggestedOptions.length > 0 && (
        <div class="flex flex-wrap items-center justify-center gap-space-sm w-full py-space-2xs">
          {suggestedOptions.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(opt, 'touch')}
              disabled={loading}
              class="min-h-[56px] px-space-xl py-space-xs bg-surface-container-lowest hover:bg-primary hover:text-on-primary text-on-surface font-headline-sm text-headline-sm font-bold rounded-2xl border-2 border-surface-container shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* INTERACTIVE VOICE & TOUCH INPUT CONTROLS */}
      <div class="w-full bg-surface-container-lowest border-3 border-surface-container rounded-3xl p-space-lg shadow-xl flex flex-col sm:flex-row items-center gap-space-md">
        
        {/* BIG MIC BUTTON */}
        <button
          type="button"
          onClick={handleToggleVoice}
          disabled={loading}
          class={`w-20 h-20 shrink-0 rounded-3xl font-bold flex flex-col items-center justify-center shadow-xl transition-all active:scale-95 cursor-pointer ${
            voiceStatus === 'listening'
              ? 'bg-error text-on-error ring-8 ring-error/30 animate-pulse'
              : 'bg-primary hover:bg-primary-container text-on-primary ring-4 ring-primary/20'
          }`}
          title={voiceStatus === 'listening' ? 'Stop Listening' : 'Speak your answer'}
        >
          <span class="material-symbols-outlined text-[44px]">
            {voiceStatus === 'listening' ? 'mic_off' : 'mic'}
          </span>
        </button>

        {/* TOUCH TEXT INPUT BOX */}
        <div class="flex-grow flex items-center gap-space-xs w-full">
          <textarea
            ref={inputRef}
            rows="2"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(textInput, 'text');
              }
            }}
            placeholder={
              lang === 'hi'
                ? 'बोले (माइक्रोफोन) या यहाँ टाइप करें...'
                : lang === 'bn'
                ? 'কথা বলুন (মাইক্রোফোন) অথবা টাইপ করুন...'
                : 'Speak (Microphone) or type your answer here...'
            }
            class="w-full p-space-md rounded-2xl bg-surface-container-low border-2 border-surface-container font-headline-sm text-headline-sm text-on-surface focus:outline-none focus:border-primary transition-colors resize-none"
          ></textarea>

          <button
            type="button"
            onClick={() => handleSend(textInput, 'text')}
            disabled={loading || !textInput.trim()}
            class="h-16 px-space-xl bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-headline-sm font-bold rounded-2xl shadow-lg flex items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-40 cursor-pointer shrink-0"
          >
            {loading ? (
              <div class="w-6 h-6 border-3 border-on-primary border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Send</span>
                <span class="material-symbols-outlined text-[28px]">send</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div class="flex items-center justify-between w-full pt-space-xs">
        {onSwitchToGuided && (
          <button
            type="button"
            onClick={onSwitchToGuided}
            class="px-space-md py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-title-sm text-title-sm font-bold flex items-center gap-space-2xs transition-colors"
          >
            <span class="material-symbols-outlined text-[20px]">touch_app</span>
            <span>Switch to Touch Form</span>
          </button>
        )}

        <button
          type="button"
          onClick={onReviewAndSubmit}
          class="px-space-xl py-3 rounded-2xl bg-tertiary hover:bg-tertiary-container text-on-tertiary font-headline-sm text-headline-sm font-black shadow-lg flex items-center gap-space-xs transition-all active:scale-95 cursor-pointer ml-auto"
        >
          <span>Review & Submit Intake</span>
          <span class="material-symbols-outlined text-[24px]">task_alt</span>
        </button>
      </div>

    </div>
  );
}
