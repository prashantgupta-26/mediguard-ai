const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * System Prompt guiding Gemini's role as a non-diagnostic clinical history assistant
 */
const CLINICAL_SYSTEM_PROMPT = `You are an AI Clinical History Intake Assistant for MediKiosk.
Your primary role is to interact with patients, understand their natural language symptoms (in English, Hindi, Hinglish, or Bengali), extract structured clinical history, identify missing information, and generate the next appropriate, simple, patient-friendly question.

STRICT MEDICAL & SAFETY RULES:
1. You are NOT a doctor.
2. You MUST NOT diagnose any medical condition or disease.
3. You MUST NOT prescribe or recommend any medications or dosages.
4. You MUST NOT suggest treatment plans or triage diagnosis.
5. You MUST NOT invent or assume patient information not explicitly stated by the patient.
6. If the patient describes potential emergency symptoms (such as chest pain with shortness of breath, severe breathing distress, sudden weakness, facial drooping, slurred speech, active seizure, severe bleeding), list them in the "red_flags" array. Do NOT diagnose them with a heart attack or stroke.
7. Return ONLY valid JSON matching the exact schema specified below.

SUPPORTED CLINICAL SECTIONS:
- chief_complaint (Chief Complaint)
- hpi (History of Present Illness)
- past_medical (Past Medical History)
- past_surgical (Past Surgical History)
- current_meds (Current Medications)
- drug_allergies (Drug Allergies)
- family_history (Family History)
- personal_history (Personal & Lifestyle History)
- diet (Diet History)
- sleep (Sleep History)
- substance_use (Substance Use)
- ros (Review of Systems)
- previous_investigations (Previous Lab Tests & Imaging)
- previous_diagnoses (Previous Known Diagnoses)
- additional_notes (Additional Patient Notes)

INTERACTION GOALS:
- Extract factual details into "extracted_information" (e.g. chief_complaint, duration, severity, location, associated_symptoms, past_conditions, current_medications, allergies).
- Determine what clinically relevant information is still missing for the active section or overall clinical intake.
- Formulate the next question in simple, natural, empathetic language matching the patient's selected interaction language.
- Provide 2 to 4 suggested quick response options for touchscreen users in "suggested_options".
- Indicate if the clinical intake has covered all relevant areas ("is_intake_complete": true).

EXACT JSON OUTPUT SCHEMA:
{
  "intent": "String (e.g. answer_provided, greeting, request_clarification)",
  "clinical_section": "String (e.g. chief_complaint, hpi, past_medical, etc.)",
  "extracted_information": {
    "chief_complaint": "String or null",
    "duration": "String or null",
    "severity": "String or null",
    "location": "String or null",
    "associated_symptoms": ["Array of strings"],
    "past_conditions": ["Array of strings"],
    "current_medications": ["Array of strings"],
    "allergies": ["Array of strings"],
    "family_history_notes": "String or null",
    "lifestyle_notes": "String or null"
  },
  "missing_information": ["Array of missing key fields"],
  "next_question": "String (Single simple question in selected language)",
  "suggested_options": ["Array of 2-4 short quick response strings in selected language"],
  "red_flags": ["Array of concerning symptom descriptions, if any"],
  "is_intake_complete": false,
  "confidence": 0.95
}`;

/**
 * Clean markdown JSON fences if present
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
 * Validates and sanitizes Gemini output schema
 */
const validateGeminiOutput = (parsedData, selectedLang = 'en') => {
  const defaultNextQuestion = selectedLang === 'hi' 
    ? 'क्या आपको इसके अलावा कोई और परेशानी हो रही है?' 
    : selectedLang === 'bn'
    ? 'আপনার কি এর পাশাপাশি অন্য কোনো সমস্যা হচ্ছে?'
    : 'Are you experiencing any other symptoms today?';

  return {
    intent: parsedData?.intent || 'answer_provided',
    clinical_section: parsedData?.clinical_section || 'chief_complaint',
    extracted_information: typeof parsedData?.extracted_information === 'object' && parsedData.extracted_information !== null
      ? parsedData.extracted_information
      : {},
    missing_information: Array.isArray(parsedData?.missing_information)
      ? parsedData.missing_information.map(String)
      : [],
    next_question: (parsedData?.next_question && typeof parsedData.next_question === 'string')
      ? parsedData.next_question.trim()
      : defaultNextQuestion,
    suggested_options: Array.isArray(parsedData?.suggested_options)
      ? parsedData.suggested_options.map(String)
      : [],
    red_flags: Array.isArray(parsedData?.red_flags)
      ? parsedData.red_flags.map(String)
      : [],
    is_intake_complete: Boolean(parsedData?.is_intake_complete),
    confidence: typeof parsedData?.confidence === 'number' ? parsedData.confidence : 0.9
  };
};

/**
 * Process patient interaction using Gemini API
 * @param {object} params
 * @param {string} params.patientInput Current answer or statement from patient
 * @param {string} params.language Language code ('en', 'hi', 'bn')
 * @param {Array} params.conversationHistory Prior transcript turns
 * @param {object} params.existingStructuredData Currently extracted structured data
 * @param {string} params.currentSection Active clinical section
 */
const processClinicalInteraction = async ({
  patientInput,
  language = 'en',
  conversationHistory = [],
  existingStructuredData = {},
  currentSection = 'chief_complaint'
}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('YOUR_GEMINI_API_KEY')) {
    throw new Error('Gemini API key is missing or invalid in backend environment configuration.');
  }

  const langNames = { en: 'English', hi: 'Hindi / Hinglish', bn: 'Bengali' };
  const targetLanguage = langNames[language] || 'English';

  const promptContent = `
PATIENT INTERACTION CONTEXT:
Selected Language for Patient: ${targetLanguage} (${language})
Current Clinical Section: ${currentSection}

EXISTING STRUCTURED CLINICAL DATA SO FAR:
${JSON.stringify(existingStructuredData, null, 2)}

CONVERSATION HISTORY SO FAR:
${conversationHistory.map((h) => `${h.role.toUpperCase()}: ${h.text}`).join('\n')}

LATEST PATIENT INPUT:
"${patientInput}"

TASK:
1. Analyze the patient's latest input.
2. Extract all clinical facts provided (symptom name, duration, severity, location, associated symptoms, medical history, medications, allergies, etc.).
3. Combine newly extracted information with existing structured clinical data.
4. Identify any red flags / concerning emergency symptoms.
5. Determine what essential information is still missing for this intake.
6. Formulate the next appropriate, simple, patient-friendly question in ${targetLanguage}.
7. Provide 2 to 4 suggested response options in ${targetLanguage}.
8. Return JSON strictly matching the specified JSON schema.
`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelNames = [
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-3.8-flash',
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
        },
        systemInstruction: CLINICAL_SYSTEM_PROMPT
      });

      const result = await model.generateContent(promptContent);
      responseText = result.response.text();
      if (responseText) break;
    } catch (err) {
      console.warn(`[GeminiClinicalService] Model ${modelName} call failed: ${err.message}. Retrying fallback...`);
      lastError = err;
    }
  }

  if (!responseText) {
    console.warn('[GeminiClinicalService] All Gemini models temporarily unavailable/busy:', lastError?.message);
    // Graceful structured fallback object so patient kiosk never crashes
    return validateGeminiOutput({
      intent: 'fallback_response',
      clinical_section: currentSection || 'chief_complaint',
      extracted_information: {
        last_patient_input: patientInput
      },
      next_question: language === 'hi' 
        ? 'हम आपकी प्रतिक्रिया दर्ज कर रहे हैं। क्या आप इस बारे में थोड़ा और बता सकते हैं?' 
        : language === 'bn'
        ? 'আমরা আপনার প্রতিক্রিয়া রেকর্ড করছি। আপনি কি এই সম্পর্কে আর কিছু বলতে পারেন?'
        : 'Thank you for sharing. Could you tell us a bit more about your symptoms?',
      suggested_options: language === 'hi'
        ? ['लक्षण गंभीर हैं', '1-2 दिन से है', 'दवा ली है']
        : language === 'bn'
        ? ['লক্ষণ গুরুতর', '১-২ দিন ধরে', 'ওষুধ খেয়েছি']
        : ['Symptoms are severe', 'Lasted 1-2 days', 'Taking medication'],
      confidence: 0.5
    }, language);
  }

  const jsonString = sanitizeJsonString(responseText);

  try {
    const parsedData = JSON.parse(jsonString);
    return validateGeminiOutput(parsedData, language);
  } catch (parseErr) {
    console.error('[GeminiClinicalService] Malformed JSON from Gemini:', jsonString);

    // Attempt second repair pass with Gemini
    try {
      const repairModel = genAI.getGenerativeModel({
        model: 'gemini-3.6-flash',
        generationConfig: { responseMimeType: 'application/json' }
      });
      const repairResult = await repairModel.generateContent(`Fix the following malformed JSON and return ONLY valid JSON matching the schema:\n${jsonString}`);
      const repairedText = sanitizeJsonString(repairResult.response.text());
      const repairedJson = JSON.parse(repairedText);
      return validateGeminiOutput(repairedJson, language);
    } catch (repairErr) {
      console.error('[GeminiClinicalService] Repair attempt also failed:', repairErr.message);
      throw new Error('Malformed JSON output from Gemini Clinical service.');
    }
  }
};

module.exports = {
  processClinicalInteraction,
  validateGeminiOutput,
  CLINICAL_SYSTEM_PROMPT
};
