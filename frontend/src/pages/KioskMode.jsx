import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { LANGUAGES, translations } from '../kiosk/translations';
import { KIOSK_QUESTIONS } from '../kiosk/questions';
import KioskControls from '../components/kiosk/KioskControls';
import KioskReview from '../components/kiosk/KioskReview';
import AiConversationalView from '../components/kiosk/AiConversationalView';
import AyushIntakeView from '../components/kiosk/AyushIntakeView';
import PatientSummaryReview from '../components/PatientSummaryReview';
import ClinicalSummaryView from '../components/ClinicalSummaryView';
import LowLiteracyConsentView from '../components/kiosk/LowLiteracyConsentView';
import ExternalSharingModal from '../components/ExternalSharingModal';
import { generateClinicalSummary } from '../services/clinicalSummaryService';

const INACTIVITY_WARNING_MS = 2 * 60 * 1000; // 2 minutes idle triggers warning modal
const INACTIVITY_COUNTDOWN_SEC = 30; // 30 seconds countdown before auto-reset

export default function KioskMode() {
  const navigate = useNavigate();

  // Kiosk Flow Steps: 'welcome' | 'language' | 'consent' | 'identification' | 'questions' | 'ayush' | 'generating_summary' | 'patient_review' | 'physician_summary' | 'review' | 'finish'
  const [step, setStep] = useState('welcome');

  // Step 4 & Step 5 State
  const [clinicalSummaryDoc, setClinicalSummaryDoc] = useState(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [sharingTarget, setSharingTarget] = useState('HIS');

  // Phase 2 Intake Mode State ('ai_conversational' | 'touch_guided')
  const [intakeMode, setIntakeMode] = useState('ai_conversational');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiSection, setAiSection] = useState('chief_complaint');
  const [suggestedOptions, setSuggestedOptions] = useState([]);
  const [extractedInformation, setExtractedInformation] = useState({});
  const [isRedFlag, setIsRedFlag] = useState(false);
  const [redFlags, setRedFlags] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Kiosk Session State
  const [lang, setLang] = useState('en');
  const [sessionId, setSessionId] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [healthIdInput, setHealthIdInput] = useState('');
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [patientSearchError, setPatientSearchError] = useState('');

  // Questions Flow State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);

  // Inactivity Timeout State
  const [showInactivityModal, setShowInactivityModal] = useState(false);
  const [countdown, setCountdown] = useState(INACTIVITY_COUNTDOWN_SEC);
  const lastActivityRef = useRef(Date.now());
  const countdownIntervalRef = useRef(null);

  const t = translations[lang] || translations.en;
  const currentQuestion = KIOSK_QUESTIONS[currentQuestionIdx];

  // Global Inactivity Listener
  useEffect(() => {
    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
      if (showInactivityModal) {
        setShowInactivityModal(false);
        setCountdown(INACTIVITY_COUNTDOWN_SEC);
      }
    };

    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('mousedown', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);

    const checkActivityInterval = setInterval(() => {
      if (step === 'welcome') return; // No timeout on welcome screen

      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= INACTIVITY_WARNING_MS && !showInactivityModal) {
        setShowInactivityModal(true);
        setCountdown(INACTIVITY_COUNTDOWN_SEC);
      }
    }, 5000);

    return () => {
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      clearInterval(checkActivityInterval);
    };
  }, [step, showInactivityModal]);

  // Inactivity Countdown Timer Handler
  useEffect(() => {
    if (showInactivityModal) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            resetKioskSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [showInactivityModal]);

  // Heartbeat to keep backend session alive during interaction
  useEffect(() => {
    if (!sessionId || step === 'welcome' || step === 'finish') return;
    const heartbeatInterval = setInterval(async () => {
      try {
        await apiRequest(`/kiosk/session/${sessionId}/heartbeat`, 'POST');
      } catch (e) {
        console.warn('Heartbeat error:', e);
      }
    }, 60000);
    return () => clearInterval(heartbeatInterval);
  }, [sessionId, step]);

  // 1. Reset Session Completely (purges temporary patient state)
  const resetKioskSession = async () => {
    if (sessionId) {
      try {
        await apiRequest(`/kiosk/session/${sessionId}/reset`, 'POST');
      } catch (e) {
        console.warn('Error resetting session on backend:', e);
      }
    }

    // Clear all local state
    setSessionId(null);
    setPatientInfo(null);
    setHealthIdInput('');
    setAnswers({});
    setCurrentQuestionIdx(0);
    setSubmitting(false);
    setSubmittedResult(null);
    setShowInactivityModal(false);
    setAiQuestion('');
    setSuggestedOptions([]);
    setExtractedInformation({});
    setIsRedFlag(false);
    setRedFlags([]);
    setAiError(null);
    setIntakeMode('ai_conversational');
    setStep('welcome');
  };

  // 2. Start Kiosk Session API Call
  const handleStartSessionApi = async (selectedLang, healthId = null, name = null) => {
    try {
      const data = await apiRequest('/kiosk/session/start', 'POST', {
        language: selectedLang,
        healthId: healthId || undefined,
        patientName: name || undefined,
        mode: intakeMode
      });

      if (data.success && data.session) {
        setSessionId(data.session.sessionId);
        if (data.session.currentAiQuestion) {
          setAiQuestion(data.session.currentAiQuestion.text);
          setSuggestedOptions(data.session.currentAiQuestion.suggestedOptions || []);
          setAiSection(data.session.currentAiQuestion.section || 'chief_complaint');
        }
        if (data.session.patientHealthId || data.session.patientName) {
          setPatientInfo({
            healthId: data.session.patientHealthId,
            name: data.session.patientName
          });
        }
      }
    } catch (err) {
      console.error('Error starting kiosk session:', err);
    }
  };

  // 2b. Handle AI Conversational Interaction
  const handleSendAiMessage = async (inputMessage, inputMethod = 'voice') => {
    if (!sessionId || !inputMessage.trim()) return;
    try {
      setAiLoading(true);
      setAiError(null);
      const data = await apiRequest(`/kiosk/session/${sessionId}/interact`, 'POST', {
        input: inputMessage,
        inputMethod,
        language: lang
      });

      if (data.success) {
        if (data.nextQuestion) setAiQuestion(data.nextQuestion);
        if (data.suggestedOptions) setSuggestedOptions(data.suggestedOptions);
        if (data.currentSection) setAiSection(data.currentSection);
        if (data.extractedInformation) setExtractedInformation(data.extractedInformation);
        if (data.isRedFlag !== undefined) setIsRedFlag(data.isRedFlag);
        if (data.redFlags) setRedFlags(data.redFlags);
      }
    } catch (err) {
      console.error('Error sending AI message:', err);
      setAiError(err.message || 'We couldn\'t process that response. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  // 3. Select Language
  const handleLanguageSelect = (code) => {
    setLang(code);
    setStep('consent');
  };

  // 4. Handle Patient Identification Search
  const handleSearchPatient = async () => {
    if (!healthIdInput.trim()) return;
    try {
      setSearchingPatient(true);
      setPatientSearchError('');
      await handleStartSessionApi(lang, healthIdInput.trim(), null);
      setStep('questions');
    } catch (err) {
      setPatientSearchError('Health ID not found. You can continue as a new patient.');
    } finally {
      setSearchingPatient(false);
    }
  };

  const handleQuickStartGuest = async () => {
    await handleStartSessionApi(lang, null, null);
    setStep('questions');
  };

  // 5. Save Answer & Progress Question
  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value
    }));
  };

  const saveCurrentAnswerToBackend = async (qId, answerVal) => {
    if (!sessionId || !currentQuestion) return;
    try {
      await apiRequest(`/kiosk/session/${sessionId}/answer`, 'POST', {
        questionId: qId || currentQuestion.id,
        section: currentQuestion.section,
        questionText: currentQuestion.text[lang] || currentQuestion.text.en,
        answer: answerVal !== undefined ? answerVal : answers[currentQuestion.id],
        inputMethod: 'touch'
      });
    } catch (err) {
      console.warn('Error saving answer to backend:', err);
    }
  };

  const handleTriggerClinicalSummary = async () => {
    if (!sessionId) return;
    try {
      setGeneratingSummary(true);
      setStep('generating_summary');
      setSummaryError(null);
      const res = await generateClinicalSummary({
        clinicalSessionId: sessionId,
        summaryLanguage: lang
      });
      if (res.success && res.summary) {
        setClinicalSummaryDoc(res.summary);
        setStep('patient_review');
      } else {
        setStep('review');
      }
    } catch (err) {
      console.error('Error generating clinical summary:', err);
      setSummaryError(err.message || 'Summary generation failed');
      setStep('review');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleNextQuestion = async () => {
    const currentVal = answers[currentQuestion.id];
    await saveCurrentAnswerToBackend(currentQuestion.id, currentVal);

    if (currentQuestionIdx < KIOSK_QUESTIONS.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    } else {
      setStep('ayush');
    }
  };

  const handleBackQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
    } else {
      setStep('identification');
    }
  };

  const handleSkipQuestion = async () => {
    await saveCurrentAnswerToBackend(currentQuestion.id, null);
    if (currentQuestionIdx < KIOSK_QUESTIONS.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    } else {
      setStep('ayush');
    }
  };

  const handleRepeatQuestion = () => {
    return currentQuestion ? `${currentQuestion.text[lang] || currentQuestion.text.en}. ${currentQuestion.subtitle?.[lang] || ''}` : '';
  };

  // 6. Submit Full Intake History
  const handleSubmitHistory = async () => {
    if (!sessionId) return;
    try {
      setSubmitting(true);
      const data = await apiRequest(`/kiosk/session/${sessionId}/submit`, 'POST', {
        additionalNotes: ''
      });

      if (data.success) {
        setSubmittedResult({
          sessionId: data.sessionId,
          patientHealthId: data.patientHealthId,
          clinicalHistoryId: data.clinicalHistoryId
        });
        setStep('finish');
      }
    } catch (err) {
      console.error('Error submitting history:', err);
      alert('Submission failed. Please try again or seek staff help.');
    } finally {
      setSubmitting(false);
    }
  };

  // Render Question Inputs according to question.type
  const renderQuestionInput = () => {
    if (!currentQuestion) return null;

    const val = answers[currentQuestion.id];

    switch (currentQuestion.type) {
      case 'single_choice':
        return (
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md w-full">
            {currentQuestion.options.map((opt) => {
              const selected = val === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleAnswerChange(currentQuestion.id, opt.id)}
                  class={`min-h-[110px] p-space-lg rounded-3xl border-3 flex flex-col items-center justify-center text-center gap-space-xs transition-all active:scale-95 shadow-md ${
                    selected
                      ? 'bg-primary text-on-primary border-primary ring-4 ring-primary/30 scale-[1.02]'
                      : 'bg-surface-container-lowest hover:bg-surface-container-high text-on-surface border-surface-container'
                  }`}
                >
                  {opt.icon && <span class={`material-symbols-outlined text-[40px] ${selected ? 'text-on-primary' : 'text-primary'}`}>{opt.icon}</span>}
                  <span class="font-headline-sm text-headline-sm font-extrabold leading-tight">
                    {opt.label[lang] || opt.label.en}
                  </span>
                </button>
              );
            })}
          </div>
        );

      case 'multiple_choice':
        const selectedArr = Array.isArray(val) ? val : [];
        const toggleMulti = (optId) => {
          if (optId === 'none' || optId === 'family_none' || optId === 'ros_none') {
            handleAnswerChange(currentQuestion.id, [optId]);
            return;
          }
          let updated = selectedArr.filter((i) => i !== 'none' && i !== 'family_none' && i !== 'ros_none');
          if (updated.includes(optId)) {
            updated = updated.filter((i) => i !== optId);
          } else {
            updated.push(optId);
          }
          handleAnswerChange(currentQuestion.id, updated);
        };

        return (
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-md w-full">
            {currentQuestion.options.map((opt) => {
              const isSelected = selectedArr.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleMulti(opt.id)}
                  class={`min-h-[100px] p-space-lg rounded-3xl border-3 flex items-center gap-space-md text-left transition-all active:scale-95 shadow-md ${
                    isSelected
                      ? 'bg-primary text-on-primary border-primary ring-4 ring-primary/30'
                      : 'bg-surface-container-lowest hover:bg-surface-container-high text-on-surface border-surface-container'
                  }`}
                >
                  <span class={`material-symbols-outlined text-[36px] shrink-0 ${isSelected ? 'text-on-primary' : 'text-primary'}`}>
                    {isSelected ? 'check_box' : 'check_box_outline_blank'}
                  </span>
                  <span class="font-headline-sm text-headline-sm font-extrabold leading-tight">
                    {opt.label[lang] || opt.label.en}
                  </span>
                </button>
              );
            })}
          </div>
        );

      case 'duration_picker':
        const count = val?.count || 1;
        const unit = val?.unit || 'days';

        const updateDuration = (newCount, newUnit) => {
          handleAnswerChange(currentQuestion.id, {
            count: Math.max(1, newCount),
            unit: newUnit || unit
          });
        };

        return (
          <div class="flex flex-col items-center gap-space-xl w-full max-w-2xl bg-surface-container-lowest p-space-xl rounded-3xl border-2 border-surface-container shadow-lg">
            {/* Number Counter */}
            <div class="flex items-center gap-space-lg">
              <button
                type="button"
                onClick={() => updateDuration(count - 1, unit)}
                class="w-20 h-20 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-display-md text-display-md font-bold flex items-center justify-center active:scale-95 border-2 border-surface-container shadow-md"
              >
                -
              </button>

              <span class="font-display-lg text-display-lg font-black text-primary min-w-[100px] text-center">
                {count}
              </span>

              <button
                type="button"
                onClick={() => updateDuration(count + 1, unit)}
                class="w-20 h-20 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-display-md text-display-md font-bold flex items-center justify-center active:scale-95 border-2 border-surface-container shadow-md"
              >
                +
              </button>
            </div>

            {/* Unit Buttons */}
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-space-sm w-full">
              {['days', 'weeks', 'months', 'years'].map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => updateDuration(count, u)}
                  class={`h-16 rounded-2xl font-headline-sm text-headline-sm font-bold capitalize transition-all active:scale-95 ${
                    unit === u
                      ? 'bg-primary text-on-primary ring-4 ring-primary/20'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        );

      case 'severity_scale':
        const numVal = Number(val) || 5;

        return (
          <div class="flex flex-col items-center gap-space-xl w-full max-w-3xl bg-surface-container-lowest p-space-xl rounded-3xl border-2 border-surface-container shadow-lg">
            <div class="flex items-center gap-space-md">
              <span class="font-display-lg text-display-lg font-black text-primary">{numVal}</span>
              <span class="font-headline-md text-headline-md text-on-surface-variant font-bold">/ 10</span>
            </div>

            {/* 10 Touch Buttons */}
            <div class="grid grid-cols-5 sm:grid-cols-10 gap-space-xs w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                const isSel = numVal === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleAnswerChange(currentQuestion.id, num)}
                    class={`h-20 rounded-2xl font-headline-md text-headline-md font-extrabold flex items-center justify-center transition-all active:scale-95 shadow-md ${
                      isSel
                        ? 'bg-primary text-on-primary ring-4 ring-primary/30 scale-110'
                        : num <= 3
                        ? 'bg-tertiary-container/40 text-on-tertiary-container hover:bg-tertiary-container'
                        : num <= 6
                        ? 'bg-secondary-container/50 text-on-secondary-container hover:bg-secondary-container'
                        : 'bg-error-container/50 text-on-error-container hover:bg-error-container'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>

            <div class="flex justify-between w-full font-title-lg text-title-lg font-bold text-on-surface-variant">
              <span class="text-tertiary font-extrabold">1 - Mild</span>
              <span class="text-secondary font-extrabold">5 - Moderate</span>
              <span class="text-error font-extrabold">10 - Severe</span>
            </div>
          </div>
        );

      case 'body_location':
        return (
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-md w-full">
            {currentQuestion.options.map((opt) => {
              const selected = val === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleAnswerChange(currentQuestion.id, opt.id)}
                  class={`min-h-[100px] p-space-lg rounded-3xl border-3 flex items-center gap-space-md text-left transition-all active:scale-95 shadow-md ${
                    selected
                      ? 'bg-primary text-on-primary border-primary ring-4 ring-primary/30'
                      : 'bg-surface-container-lowest hover:bg-surface-container-high text-on-surface border-surface-container'
                  }`}
                >
                  <span class={`material-symbols-outlined text-[36px] ${selected ? 'text-on-primary' : 'text-primary'}`}>
                    accessibility_new
                  </span>
                  <span class="font-headline-sm text-headline-sm font-extrabold leading-tight">
                    {opt.label[lang] || opt.label.en}
                  </span>
                </button>
              );
            })}
          </div>
        );

      case 'yes_no_with_text':
        const hasValue = val?.hasValue ?? false;
        const details = val?.details || '';

        const updateYesNo = (yesState, textState = details) => {
          handleAnswerChange(currentQuestion.id, {
            hasValue: yesState,
            details: textState
          });
        };

        return (
          <div class="flex flex-col items-center gap-space-lg w-full max-w-2xl bg-surface-container-lowest p-space-xl rounded-3xl border-2 border-surface-container shadow-lg">
            <div class="grid grid-cols-2 gap-space-md w-full">
              <button
                type="button"
                onClick={() => updateYesNo(true)}
                class={`h-24 rounded-3xl font-display-sm text-display-sm font-black flex items-center justify-center gap-space-xs transition-all active:scale-95 shadow-md ${
                  hasValue
                    ? 'bg-primary text-on-primary ring-4 ring-primary/30'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                }`}
              >
                <span class="material-symbols-outlined text-[40px]">check_circle</span>
                <span>YES</span>
              </button>

              <button
                type="button"
                onClick={() => updateYesNo(false, '')}
                class={`h-24 rounded-3xl font-display-sm text-display-sm font-black flex items-center justify-center gap-space-xs transition-all active:scale-95 shadow-md ${
                  !hasValue
                    ? 'bg-surface-container-highest text-on-surface ring-4 ring-surface-container-highest/30'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                }`}
              >
                <span class="material-symbols-outlined text-[40px]">cancel</span>
                <span>NO</span>
              </button>
            </div>

            {hasValue && (
              <div class="flex flex-col gap-space-xs w-full pt-space-md border-t-2 border-surface-container">
                <label class="font-title-lg text-title-lg text-on-surface font-bold">
                  {currentQuestion.placeholder?.[lang] || currentQuestion.placeholder?.en}
                </label>
                <textarea
                  rows="3"
                  value={details}
                  onChange={(e) => updateYesNo(true, e.target.value)}
                  placeholder="Type details or speak to staff..."
                  class="w-full p-space-md rounded-2xl bg-surface-container-low border-2 border-surface-container font-headline-sm text-headline-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                ></textarea>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div class="min-h-screen bg-surface flex flex-col font-body-lg text-on-surface select-none">
      {/* Top Kiosk Header */}
      <header class="h-20 bg-surface-container-lowest border-b-2 border-surface-container px-space-md lg:px-space-xl flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div class="flex items-center gap-space-md">
          <div class="flex items-center gap-space-xs">
            <div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary font-black text-title-lg shadow-sm">
              MK
            </div>
            <span class="font-headline-md text-headline-md text-on-surface font-extrabold tracking-tight hidden sm:inline">
              Medi<span class="text-primary">Kiosk</span>
            </span>
          </div>

          <span class="px-space-sm py-1 rounded-full bg-primary-container/40 text-on-primary-container font-title text-title font-bold uppercase tracking-wider text-xs sm:text-sm">
            Patient Kiosk Mode
          </span>
        </div>

        {/* Exit & Language Switch Action */}
        <div class="flex items-center gap-space-sm">
          {step === 'questions' && (
            <button
              type="button"
              onClick={() => setIntakeMode(intakeMode === 'ai_conversational' ? 'touch_guided' : 'ai_conversational')}
              class="px-space-md py-2 rounded-xl bg-primary-container text-on-primary-container font-title text-title font-bold flex items-center gap-1 hover:bg-primary-container/80 transition-colors shadow-sm"
              title="Toggle Intake Mode"
            >
              <span class="material-symbols-outlined text-[20px]">
                {intakeMode === 'ai_conversational' ? 'mic' : 'touch_app'}
              </span>
              <span class="hidden sm:inline">
                {intakeMode === 'ai_conversational' ? 'AI Voice Mode' : 'Touch Form Mode'}
              </span>
            </button>
          )}

          {step !== 'welcome' && (
            <button
              type="button"
              onClick={() => setStep('language')}
              class="px-space-md py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-title text-title font-bold flex items-center gap-1 transition-colors"
            >
              <span class="material-symbols-outlined text-[20px]">translate</span>
              <span class="uppercase">{lang}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            class="px-space-md py-2 rounded-xl bg-surface-container-high hover:bg-error-container hover:text-on-error-container text-on-surface-variant font-title text-title font-bold flex items-center gap-1 transition-colors"
            title={t.exitKioskBtn}
          >
            <span class="material-symbols-outlined text-[20px]">logout</span>
            <span class="hidden md:inline">{t.exitKioskBtn}</span>
          </button>
        </div>
      </header>

      {/* Main Kiosk Container Area */}
      <main class="flex-grow flex flex-col items-center justify-center p-space-md sm:p-space-xl max-w-7xl mx-auto w-full">
        
        {/* STEP 1: WELCOME SCREEN */}
        {step === 'welcome' && (
          <div class="flex flex-col items-center text-center gap-space-2xl my-auto py-space-xl max-w-4xl w-full">
            <div class="w-28 h-28 rounded-3xl bg-primary text-on-primary flex items-center justify-center shadow-2xl animate-pulse">
              <span class="material-symbols-outlined text-[72px]">touch_app</span>
            </div>

            <div class="flex flex-col gap-space-sm">
              <h1 class="font-display-lg text-display-lg text-on-surface font-black tracking-tight leading-none">
                {t.welcomeTitle}
              </h1>
              <p class="font-headline-md text-headline-md text-primary font-bold">
                {t.welcomeSubtitle}
              </p>
              <p class="font-body-xl text-body-xl text-on-surface-variant max-w-2xl mx-auto pt-space-xs">
                {t.welcomeInstructions}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setStep('language')}
              class="w-full sm:w-auto min-h-[88px] px-space-2xl bg-primary hover:bg-primary-container text-on-primary font-display-md text-display-md font-black rounded-3xl shadow-2xl flex items-center justify-center gap-space-md transition-all active:scale-95 ring-8 ring-primary/20 cursor-pointer"
            >
              <span class="material-symbols-outlined text-[48px]">play_circle</span>
              <span>{t.startBtn}</span>
            </button>
          </div>
        )}

        {/* STEP 2: LANGUAGE SELECTION */}
        {step === 'language' && (
          <div class="flex flex-col items-center text-center gap-space-xl my-auto py-space-lg max-w-4xl w-full">
            <div class="flex flex-col gap-space-2xs">
              <span class="material-symbols-outlined text-[48px] text-primary">translate</span>
              <h1 class="font-display-md text-display-md text-on-surface font-black">
                {t.selectLanguageTitle}
              </h1>
              <p class="font-headline-sm text-headline-sm text-on-surface-variant font-medium">
                {t.selectLanguageSubtitle}
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-space-lg w-full pt-space-md">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleLanguageSelect(l.code)}
                  class={`min-h-[140px] p-space-xl rounded-3xl border-4 flex flex-col items-center justify-center gap-space-xs transition-all active:scale-95 shadow-xl ${
                    lang === l.code
                      ? 'bg-primary text-on-primary border-primary ring-8 ring-primary/20 scale-105'
                      : 'bg-surface-container-lowest hover:bg-surface-container-high text-on-surface border-surface-container'
                  }`}
                >
                  <span class="font-display-md text-display-md font-black">{l.nativeName}</span>
                  <span class="font-title-lg text-title-lg opacity-80 font-bold">{l.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: LOW LITERACY AUDITABLE CONSENT */}
        {step === 'consent' && (
          <LowLiteracyConsentView
            clinicalSessionId={sessionId || `session-${Date.now()}`}
            patientId={patientInfo?.healthId}
            language={lang}
            onConsentGranted={() => setStep('identification')}
            onConsentDeclined={() => setStep('welcome')}
          />
        )}

        {/* STEP 4: PATIENT IDENTIFICATION */}
        {step === 'identification' && (
          <div class="flex flex-col items-center text-center gap-space-xl my-auto py-space-lg max-w-3xl w-full">
            <div class="flex flex-col gap-space-2xs">
              <span class="material-symbols-outlined text-[48px] text-primary">badge</span>
              <h1 class="font-display-sm text-display-sm text-on-surface font-black">
                {t.identificationTitle}
              </h1>
              <p class="font-headline-sm text-headline-sm text-on-surface-variant font-medium">
                {t.identificationSubtitle}
              </p>
            </div>

            <div class="bg-surface-container-lowest border-2 border-surface-container rounded-3xl p-space-xl shadow-lg w-full flex flex-col gap-space-lg">
              <div class="flex flex-col gap-space-xs text-left">
                <label class="font-title-lg text-title-lg text-on-surface font-bold">
                  MediGuard Health ID (Optional)
                </label>
                <div class="flex flex-col sm:flex-row gap-space-sm">
                  <input
                    type="text"
                    value={healthIdInput}
                    onChange={(e) => setHealthIdInput(e.target.value)}
                    placeholder={t.enterHealthIdPlaceholder}
                    class="flex-grow h-16 px-space-md rounded-2xl bg-surface-container-low border-2 border-surface-container font-mono font-bold text-headline-md text-on-surface uppercase focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleSearchPatient}
                    disabled={searchingPatient || !healthIdInput.trim()}
                    class="h-16 px-space-xl bg-primary text-on-primary font-headline-sm text-headline-sm font-bold rounded-2xl shadow-md flex items-center justify-center gap-space-xs hover:bg-primary-container transition-all disabled:opacity-50"
                  >
                    {searchingPatient ? 'Verifying...' : t.searchHealthIdBtn}
                  </button>
                </div>
                {patientSearchError && (
                  <p class="font-title-md text-title-md text-error font-bold pt-1">{patientSearchError}</p>
                )}
              </div>

              <div class="relative flex py-space-xs items-center">
                <div class="flex-grow border-t-2 border-surface-container"></div>
                <span class="flex-shrink mx-4 text-on-surface-variant font-title-lg text-title-lg font-bold uppercase">OR</span>
                <div class="flex-grow border-t-2 border-surface-container"></div>
              </div>

              <button
                type="button"
                onClick={handleQuickStartGuest}
                class="min-h-[76px] w-full px-space-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-headline-md text-headline-md font-bold rounded-2xl border-2 border-surface-container shadow-md flex items-center justify-center gap-space-sm transition-all active:scale-95"
              >
                <span class="material-symbols-outlined text-[32px] text-primary">person_add</span>
                <span>{t.quickStartGuestBtn}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: CLINICAL HISTORY QUESTIONS (AI CONVERSATIONAL OR TOUCH GUIDED) */}
        {step === 'questions' && intakeMode === 'ai_conversational' && (
          <AiConversationalView
            lang={lang}
            sessionId={sessionId}
            currentQuestion={aiQuestion}
            currentSection={aiSection}
            suggestedOptions={suggestedOptions}
            extractedInformation={extractedInformation}
            isRedFlag={isRedFlag}
            redFlags={redFlags}
            onSendMessage={handleSendAiMessage}
            loading={aiLoading}
            apiError={aiError}
            onSwitchToGuided={() => setIntakeMode('touch_guided')}
            onReviewAndSubmit={() => setStep('ayush')}
          />
        )}

        {step === 'questions' && intakeMode === 'touch_guided' && currentQuestion && (
          <div class="flex flex-col items-center gap-space-xl w-full my-auto py-space-md">
            {/* Top Section Progress Bar */}
            <div class="w-full max-w-4xl bg-surface-container-lowest border-2 border-surface-container rounded-2xl p-space-md shadow-sm flex flex-col gap-space-xs">
              <div class="flex justify-between items-center font-title-lg text-title-lg font-bold">
                <span class="text-primary flex items-center gap-space-xs uppercase">
                  <span class="material-symbols-outlined text-[24px]">folder</span>
                  {t.sections[currentQuestion.section] || currentQuestion.section}
                </span>
                <span class="text-on-surface-variant">
                  {t.progressSectionLabel} {currentQuestionIdx + 1} {t.progressOf} {KIOSK_QUESTIONS.length}
                </span>
              </div>
              <div class="w-full h-4 bg-surface-container rounded-full overflow-hidden flex">
                <div
                  class="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIdx + 1) / KIOSK_QUESTIONS.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Question Text Box */}
            <div class="flex flex-col items-center text-center gap-space-xs max-w-3xl">
              {currentQuestion.icon && (
                <div class="w-16 h-16 rounded-2xl bg-primary-container/40 text-primary flex items-center justify-center mb-space-2xs">
                  <span class="material-symbols-outlined text-[40px]">{currentQuestion.icon}</span>
                </div>
              )}
              <h1 class="font-display-md text-display-md text-on-surface font-black tracking-tight leading-tight">
                {currentQuestion.text[lang] || currentQuestion.text.en}
              </h1>
              {currentQuestion.subtitle && (
                <p class="font-headline-sm text-headline-sm text-on-surface-variant font-medium">
                  {currentQuestion.subtitle[lang] || currentQuestion.subtitle.en}
                </p>
              )}
            </div>

            {/* Render Interactive Touch Input Controls */}
            <div class="w-full max-w-5xl flex justify-center py-space-md">
              {renderQuestionInput()}
            </div>
          </div>
        )}

        {/* STEP: AYUSH DASHAVIDHA PARIKSHA */}
        {step === 'ayush' && (
          <AyushIntakeView
            clinicalSessionId={sessionId}
            patientId={patientInfo?.healthId}
            language={lang}
            onComplete={handleTriggerClinicalSummary}
            onBack={() => setStep('questions')}
          />
        )}

        {/* STEP: GENERATING SUMMARY LOADING SCREEN */}
        {step === 'generating_summary' && (
          <div class="flex flex-col items-center text-center gap-space-xl my-auto py-space-2xl max-w-xl w-full bg-surface-container-lowest p-space-2xl rounded-3xl border-2 border-surface-container shadow-2xl">
            <div class="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div class="flex flex-col gap-space-xs">
              <h2 class="font-display-sm text-display-sm font-black text-on-surface">
                Generating Clinical Summary...
              </h2>
              <p class="font-headline-sm text-headline-sm text-on-surface-variant font-medium">
                Combining Patient History, Voice Responses, Extracted Medical Documents, and AYUSH Dashavidha Pariksha via Gemini AI Engine.
              </p>
            </div>
          </div>
        )}

        {/* STEP: PATIENT SUMMARY REVIEW */}
        {step === 'patient_review' && clinicalSummaryDoc && (
          <PatientSummaryReview
            summary={clinicalSummaryDoc}
            onConfirmed={() => setStep('finish')}
            onEditRequested={() => setStep('questions')}
            onBack={() => setStep('ayush')}
          />
        )}

        {/* STEP: PHYSICIAN CLINICAL SUMMARY VIEW */}
        {step === 'physician_summary' && clinicalSummaryDoc && (
          <div class="w-full">
            <button
              onClick={() => setStep('finish')}
              class="mb-4 px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-lg text-on-surface font-semibold flex items-center gap-2"
            >
              ← Back to Kiosk Confirmation
            </button>
            <ClinicalSummaryView
              summary={clinicalSummaryDoc}
              onRefresh={handleTriggerClinicalSummary}
            />
          </div>
        )}

        {/* STEP 6: SUMMARY REVIEW */}
        {step === 'review' && (
          <KioskReview
            lang={lang}
            answers={answers}
            patientInfo={patientInfo}
            onEditSection={(secKey) => {
              const idx = KIOSK_QUESTIONS.findIndex((q) => q.section === secKey);
              if (idx !== -1) {
                setCurrentQuestionIdx(idx);
                setStep('questions');
              }
            }}
            onSubmit={handleSubmitHistory}
            submitting={submitting}
          />
        )}

        {/* STEP 7: FINISH / SUBMITTED SCREEN */}
        {step === 'finish' && (
          <div class="flex flex-col items-center text-center gap-space-2xl my-auto py-space-xl max-w-3xl w-full">
            <div class="w-28 h-28 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shadow-2xl">
              <span class="material-symbols-outlined text-[72px]">task_alt</span>
            </div>

            <div class="flex flex-col gap-space-sm">
              <h1 class="font-display-md text-display-md text-on-surface font-black">
                {t.finishTitle}
              </h1>
              <p class="font-headline-md text-headline-md text-on-surface-variant font-semibold">
                {t.finishSubtitle}
              </p>
            </div>

            {submittedResult && (
              <div class="bg-surface-container-lowest border-4 border-primary/30 rounded-3xl p-space-xl shadow-xl w-full flex flex-col gap-space-xs">
                <span class="font-title-lg text-title-lg text-on-surface-variant font-bold uppercase">{t.tokenLabel}</span>
                <span class="font-mono font-black text-display-md text-primary">{submittedResult.sessionId}</span>
                {submittedResult.patientHealthId && (
                  <span class="font-title-md text-title-md text-on-surface font-bold">Health ID: {submittedResult.patientHealthId}</span>
                )}
              </div>
            )}

            {clinicalSummaryDoc && (
              <div class="flex flex-col gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setStep('physician_summary')}
                  class="w-full min-h-[60px] px-space-xl bg-secondary text-on-secondary font-headline-md text-headline-md font-bold rounded-2xl shadow-lg flex items-center justify-center gap-space-sm cursor-pointer"
                >
                  <span class="material-symbols-outlined text-[28px]">stethoscope</span>
                  <span>View Physician Clinical Summary & Verification Panel</span>
                </button>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setSharingTarget('HIS');
                      setShowSharingModal(true);
                    }}
                    class="py-3 px-4 bg-primary text-on-primary font-bold rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>🏥 Share with Hospital HIS / EMR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSharingTarget('ABDM');
                      setShowSharingModal(true);
                    }}
                    class="py-3 px-4 bg-surface-container-highest text-on-surface font-bold rounded-xl border border-surface-container flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>🌐 Share with ABDM Network</span>
                  </button>
                </div>
              </div>
            )}

            {/* External Sharing Modal */}
            {showSharingModal && (
              <ExternalSharingModal
                clinicalSessionId={sessionId}
                clinicalSummaryId={clinicalSummaryDoc?._id}
                targetSystem={sharingTarget}
                onClose={() => setShowSharingModal(false)}
              />
            )}

            <div class="bg-surface-container-low p-space-lg rounded-2xl border-2 border-surface-container">
              <p class="font-headline-sm text-headline-sm text-on-surface font-bold">
                {t.finishNotice}
              </p>
            </div>

            <button
              type="button"
              onClick={resetKioskSession}
              class="w-full min-h-[80px] px-space-2xl bg-primary hover:bg-primary-container text-on-primary font-display-sm text-display-sm font-bold rounded-3xl shadow-xl flex items-center justify-center gap-space-md transition-all active:scale-95 cursor-pointer"
            >
              <span class="material-symbols-outlined text-[40px]">refresh</span>
              <span>{t.startNewSessionBtn}</span>
            </button>
          </div>
        )}
      </main>

      {/* Bottom Kiosk Controls (visible during touch guided question flow) */}
      {step === 'questions' && intakeMode === 'touch_guided' && (
        <KioskControls
          lang={lang}
          onBack={handleBackQuestion}
          onNext={handleNextQuestion}
          onSkip={handleSkipQuestion}
          onRepeat={handleRepeatQuestion}
          canGoBack={true}
          isLastQuestion={currentQuestionIdx === KIOSK_QUESTIONS.length - 1}
        />
      )}

      {/* Inactivity Timeout Modal */}
      {showInactivityModal && (
        <div class="fixed inset-0 z-50 bg-on-surface/80 backdrop-blur-md flex items-center justify-center p-space-md animate-fade-in">
          <div class="bg-surface-container-lowest border-4 border-error/50 rounded-3xl p-space-2xl max-w-xl w-full text-center flex flex-col items-center gap-space-lg shadow-2xl">
            <div class="w-20 h-20 rounded-2xl bg-error-container text-error flex items-center justify-center">
              <span class="material-symbols-outlined text-[52px]">timer</span>
            </div>

            <div class="flex flex-col gap-space-xs">
              <h2 class="font-display-sm text-display-sm text-on-surface font-black">
                {t.inactivityTitle}
              </h2>
              <p class="font-headline-sm text-headline-sm text-on-surface-variant font-medium">
                {t.inactivitySubtitle}
              </p>
            </div>

            <div class="flex flex-col items-center gap-space-2xs bg-surface-container-low p-space-md rounded-2xl border-2 border-surface-container w-full">
              <span class="font-title-lg text-title-lg text-on-surface-variant font-bold uppercase">{t.inactivityTimer}</span>
              <span class="font-mono text-display-lg font-black text-error animate-pulse">
                {countdown} {t.inactivitySeconds}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowInactivityModal(false);
                setCountdown(INACTIVITY_COUNTDOWN_SEC);
                lastActivityRef.current = Date.now();
              }}
              class="w-full min-h-[76px] bg-primary hover:bg-primary-container text-on-primary font-headline-lg text-headline-lg font-bold rounded-2xl shadow-xl flex items-center justify-center gap-space-sm transition-all active:scale-95 cursor-pointer"
            >
              <span class="material-symbols-outlined text-[36px]">touch_app</span>
              <span>{t.continueSessionBtn}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
