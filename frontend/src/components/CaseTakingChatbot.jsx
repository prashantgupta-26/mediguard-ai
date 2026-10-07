import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { apiRequest } from '../services/api';

export default function CaseTakingChatbot({ user }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSummaryView, setShowSummaryView] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const chatEndRef = useRef(null);

  // Hide floating button on login/register/kiosk routes
  const hideRoutes = ['/login', '/register', '/verify-email', '/kiosk'];
  const isHiddenRoute = hideRoutes.some((path) => location.pathname.startsWith(path));

  useEffect(() => {
    if (user && !isHiddenRoute) {
      checkActiveSession();
    }
  }, [user, location.pathname]);

  useEffect(() => {
    if (isOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session?.conversationHistory, sending, isOpen, showSummaryView]);

  const checkActiveSession = async () => {
    try {
      const data = await apiRequest('/case-taking/active', 'GET');
      if (data.success && data.hasActiveSession && data.session) {
        setSession(data.session);
        setHasActiveSession(true);
      } else {
        setHasActiveSession(false);
      }
    } catch (err) {
      console.warn('Check active case-taking session error:', err.message);
    }
  };

  const handleOpenChat = async () => {
    setIsOpen(true);
    setError('');

    if (!session) {
      try {
        setLoading(true);
        const data = await apiRequest('/case-taking/start', 'POST');
        if (data.success && data.session) {
          setSession(data.session);
          setHasActiveSession(data.session.status === 'in_progress');
        } else {
          setError(data.message || 'Failed to start case-taking session.');
        }
      } catch (err) {
        console.error('Start case-taking session error:', err);
        setError(err.message || 'Failed to initialize AI Case-Taking assistant.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSendMessage = async (textToSend = null) => {
    const text = textToSend || inputMessage;
    if (!text || !text.trim() || sending || !session?.sessionId) return;

    const userMessage = text.trim();
    setInputMessage('');
    setSending(true);
    setError('');

    // Optimistically push user message to UI transcript
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        conversationHistory: [
          ...(prev.conversationHistory || []),
          { role: 'user', text: userMessage, timestamp: new Date() }
        ]
      };
    });

    try {
      const data = await apiRequest(`/case-taking/${session.sessionId}/message`, 'POST', {
        message: userMessage
      });

      if (data.success && data.session) {
        setSession(data.session);
        setHasActiveSession(data.session.status === 'in_progress');
      } else {
        throw new Error(data.message || 'Failed to send message.');
      }
    } catch (err) {
      console.error('Send message error:', err);
      setError(err.message || 'Failed to connect to AI server. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!session?.sessionId) return;
    if (!window.confirm('Complete this case-taking session and finalize your case history summary?')) {
      return;
    }

    try {
      setLoading(true);
      const data = await apiRequest(`/case-taking/${session.sessionId}/complete`, 'POST');
      if (data.success && data.session) {
        setSession(data.session);
        setHasActiveSession(false);
        setShowSummaryView(true);
        setToastMessage('✓ Case history session finalized & saved');
        setTimeout(() => setToastMessage(''), 3500);
      } else {
        setError(data.message || 'Failed to complete session.');
      }
    } catch (err) {
      console.error('Complete session error:', err);
      setError(err.message || 'Failed to complete session.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewSession = async () => {
    try {
      setLoading(true);
      setShowSummaryView(false);
      setSession(null);
      setError('');
      const data = await apiRequest('/case-taking/start', 'POST');
      if (data.success && data.session) {
        setSession(data.session);
        setHasActiveSession(true);
      }
    } catch (err) {
      console.error('Start new session error:', err);
      setError('Failed to start new case-taking session.');
    } finally {
      setLoading(false);
    }
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem('medikiosk_token') : null;

  if ((!user && !token) || isHiddenRoute) {
    return null;
  }

  const structured = session?.structuredClinicalData || {};
  const currentOptions = session?.currentAiQuestion?.suggestedOptions || [];

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[10000] flex items-center gap-2 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-teal-400 text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Circular Icon (Right Side - Desktop: 24px, Tablet: 20px, Mobile: 16px) */}
      {!isOpen && (
        <div className="fixed bottom-[16px] right-[16px] md:bottom-[20px] md:right-[20px] lg:bottom-[24px] lg:right-[24px] z-[9999] group">
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap pointer-events-none transition-opacity">
            AI Case-Taking
            <div className="absolute top-full right-4 border-4 border-transparent border-t-slate-900"></div>
          </div>

          <button
            type="button"
            onClick={handleOpenChat}
            aria-label="Open AI Case-Taking Assistant"
            className="w-14 h-14 rounded-full bg-sky-600 hover:bg-sky-700 text-white shadow-2xl border-2 border-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer relative"
          >
            <span className="material-symbols-outlined text-[28px]">psychology</span>

            {/* Active Session Notification Dot */}
            {hasActiveSession && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-teal-500 border-2 border-white rounded-full flex items-center justify-center animate-pulse" title="Active Case-Taking Session">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              </span>
            )}
          </button>
        </div>
      )}

      {/* Chatbot Drawer Panel (Right-Side Drawer) */}
      {isOpen && (
        <aside
          aria-label="AI Case-Taking Assistant Drawer"
          className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white border-l border-slate-200 shadow-2xl flex flex-col font-sans transition-all duration-300 animate-in slide-in-from-right"
        >
          
          {/* Drawer Header */}
          <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shrink-0">
                <span className="material-symbols-outlined text-[22px]">psychology</span>
              </div>
              <div className="flex flex-col min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white truncate">AI Case-Taking</h3>
                  {session?.status === 'in_progress' ? (
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-bold">
                      In Progress
                    </span>
                  ) : session?.status === 'completed' ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                      Completed
                    </span>
                  ) : null}
                </div>
                <span className="text-[11px] text-slate-400 truncate">
                  Patient Health History Collector
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setShowSummaryView(!showSummaryView)}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                  showSummaryView ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title={showSummaryView ? 'Switch to Chat View' : 'View Extracted Case Summary'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showSummaryView ? 'chat' : 'description'}
                </span>
                <span className="text-[11px] font-medium hidden sm:inline">
                  {showSummaryView ? 'Chat' : 'Summary'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close Case-Taking Assistant"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Medical Safety Disclaimer Banner */}
          <div className="bg-amber-50 border-b border-amber-200/80 px-3.5 py-2 flex items-start gap-2 text-[11px] text-amber-900 shrink-0 text-left">
            <span className="material-symbols-outlined text-amber-700 text-[16px] shrink-0 mt-0.5">info</span>
            <span>
              This assistant collects health information to help prepare your case history. It does not replace a healthcare professional or provide a diagnosis.
            </span>
          </div>

          {/* Emergency Red-Flag Alert Banner */}
          {session?.isRedFlag && (
            <div className="bg-red-50 border-b border-red-200 px-3.5 py-2 flex items-start gap-2 text-xs text-red-900 shrink-0 text-left">
              <span className="material-symbols-outlined text-red-600 text-[18px] shrink-0 mt-0.5 animate-bounce">warning</span>
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-red-700 flex items-center gap-1">
                  🔴 HIGH PRIORITY ATTENTION
                </span>
                <p className="text-[11px] text-red-800 leading-tight">
                  Potential high-priority symptom reported. Prompt clinical assessment by a medical professional may be appropriate.
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="bg-red-100 border-b border-red-200 px-3.5 py-2 text-xs text-red-800 font-medium flex items-center justify-between shrink-0">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-red-600 font-bold ml-2">✕</button>
            </div>
          )}

          {/* BODY: CHAT VIEW vs STRUCTURED SUMMARY VIEW */}
          {showSummaryView ? (
            /* STRUCTURED CASE SUMMARY VIEW */
            <div className="flex-grow overflow-y-auto p-4 bg-slate-50 flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">assignment</span>
                  Structured Case Summary
                </h4>
                {session?.status === 'completed' && (
                  <button
                    type="button"
                    onClick={handleStartNewSession}
                    className="text-[11px] font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1"
                  >
                    + Start New Session
                  </button>
                )}
              </div>

              {/* Chief Complaint & Timeline */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase text-slate-500">Chief Concern</span>
                <p className="text-xs font-bold text-slate-900">
                  {structured.chiefComplaint || 'Not reported yet'}
                </p>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Onset:</span>
                    <strong className="text-slate-800">{structured.onset || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Duration:</span>
                    <strong className="text-slate-800">{structured.duration || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Severity:</span>
                    <strong className="text-slate-800">{structured.severity || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              {/* Reported Symptoms */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase text-teal-700">Reported Symptoms</span>
                {structured.symptoms?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {structured.symptoms.map((symptom, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold">
                        • {symptom}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">No specific symptoms recorded yet.</span>
                )}
              </div>

              {/* Medical & Surgical History */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase text-sky-700">Past Medical & Surgical History</span>
                <div className="flex flex-col gap-1 text-xs">
                  <div>
                    <strong className="text-slate-700">Medical Conditions: </strong>
                    <span className="text-slate-900">
                      {structured.pastMedicalHistory?.length > 0 ? structured.pastMedicalHistory.join(', ') : 'None reported'}
                    </span>
                  </div>
                  <div>
                    <strong className="text-slate-700">Past Surgeries: </strong>
                    <span className="text-slate-900">
                      {structured.pastSurgicalHistory?.length > 0 ? structured.pastSurgicalHistory.join(', ') : 'None reported'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Current Medications & Allergies */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase text-indigo-700">Medications & Allergies</span>
                <div className="flex flex-col gap-1 text-xs">
                  <div>
                    <strong className="text-slate-700">Current Medications: </strong>
                    <span className="text-slate-900">
                      {structured.medications?.length > 0 ? structured.medications.join(', ') : 'None reported'}
                    </span>
                  </div>
                  <div>
                    <strong className="text-slate-700">Known Allergies: </strong>
                    <span className="text-slate-900">
                      {structured.allergies?.length > 0 ? structured.allergies.join(', ') : 'None reported'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Family & Personal History */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase text-slate-600">Family & Personal History</span>
                <div className="flex flex-col gap-1 text-xs">
                  <div>
                    <strong className="text-slate-700">Family History: </strong>
                    <span className="text-slate-900">
                      {structured.familyHistory?.length > 0 ? structured.familyHistory.join(', ') : 'None reported'}
                    </span>
                  </div>
                  <div>
                    <strong className="text-slate-700">Previous Treatments Tried: </strong>
                    <span className="text-slate-900">
                      {structured.previousTreatment?.length > 0 ? structured.previousTreatment.join(', ') : 'None reported'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* CONVERSATIONAL CHAT VIEW */
            <div className="flex-grow overflow-y-auto p-4 bg-slate-50/50 flex flex-col gap-3 text-left">
              
              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3">
                  <div className="w-9 h-9 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-semibold text-slate-500">Connecting to AI Case-Taking assistant...</span>
                </div>
              ) : (
                <>
                  {session?.conversationHistory?.map((msg, index) => {
                    const isAssistant = msg.role === 'assistant';
                    return (
                      <div
                        key={index}
                        className={`flex gap-2.5 max-w-[88%] ${isAssistant ? 'self-start' : 'self-end flex-row-reverse'}`}
                      >
                        {isAssistant ? (
                          <div className="w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-1 shadow-2xs">
                            AI
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-1 shadow-2xs">
                            Me
                          </div>
                        )}

                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                            isAssistant
                              ? 'bg-white text-slate-900 border border-slate-200/90 rounded-tl-none'
                              : 'bg-sky-600 text-white rounded-tr-none font-medium'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}

                  {/* AI Typing Indicator */}
                  {sending && (
                    <div className="flex gap-2.5 max-w-[85%] self-start">
                      <div className="w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-1">
                        AI
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-2xs">
                        <span className="w-2 h-2 bg-sky-600 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-sky-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-2 h-2 bg-sky-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    </div>
                  )}

                  {/* Quick-Reply Option Pills */}
                  {!sending && session?.status === 'in_progress' && currentOptions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 pl-9">
                      {currentOptions.map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => handleSendMessage(opt)}
                          className="px-3 py-1.5 bg-white hover:bg-sky-50 text-sky-700 hover:text-sky-800 text-xs font-semibold rounded-xl border border-sky-200 shadow-2xs transition-all active:scale-95 cursor-pointer text-left"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </>
              )}
            </div>
          )}

          {/* Drawer Footer Input & Controls */}
          <div className="p-3 bg-white border-t border-slate-200 flex flex-col gap-2 shrink-0">
            {session?.status === 'completed' ? (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-teal-800">
                  ✓ Case-Taking Completed
                </span>
                <button
                  type="button"
                  onClick={handleStartNewSession}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  Start New Session
                </button>
              </div>
            ) : (
              <>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your answer here..."
                    disabled={sending || loading || !session}
                    className="flex-grow p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition-all disabled:opacity-50"
                  />

                  <button
                    type="submit"
                    disabled={sending || !inputMessage.trim() || !session}
                    className="w-10 h-10 bg-sky-600 hover:bg-sky-700 text-white rounded-xl flex items-center justify-center transition-colors shadow-2xs disabled:opacity-40 cursor-pointer shrink-0"
                    title="Send message"
                  >
                    <span className="material-symbols-outlined text-[20px]">send</span>
                  </button>
                </form>

                {session && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                    <span className="text-slate-400">
                      Asking 1 question at a time
                    </span>

                    <button
                      type="button"
                      onClick={handleCompleteSession}
                      disabled={sending || loading}
                      className="text-teal-700 hover:text-teal-900 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      <span>End & Save Case</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

        </aside>
      )}
    </>
  );
}
