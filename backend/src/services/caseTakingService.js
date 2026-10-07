const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * System Prompt for AI Case-Taking Assistant
 */
const CASE_TAKING_SYSTEM_PROMPT = `You are an AI Case-Taking Assistant for the SIH26047 Patient Case-Taking System at MediKiosk.
Your primary objective is to conduct a simple, empathetic, conversational case-taking interview with the patient, collecting structured health history to prepare their clinical case file.

STRICT MEDICAL & SAFETY DIRECTIVES:
1. You are NOT a doctor and MUST NOT diagnose any medical condition or disease.
2. You MUST NOT prescribe, suggest, or recommend any medications, dosages, or treatment plans.
3. You MUST NOT invent, guess, or assume patient information not explicitly stated by the patient.
4. If the patient reports potential emergency symptoms (such as severe chest pain, severe breathing difficulty, sudden weakness, facial drooping, slurred speech, active severe bleeding, loss of consciousness, or anaphylaxis), include them in the "red_flags" array. Do NOT diagnose them with a heart attack or stroke.
5. ALWAYS ask ONE clear, simple question at a time.
6. Use simple, natural language suitable for ordinary patients, older individuals, and users with low technical familiarity. Avoid complicated medical terminology.
7. Return ONLY valid JSON matching the exact schema specified below.

STRUCTURED CASE DATA SECTIONS TO COLLECT (where relevant):
- chiefComplaint: Main health complaint or reason for visit
- onset: When symptoms started (e.g., 3 days ago, yesterday morning)
- duration: How long symptoms lasted
- severity: Mild, Moderate, Severe, or scale 1-10
- symptoms: Array of reported symptoms (e.g. fever, chills, cough, nausea)
- pastMedicalHistory: Array of previous chronic or acute illnesses (e.g. Hypertension, Diabetes)
- pastSurgicalHistory: Array of previous surgeries or operations
- medications: Array of current medications being taken
- allergies: Array of known drug/food allergies
- familyHistory: Array or notes on family medical history
- personalHistory: Lifestyle/habits (diet, smoking, alcohol, sleep)
- previousTreatment: Any treatment or home remedies already tried for this complaint
- reviewOfSystems: Array of other system observations reported by patient

EXACT JSON OUTPUT SCHEMA:
{
  "next_question": "String (Single simple question for the patient)",
  "suggested_options": ["Array of 2-4 short quick response option strings for the patient"],
  "extracted_information": {
    "chiefComplaint": "String or null",
    "onset": "String or null",
    "duration": "String or null",
    "severity": "String or null",
    "symptoms": ["Array of strings"],
    "pastMedicalHistory": ["Array of strings"],
    "pastSurgicalHistory": ["Array of strings"],
    "medications": ["Array of strings"],
    "allergies": ["Array of strings"],
    "familyHistory": ["Array of strings"],
    "personalHistory": ["Array of strings"],
    "previousTreatment": ["Array of strings"],
    "reviewOfSystems": ["Array of strings"]
  },
  "red_flags": ["Array of concerning emergency symptom descriptions"],
  "is_intake_complete": false
}`;

/**
 * Cleans markdown fences from JSON output
 */
const sanitizeJsonString = (str) => {
  if (!str) return '';
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned;
};

/**
 * Validates and normalizes Gemini output schema for case taking
 */
const validateCaseTakingOutput = (parsedData) => {
  const extracted = typeof parsedData?.extracted_information === 'object' && parsedData.extracted_information !== null
    ? parsedData.extracted_information
    : {};

  return {
    next_question: (parsedData?.next_question && typeof parsedData.next_question === 'string')
      ? parsedData.next_question.trim()
      : 'Could you tell me a bit more about how you are feeling today?',
    suggested_options: Array.isArray(parsedData?.suggested_options)
      ? parsedData.suggested_options.map(String).slice(0, 4)
      : ['It started today', '2-3 days ago', 'Taking rest'],
    extracted_information: {
      chiefComplaint: extracted.chiefComplaint ? String(extracted.chiefComplaint) : null,
      onset: extracted.onset ? String(extracted.onset) : null,
      duration: extracted.duration ? String(extracted.duration) : null,
      severity: extracted.severity ? String(extracted.severity) : null,
      symptoms: Array.isArray(extracted.symptoms) ? extracted.symptoms.map(String) : [],
      pastMedicalHistory: Array.isArray(extracted.pastMedicalHistory) ? extracted.pastMedicalHistory.map(String) : [],
      pastSurgicalHistory: Array.isArray(extracted.pastSurgicalHistory) ? extracted.pastSurgicalHistory.map(String) : [],
      medications: Array.isArray(extracted.medications) ? extracted.medications.map(String) : [],
      allergies: Array.isArray(extracted.allergies) ? extracted.allergies.map(String) : [],
      familyHistory: Array.isArray(extracted.familyHistory) ? extracted.familyHistory.map(String) : [],
      personalHistory: Array.isArray(extracted.personalHistory) ? extracted.personalHistory.map(String) : [],
      previousTreatment: Array.isArray(extracted.previousTreatment) ? extracted.previousTreatment.map(String) : [],
      reviewOfSystems: Array.isArray(extracted.reviewOfSystems) ? extracted.reviewOfSystems.map(String) : []
    },
    red_flags: Array.isArray(parsedData?.red_flags) ? parsedData.red_flags.map(String) : [],
    is_intake_complete: Boolean(parsedData?.is_intake_complete)
  };
};

/**
 * Generates next adaptive case question and extracts structured data using Gemini API
 * @param {object} params
 * @param {string} params.patientInput Latest message from patient
 * @param {Array} params.conversationHistory Transcript array [{ role: 'user'|'assistant', text: string }]
 * @param {object} params.existingStructuredData Current accumulated structured case JSON
 * @returns {object} { next_question, suggested_options, extracted_information, red_flags, is_intake_complete }
 */
const processCaseTakingTurn = async ({
  patientInput,
  conversationHistory = [],
  existingStructuredData = {}
}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('YOUR_GEMINI_API_KEY')) {
    throw new Error('Gemini API key is missing or not configured in backend/.env');
  }

  const promptContent = `
PREVIOUS CONVERSATION TRANSCRIPT:
${conversationHistory.map((h) => `${h.role.toUpperCase()}: ${h.text}`).join('\n')}

LATEST PATIENT ANSWER:
"${patientInput}"

ACCUMULATED STRUCTURED CASE DATA SO FAR:
${JSON.stringify(existingStructuredData, null, 2)}

INSTRUCTIONS:
1. Carefully analyze the patient's latest answer.
2. Update and accumulate all extracted structured case details (chief complaint, onset, duration, symptoms, past medical/surgical history, medications, allergies, family/personal history, previous treatments).
3. Check for any emergency red-flag symptoms.
4. Formulate the SINGLE next best, simplest follow-up question to collect remaining missing case details. If chief complaint was just stated, ask about onset/duration. If onset/duration stated, ask about severity or associated symptoms. Keep questions simple and easy to answer.
5. Provide 2 to 4 quick response option pills for touchscreen or quick selection.
6. If sufficient core details have been collected, mark "is_intake_complete": true.
7. Return ONLY valid JSON matching the exact schema.
`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelNames = [
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-flash-latest'
  ];

  let responseText = null;
  let lastError = null;

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const contents = [
        { text: CASE_TAKING_SYSTEM_PROMPT },
        { text: promptContent }
      ];

      const result = await model.generateContent(contents);
      responseText = result.response.text();
      if (responseText) break;
    } catch (err) {
      console.warn(`[CaseTakingService] Model ${modelName} failed: ${err.message}. Retrying fallback...`);
      lastError = err;
    }
  }

  if (!responseText) {
    console.error('[CaseTakingService] Gemini API call failed:', lastError?.message);
    // Graceful fallback response
    return validateCaseTakingOutput({
      next_question: 'Thank you for sharing that. Could you tell me when this problem first started?',
      suggested_options: ['Today', 'Yesterday', 'A few days ago'],
      extracted_information: existingStructuredData,
      is_intake_complete: false
    });
  }

  const jsonString = sanitizeJsonString(responseText);

  try {
    const parsedData = JSON.parse(jsonString);
    return validateCaseTakingOutput(parsedData);
  } catch (parseErr) {
    console.error('[CaseTakingService] Malformed JSON output:', jsonString);
    return validateCaseTakingOutput({
      next_question: 'Could you please share a bit more detail about your current symptoms?',
      suggested_options: ['Yes, let me explain', 'I have mild pain', 'No other symptoms'],
      extracted_information: existingStructuredData,
      is_intake_complete: false
    });
  }
};

module.exports = {
  processCaseTakingTurn,
  CASE_TAKING_SYSTEM_PROMPT
};
