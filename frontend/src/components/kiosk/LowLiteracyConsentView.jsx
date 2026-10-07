import React, { useState, useEffect } from 'react';
import { grantConsent, revokeConsent } from '../../services/interoperabilityService';
import { speechOutputService } from '../../services/speechOutputService';

const CONSENT_TEXTS = {
  en: {
    title: 'Patient Privacy & Data Sharing Consent',
    subtitle: 'Your health information and uploaded reports will be used to prepare your clinical record for your doctor.',
    audioText: 'Your health information and uploaded reports will be used to prepare your clinical record for your healthcare provider. Please review your choices below.',
    scopeClinicalTitle: '1. Clinical History Collection',
    scopeClinicalDesc: 'Allow MediKiosk to collect and structure your symptoms and health history.',
    scopeDocTitle: '2. Medical Document Processing',
    scopeDocDesc: 'Allow uploaded prescriptions and lab reports to be extracted for your doctor.',
    scopeHisTitle: '3. Share with Hospital Doctor / HIS',
    scopeHisDesc: 'Allow structured clinical summary to be sent to your attending doctor.',
    scopeAbdmTitle: '4. ABDM / ABHA Record Sharing',
    scopeAbdmDesc: 'Allow record sharing via ABDM health repository when supported.',
    acceptBtn: 'I Understand & Give Consent ✓',
    declineBtn: 'Decline / Revoke Consent ✖',
    revokedNotice: 'Consent Revoked. Information will not be shared externally.'
  },
  hi: {
    title: 'मरीज गोपनीयता और डेटा सहमति',
    subtitle: 'आपकी स्वास्थ्य जानकारी और रिपोर्ट आपके डॉक्टर के लिए रिकॉर्ड तैयार करने हेतु उपयोग की जाएगी।',
    audioText: 'आपकी स्वास्थ्य जानकारी और अपलोड की गई रिपोर्ट डॉक्टर के देखने के लिए इस्तेमाल की जाएगी। कृपया नीचे सहमति दें।',
    scopeClinicalTitle: '1. मुख्य स्वास्थ्य इतिहास संग्रह',
    scopeClinicalDesc: 'मेडीकियोस्क को आपके लक्षणों और इतिहास को एकत्रित करने की अनुमति दें।',
    scopeDocTitle: '2. मेडिकल दस्तावेज प्रोसेसिंग',
    scopeDocDesc: 'अपलोड की गई पर्चियों और लैब रिपोर्ट को प्रोसेस करने की अनुमति दें।',
    scopeHisTitle: '3. अस्पताल / डॉक्टर के साथ साझा करें',
    scopeHisDesc: 'आपके डॉक्टर को समरी रिकॉर्ड भेजने की अनुमति दें।',
    scopeAbdmTitle: '4. आयुष्मान भारत (ABDM) शेयरिंग',
    scopeAbdmDesc: 'एबीडीएम डिजिटल स्वास्थ्य नेटवर्क के साथ शेयर करने की अनुमति दें।',
    acceptBtn: 'मैं समझता/समझती हूँ - सहमति दें ✓',
    declineBtn: 'अस्वीकार करें ✖',
    revokedNotice: 'सहमति वापस ली गई। जानकारी बाहरी रूप से साझा नहीं की जाएगी।'
  },
  bn: {
    title: 'রোগীর গোপনীয়তা ও তথ্য শেয়ারিং সম্মতি',
    subtitle: 'আপনার স্বাস্থ্য তথ্য ও রিপোর্ট ডাক্তারের চিকিৎসার সুবিধার জন্য তৈরি করা হবে।',
    audioText: 'আপনার স্বাস্থ্য তথ্য ও আপলোড করা রিপোর্ট ডাক্তারের চিকিৎসার সুবিধার্থে রেকর্ড হিসেবে তৈরি করা হবে।',
    scopeClinicalTitle: '১. শারীরিক তথ্য সংগ্রহ',
    scopeClinicalDesc: 'মেডিকিয়োস্ককে আপনার লক্ষণ ও ইতিহাস সংগ্রহের অনুমতি দিন।',
    scopeDocTitle: '২. মেডিকেল রিপোর্ট প্রসেসিং',
    scopeDocDesc: 'প্রেসক্রিপশন ও ল্যাব রিপোর্ট স্ক্যান করার অনুমতি দিন।',
    scopeHisTitle: '৩. হাসপাতালের ডাক্তারের সাথে শেয়ার',
    scopeHisDesc: 'আপনার ডাক্তারকে ক্লিনিক্যাল সামারি পাঠাতে অনুমতি দিন।',
    scopeAbdmTitle: '৪. ABDM / ABHA ডিজিটাল শেয়ারিং',
    scopeAbdmDesc: 'ডিজিটাল স্বাস্থ্য নেটওয়ার্কে রেকর্ড যুক্ত করার অনুমতি দিন।',
    acceptBtn: 'আমি বুঝেছি - সম্মতি দিন ✓',
    declineBtn: 'প্রত্যাখ্যান করুন ✖',
    revokedNotice: 'সম্মতি প্রত্যাহার করা হয়েছে।'
  }
};

const LowLiteracyConsentView = ({
  clinicalSessionId,
  patientId,
  language = 'en',
  onConsentGranted,
  onConsentDeclined
}) => {
  const [scope, setScope] = useState({
    clinicalIntake: true,
    documentProcessing: true,
    hisSharing: true,
    abdmSharing: true
  });

  const [submitting, setSubmitting] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [error, setError] = useState(null);
  const [consentGranted, setConsentGranted] = useState(true);

  const t = CONSENT_TEXTS[language] || CONSENT_TEXTS.en;

  const playAudioExplanation = () => {
    if (isPlayingAudio) {
      speechOutputService.stop();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    speechOutputService.speak(t.audioText, language, {
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false)
    });
  };

  const handleToggleScope = (key) => {
    setScope((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleGrant = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const res = await grantConsent({
        clinicalSessionId,
        patientId,
        scope,
        language
      });

      if (res.success) {
        setConsentGranted(true);
        if (onConsentGranted) onConsentGranted(res.consent);
      }
    } catch (err) {
      setError('Failed to record consent: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const res = await revokeConsent({
        clinicalSessionId,
        patientId
      });

      if (res.success) {
        setConsentGranted(false);
        if (onConsentDeclined) onConsentDeclined(res.consent);
      }
    } catch (err) {
      setError('Failed to revoke consent: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        {/* Header Icon & Title */}
        <div style={styles.header}>
          <div style={styles.iconCircle}>🔒</div>
          <div>
            <h2 style={styles.title}>{t.title}</h2>
            <p style={styles.subtitle}>{t.subtitle}</p>
          </div>
        </div>

        {/* Audio Explanation Button */}
        <div style={styles.audioRow}>
          <button
            type="button"
            onClick={playAudioExplanation}
            style={{
              ...styles.audioBtn,
              ...(isPlayingAudio ? styles.audioBtnPlaying : {})
            }}
          >
            {isPlayingAudio ? '🔊 Playing Explanation...' : '🔊 Listen to Explanation (Audio)'}
          </button>
        </div>

        {/* Granular Scopes List */}
        <div style={styles.scopeList}>
          {/* Scope 1 */}
          <div style={styles.scopeItem} onClick={() => handleToggleScope('clinicalIntake')}>
            <input
              type="checkbox"
              checked={scope.clinicalIntake}
              onChange={() => {}}
              style={styles.checkbox}
            />
            <div>
              <h4 style={styles.scopeTitle}>📋 {t.scopeClinicalTitle}</h4>
              <p style={styles.scopeDesc}>{t.scopeClinicalDesc}</p>
            </div>
          </div>

          {/* Scope 2 */}
          <div style={styles.scopeItem} onClick={() => handleToggleScope('documentProcessing')}>
            <input
              type="checkbox"
              checked={scope.documentProcessing}
              onChange={() => {}}
              style={styles.checkbox}
            />
            <div>
              <h4 style={styles.scopeTitle}>📄 {t.scopeDocTitle}</h4>
              <p style={styles.scopeDesc}>{t.scopeDocDesc}</p>
            </div>
          </div>

          {/* Scope 3 */}
          <div style={styles.scopeItem} onClick={() => handleToggleScope('hisSharing')}>
            <input
              type="checkbox"
              checked={scope.hisSharing}
              onChange={() => {}}
              style={styles.checkbox}
            />
            <div>
              <h4 style={styles.scopeTitle}>🏥 {t.scopeHisTitle}</h4>
              <p style={styles.scopeDesc}>{t.scopeHisDesc}</p>
            </div>
          </div>

          {/* Scope 4 */}
          <div style={styles.scopeItem} onClick={() => handleToggleScope('abdmSharing')}>
            <input
              type="checkbox"
              checked={scope.abdmSharing}
              onChange={() => {}}
              style={styles.checkbox}
            />
            <div>
              <h4 style={styles.scopeTitle}>🆔 {t.scopeAbdmTitle}</h4>
              <p style={styles.scopeDesc}>{t.scopeAbdmDesc}</p>
            </div>
          </div>
        </div>

        {error && <div style={styles.errorText}>⚠️ {error}</div>}

        {/* Action Buttons */}
        <div style={styles.actions}>
          <button
            type="button"
            onClick={handleRevoke}
            disabled={submitting}
            style={styles.declineBtn}
          >
            {t.declineBtn}
          </button>

          <button
            type="button"
            onClick={handleGrant}
            disabled={submitting}
            style={styles.grantBtn}
          >
            {submitting ? 'Recording Consent...' : t.acceptBtn}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#f8fafc',
    minHeight: '400px'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '28px',
    maxWidth: '750px',
    width: '100%',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)',
    border: '2px solid #e2e8f0'
  },
  header: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    marginBottom: '16px'
  },
  iconCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.8rem',
    flexShrink: 0
  },
  title: {
    margin: '0 0 4px 0',
    color: '#0f172a',
    fontSize: '1.35rem',
    fontWeight: '800'
  },
  subtitle: {
    margin: 0,
    color: '#475569',
    fontSize: '0.95rem',
    lineHeight: '1.4'
  },
  audioRow: {
    marginBottom: '20px'
  },
  audioBtn: {
    padding: '10px 18px',
    borderRadius: '20px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f1f5f9',
    color: '#1e293b',
    fontWeight: '600',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  audioBtnPlaying: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
    color: '#1d4ed8'
  },
  scopeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px'
  },
  scopeItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    padding: '14px 18px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#fafafa',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  checkbox: {
    width: '22px',
    height: '22px',
    marginTop: '2px',
    cursor: 'pointer'
  },
  scopeTitle: {
    margin: '0 0 2px 0',
    color: '#0f172a',
    fontSize: '0.95rem',
    fontWeight: '700'
  },
  scopeDesc: {
    margin: 0,
    color: '#64748b',
    fontSize: '0.85rem'
  },
  errorText: {
    color: '#dc2626',
    fontSize: '0.9rem',
    marginBottom: '16px'
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px'
  },
  declineBtn: {
    padding: '14px 22px',
    borderRadius: '10px',
    border: '1px solid #fca5a5',
    backgroundColor: '#fff5f5',
    color: '#991b1b',
    fontWeight: '700',
    cursor: 'pointer'
  },
  grantBtn: {
    padding: '14px 28px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#16a34a',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: '1rem',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.3)'
  }
};

export default LowLiteracyConsentView;
