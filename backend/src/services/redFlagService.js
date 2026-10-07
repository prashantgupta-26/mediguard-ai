/**
 * Layer 1: Deterministic Red-Flag Triage Engine
 * Checks patient input text and extracted symptoms against high-risk clinical emergency rules.
 * Does NOT diagnose diseases. Evaluates critical symptom combinations deterministically.
 */

const RED_FLAG_PATTERNS = [
  {
    id: 'CHEST_PAIN_DYSPNEA',
    severity: 'HIGH',
    symptom: 'Chest Pain with Shortness of Breath',
    message: 'Your symptoms may require urgent medical attention. Please notify the healthcare staff immediately.',
    matchAllOf: [
      ['chest pain', 'chest hurt', 'chest pressure', 'chest tightness', 'chest heavy', 'chest me', 'chest mein', 'seene me', 'seene mein', 'chhati me', 'chhati mein', 'buko dard', 'buker dard', 'chest discomfort'],
      ['breathing difficulty', 'shortness of breath', 'breathless', 'saans lene me', 'saans lene mein', 'saans phul', 'sans phul', 'dikkat', 'damped breath', 'hapan', 'shwas kosto']
    ]
  },
  {
    id: 'CHEST_PAIN_SOLO',
    severity: 'HIGH',
    symptom: 'Severe Chest Pain',
    message: 'Your symptoms may require urgent medical attention. Please wait for the healthcare staff.',
    matchAnyOf: [
      'chest pain', 'chest pressure', 'crushing chest pain', 'chest me dard', 'chest mein dard', 'seene mein dard', 'chhati mein dard', 'buker kathin dard', 'angina'
    ]
  },
  {
    id: 'STROKE_SIGNS',
    severity: 'HIGH',
    symptom: 'Possible Neurological Emergency (FAST)',
    message: 'Your symptoms may require urgent medical attention. Please alert the clinic receptionist or nurse immediately.',
    matchAnyOf: [
      'facial drooping', 'face drooping', 'arm weakness', 'leg weakness', 'sudden weakness', 'difficulty speaking', 'slurred speech',
      'ek taraf kamzori', 'chehra terha', 'bolne mein dikkat', 'mukh beka', 'kotha bolte koshto', 'paralysis'
    ]
  },
  {
    id: 'SEVERE_RESPIRATORY_DISTRESS',
    severity: 'HIGH',
    symptom: 'Severe Breathing Difficulty',
    message: 'Your symptoms may require urgent medical attention. Please wait for the healthcare staff.',
    matchAnyOf: [
      'severe breathing difficulty', 'cannot breathe', 'gasping for air', 'suffocating', 'saans nahi aa rahi', 'saans ruk rahi hai', 'shwas nite parchi na'
    ]
  },
  {
    id: 'UNCONSCIOUSNESS_SYNCOPE',
    severity: 'HIGH',
    symptom: 'Loss of Consciousness or Fainting',
    message: 'Your symptoms may require urgent medical attention. Please wait for the healthcare staff.',
    matchAnyOf: [
      'unconscious', 'fainted', 'passed out', 'blacked out', 'behoshi', 'behosh', 'ggyan harano', 'loss of consciousness'
    ]
  },
  {
    id: 'SEVERE_BLEEDING',
    severity: 'HIGH',
    symptom: 'Severe Uncontrolled Bleeding',
    message: 'Your symptoms may require urgent medical attention. Please notify healthcare staff immediately.',
    matchAnyOf: [
      'severe bleeding', 'uncontrolled bleeding', 'profuse bleeding', 'heavy blood loss', 'bahut khoon beh raha', 'khoon nikal raha hai', 'khoob roktokhoron'
    ]
  },
  {
    id: 'ACTIVE_SEIZURE',
    severity: 'HIGH',
    symptom: 'Seizure or Convulsion',
    message: 'Your symptoms may require urgent medical attention. Please wait for healthcare staff.',
    matchAnyOf: [
      'seizure', 'convulsion', 'fits', 'mirgi', 'dora', 'shaking uncontrollably'
    ]
  },
  {
    id: 'ANAPHYLAXIS',
    severity: 'HIGH',
    symptom: 'Severe Allergic Reaction',
    message: 'Your symptoms may require urgent medical attention. Please inform healthcare staff immediately.',
    matchAnyOf: [
      'swollen tongue', 'throat swelling', 'cannot swallow', 'severe allergic reaction', 'anaphylaxis', 'gala phool gaya', 'puro mukh fule geche'
    ]
  },
  {
    id: 'SELF_HARM_SUICIDAL',
    severity: 'HIGH',
    symptom: 'Self-Harm / Psychological Crisis',
    message: 'We care about your safety. Please speak directly with a healthcare provider right away.',
    matchAnyOf: [
      'suicide', 'suicidal', 'want to die', 'end my life', 'kill myself', 'self-harm', 'marne ka mann', 'khatam karne'
    ]
  }
];

/**
 * Normalizes input text for matching (lowercase, removes extra spaces and punctuation)
 */
const normalizeText = (text) => {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Evaluates patient text against Layer 1 deterministic rules
 * @param {string} patientInput Text entered or spoken by patient
 * @returns {object} { isRedFlag: boolean, redFlags: Array<{symptom, severity, layer, message}> }
 */
const checkDeterministicRedFlags = (patientInput) => {
  const norm = normalizeText(patientInput);
  if (!norm) {
    return { isRedFlag: false, redFlags: [] };
  }

  const triggeredFlags = [];

  for (const pattern of RED_FLAG_PATTERNS) {
    let triggered = false;

    // Check matchAllOf (e.g. chest pain AND shortness of breath)
    if (pattern.matchAllOf) {
      const allMatched = pattern.matchAllOf.every((phraseGroup) =>
        phraseGroup.some((phrase) => norm.includes(phrase))
      );
      if (allMatched) {
        triggered = true;
      }
    }

    // Check matchAnyOf
    if (!triggered && pattern.matchAnyOf) {
      if (pattern.matchAnyOf.some((phrase) => norm.includes(phrase))) {
        triggered = true;
      }
    }

    if (triggered) {
      triggeredFlags.push({
        id: pattern.id,
        symptom: pattern.symptom,
        severity: pattern.severity,
        layer: 'deterministic',
        message: pattern.message,
        timestamp: new Date()
      });
    }
  }

  return {
    isRedFlag: triggeredFlags.length > 0,
    redFlags: triggeredFlags
  };
};

module.exports = {
  checkDeterministicRedFlags,
  RED_FLAG_PATTERNS
};
