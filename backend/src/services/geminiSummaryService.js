const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiSummaryService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  getModelsToTry() {
    return [
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.6-flash',
      'gemini-3.8-flash',
      'gemini-flash-latest'
    ];
  }

  /**
   * Generate structured clinical summary using Gemini with safe JSON parsing and fallback.
   */
  async generateClinicalSummary(clinicalInputData) {
    if (!this.apiKey) {
      console.warn('[GeminiSummaryService] GEMINI_API_KEY not set. Using safe direct DB fallback.');
      return this.buildFallbackSummary(clinicalInputData, 'GEMINI_API_KEY_MISSING');
    }

    const systemPrompt = `You are an expert clinical history summarization assistant for the MediKiosk intake system.

CRITICAL MEDICAL & SAFETY RULES:
1. You MUST summarize ONLY the information provided in the input object.
2. NEVER invent, infer, or hallucinate facts, duration, symptoms, lab values, or medical history.
3. NEVER make medical diagnoses (e.g. do not turn an abnormal lab result into a disease diagnosis).
4. NEVER prescribe treatments, recommend medications, or alter dosages.
5. Clearly distinguish patient-reported information from document-derived information.
6. Preserve uncertainty. If information for a section was not provided or not assessed, explicitly list it as "Not provided" or "Not assessed".
7. Deterministic emergency red flags must be preserved in the redFlags array.
8. Output STRICT, VALID JSON ONLY. Do not include markdown code block backticks (e.g., no \`\`\`json).

EXPECTED JSON SCHEMA STRUCTURE:
{
  "patientOverview": {
    "patientId": "...",
    "name": "...",
    "age": "...",
    "gender": "...",
    "language": "..."
  },
  "chiefComplaint": {
    "text": "...",
    "duration": "...",
    "source": "patient_reported"
  },
  "historyOfPresentIllness": {
    "onset": "...",
    "duration": "...",
    "progression": "...",
    "location": "...",
    "character": "...",
    "severity": "...",
    "associatedSymptoms": [],
    "aggravatingFactors": [],
    "relievingFactors": [],
    "relevantNegatives": [],
    "rawText": "..."
  },
  "pastMedicalHistory": [
    { "value": "...", "source": "patient_reported | medical_document", "verified": false }
  ],
  "pastSurgicalHistory": [
    { "procedure": "...", "date": "...", "details": "...", "source": "..." }
  ],
  "currentMedications": [
    {
      "name": "...",
      "dose": "...",
      "frequency": "...",
      "route": "...",
      "duration": "...",
      "source": "patient_reported | extracted_from_document",
      "isPatientReported": true,
      "isDocumentExtracted": false
    }
  ],
  "drugAllergies": [
    { "allergen": "...", "reaction": "...", "severity": "...", "source": "..." }
  ],
  "familyHistory": [
    { "condition": "...", "relation": "...", "source": "..." }
  ],
  "personalHistory": {
    "diet": "...",
    "appetite": "...",
    "sleep": "...",
    "bowel": "...",
    "bladder": "...",
    "smoking": "...",
    "alcohol": "...",
    "tobacco": "...",
    "occupation": "...",
    "lifestyle": "..."
  },
  "reviewOfSystems": {},
  "previousInvestigations": [
    {
      "testName": "...",
      "testDate": "...",
      "resultValue": "...",
      "unit": "...",
      "referenceRange": "...",
      "isAbnormal": false,
      "source": "medical_document"
    }
  ],
  "documentFindings": [],
  "ayushHistory": {
    "prakriti": "...",
    "vikriti": "...",
    "sara": "...",
    "samhanana": "...",
    "pramana": "...",
    "satmya": "...",
    "sattva": "...",
    "aharaShakti": "...",
    "vyayamaShakti": "...",
    "vaya": "...",
    "summaryText": "..."
  },
  "redFlags": [
    { "symptom": "...", "severity": "HIGH", "message": "..." }
  ],
  "missingInformation": [
    "Drug allergies: Not assessed",
    "Family history: Not provided"
  ],
  "conflicts": [
    { "field": "...", "patientValue": "...", "documentValue": "...", "notes": "Source conflict — physician review required" }
  ],
  "clinicalSummaryText": "Comprehensive, clean, scannable text summary for physician."
}`;

    const userContent = `Here is the consolidated patient data to summarize:\n${JSON.stringify(clinicalInputData, null, 2)}`;

    const modelsToTry = this.getModelsToTry();
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const response = await model.generateContent([
          { text: systemPrompt },
          { text: userContent }
        ]);

        const rawText = response.response.text();
        const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedJSON = JSON.parse(cleanedText);

        if (parsedJSON && (parsedJSON.chiefComplaint || parsedJSON.clinicalSummaryText)) {
          return parsedJSON;
        }
      } catch (err) {
        console.warn(`[GeminiSummaryService] Failed with model ${modelName}: ${err.message}`);
        lastError = err;
      }
    }

    console.error('[GeminiSummaryService] All Gemini models failed or returned invalid JSON. Using safe fallback.', lastError);
    return this.buildFallbackSummary(clinicalInputData, lastError ? lastError.message : 'API_ERROR');
  }

  /**
   * Deterministic safe fallback summary generation if Gemini API is offline or returns error.
   */
  buildFallbackSummary(data, reason = '') {
    const chiefComplaintText = data.chiefComplaint?.text || data.clinicalAnswers?.chief_complaint || 'Not provided';
    const missingInfo = [];

    if (!data.drugAllergies || data.drugAllergies.length === 0) {
      missingInfo.push(data.allergiesAssessed ? 'Drug allergies: No known drug allergies reported' : 'Drug allergies: Not assessed');
    }
    if (!data.familyHistory || data.familyHistory.length === 0) {
      missingInfo.push('Family history: Not provided');
    }
    if (!data.pastSurgicalHistory || data.pastSurgicalHistory.length === 0) {
      missingInfo.push('Past surgical history: Not provided');
    }

    return {
      patientOverview: {
        patientId: data.patientId,
        name: data.patientName || 'Patient',
        age: data.patientAge || 'Not specified',
        gender: data.patientGender || 'Not specified',
        language: data.language || 'en'
      },
      chiefComplaint: {
        text: chiefComplaintText,
        duration: data.chiefComplaint?.duration || '',
        source: 'patient_reported'
      },
      historyOfPresentIllness: data.historyOfPresentIllness || {
        rawText: typeof data.clinicalAnswers?.hpi === 'string' ? data.clinicalAnswers.hpi : 'Not provided'
      },
      pastMedicalHistory: data.pastMedicalHistory || [],
      pastSurgicalHistory: data.pastSurgicalHistory || [],
      currentMedications: data.currentMedications || [],
      drugAllergies: data.drugAllergies || [],
      familyHistory: data.familyHistory || [],
      personalHistory: data.personalHistory || { diet: 'Not provided', sleep: 'Not provided' },
      reviewOfSystems: data.reviewOfSystems || {},
      previousInvestigations: data.previousInvestigations || [],
      documentFindings: data.documentFindings || [],
      ayushHistory: data.ayushHistory || { summaryText: 'AYUSH Dashavidha Pariksha: Not assessed' },
      redFlags: data.redFlags || [],
      missingInformation: missingInfo,
      conflicts: data.conflicts || [],
      clinicalSummaryText: `PATIENT CLINICAL HISTORY SUMMARY (Compiled via MediKiosk Safe Engine)
Patient: ${data.patientName || 'Patient'}
Chief Complaint: ${chiefComplaintText}
History of Present Illness: ${data.historyOfPresentIllness?.rawText || 'Refer to structured intake'}
Medications: ${data.currentMedications?.length ? data.currentMedications.map(m => m.name).join(', ') : 'None reported'}
Allergies: ${data.drugAllergies?.length ? data.drugAllergies.map(a => a.allergen).join(', ') : 'No known drug allergies reported'}
Red Flags: ${data.redFlags?.length ? data.redFlags.map(r => r.symptom).join(', ') : 'None'}
[Note: Summary compiled with rule-based safety engine. Reason: ${reason}]`
    };
  }
}

module.exports = new GeminiSummaryService();
