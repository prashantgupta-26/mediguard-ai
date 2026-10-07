import React, { useState, useEffect } from 'react';
import { getAyushQuestions, submitAyushIntake } from '../../services/clinicalSummaryService';
import { speechOutputService } from '../../services/speechOutputService';

const AyushIntakeView = ({ clinicalSessionId, patientId, language = 'en', onComplete, onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');

  useEffect(() => {
    const fetchQ = async () => {
      try {
        setLoading(true);
        const res = await getAyushQuestions();
        if (res.success && res.questions) {
          setQuestions(res.questions);
        }
      } catch (err) {
        setError('Failed to load AYUSH questionnaire');
      } finally {
        setLoading(false);
      }
    };
    fetchQ();
  }, []);

  const currentQ = questions[currentIndex];

  useEffect(() => {
    if (currentQ) {
      const promptText = currentQ.question[language] || currentQ.question.en;
      speechOutputService.speak(promptText, language);
    }
  }, [currentIndex, currentQ, language]);

  const handleOptionSelect = (optionId) => {
    if (!currentQ) return;
    const updatedAnswers = {
      ...answers,
      [currentQ.id]: optionId
    };
    setAnswers(updatedAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else if (onBack) {
      onBack();
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await submitAyushIntake({
        clinicalSessionId,
        patientId,
        answers,
        language
      });
      if (onComplete) {
        onComplete(answers);
      }
    } catch (err) {
      setError('Failed to save AYUSH assessment: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'bn' ? 'bn-IN' : 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setVoiceText(transcript);
      if (currentQ) {
        setAnswers((prev) => ({ ...prev, [currentQ.id]: transcript }));
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner}></div>
          <p style={{ marginTop: '15px', color: '#64748b' }}>Loading AYUSH Dashavidha Pariksha Intake...</p>
        </div>
      </div>
    );
  }

  if (!currentQ) return null;

  const currentAnswer = answers[currentQ.id];
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header Badges */}
        <div style={styles.header}>
          <div style={styles.ayushBadge}>🌿 AYUSH Dashavidha Pariksha</div>
          <div style={styles.progressText}>
            Question {currentIndex + 1} of {questions.length}
          </div>
        </div>

        {/* Category & Question Title */}
        <h3 style={styles.categoryTitle}>{currentQ.category}</h3>
        <h2 style={styles.questionText}>{currentQ.question[language] || currentQ.question.en}</h2>

        {/* Options List */}
        <div style={styles.optionsGrid}>
          {currentQ.options.map((opt) => {
            const isSelected = currentAnswer === opt.id || currentAnswer === opt.label.en;
            return (
              <button
                key={opt.id}
                onClick={() => handleOptionSelect(opt.id)}
                style={{
                  ...styles.optionBtn,
                  ...(isSelected ? styles.optionBtnSelected : {})
                }}
              >
                <div style={styles.radioDot}>{isSelected && <div style={styles.radioDotInner} />}</div>
                <span style={styles.optionLabel}>{opt.label[language] || opt.label.en}</span>
              </button>
            );
          })}
        </div>

        {/* Voice Input Section */}
        <div style={styles.voiceSection}>
          <button
            onClick={toggleVoiceInput}
            style={{
              ...styles.voiceBtn,
              ...(isListening ? styles.voiceBtnListening : {})
            }}
          >
            {isListening ? '🎙️ Listening... (Speak answer)' : '🎤 Speak Answer (Voice)'}
          </button>
          {voiceText && (
            <p style={styles.voicePreview}>
              Recognized Voice Answer: <strong>"{voiceText}"</strong>
            </p>
          )}
        </div>

        {error && <div style={styles.errorBanner}>⚠️ {error}</div>}

        {/* Navigation Buttons */}
        <div style={styles.footerNav}>
          <button onClick={handlePrev} style={styles.navBackBtn}>
            ← Back
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ ...styles.navNextBtn, backgroundColor: '#059669' }}
            >
              {submitting ? 'Saving AYUSH Intake...' : 'Complete AYUSH Intake ✓'}
            </button>
          ) : (
            <button onClick={handleNext} style={styles.navNextBtn}>
              Next Question →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#f8fafc',
    minHeight: '450px'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '30px',
    maxWidth: '700px',
    width: '100%',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)',
    border: '1px solid #e2e8f0'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  ayushBadge: {
    backgroundColor: '#ecfdf5',
    color: '#047857',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '700',
    border: '1px solid #a7f3d0'
  },
  progressText: {
    color: '#64748b',
    fontSize: '0.9rem',
    fontWeight: '600'
  },
  categoryTitle: {
    color: '#0f766e',
    fontSize: '0.95rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: '0 0 6px 0',
    fontWeight: '700'
  },
  questionText: {
    color: '#1e293b',
    fontSize: '1.35rem',
    margin: '0 0 24px 0',
    fontWeight: '700',
    lineHeight: '1.4'
  },
  optionsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px'
  },
  optionBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    backgroundColor: '#ffffff',
    color: '#334155',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease'
  },
  optionBtnSelected: {
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
    color: '#065f46'
  },
  radioDot: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '2px solid #94a3b8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '14px',
    flexShrink: 0
  },
  radioDotInner: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#059669'
  },
  optionLabel: {
    lineHeight: '1.4'
  },
  voiceSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '20px',
    gap: '8px'
  },
  voiceBtn: {
    padding: '10px 20px',
    borderRadius: '20px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f1f5f9',
    color: '#334155',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  voiceBtnListening: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    color: '#b91c1c',
    animation: 'pulse 1.5s infinite'
  },
  voicePreview: {
    fontSize: '0.85rem',
    color: '#475569',
    fontStyle: 'italic',
    margin: 0
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '0.9rem',
    marginBottom: '16px',
    border: '1px solid #fecaca'
  },
  footerNav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '10px'
  },
  navBackBtn: {
    padding: '12px 24px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#475569',
    fontWeight: '600',
    cursor: 'pointer'
  },
  navNextBtn: {
    padding: '12px 28px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#0f766e',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '0.95rem',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(15, 118, 110, 0.2)'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #0f766e',
    borderRadius: '50%',
    margin: '0 auto',
    animation: 'spin 1s linear infinite'
  }
};

export default AyushIntakeView;
