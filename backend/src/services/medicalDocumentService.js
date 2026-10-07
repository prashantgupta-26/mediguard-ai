const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const { processLabTestsEvaluator } = require('../utils/labRangeEvaluator');

/**
 * Dedicated System Prompt for Medical Document Information Extraction
 */
const DOCUMENT_EXTRACTION_SYSTEM_PROMPT = `You are an expert AI Medical Document Information Extraction System for MediKiosk.
Your task is to analyze uploaded medical documents (prescriptions, lab reports, discharge summaries, diagnostic reports, medical notes) in English, Hindi, or Bengali, including printed and handwritten documents.

CRITICAL SAFETY & EXTRACTION RULES:
1. Extract ONLY information explicitly written or visible in the document.
2. Do NOT diagnose the patient.
3. Do NOT provide treatment recommendations or prescribe medicines.
4. Do NOT infer missing details or guess values. Return null or empty arrays if not present.
5. HANDWRITING UNCERTAINTY: If handwriting is unclear, do NOT guess. Set "confidence" lower (e.g. 0.5 - 0.7) and set "needsReview": true. Preserve the raw text where possible.
6. Return ONLY valid JSON matching the exact schema below.

SUPPORTED DOCUMENT TYPES:
- prescription
- laboratory_report
- discharge_summary
- diagnostic_report
- medical_report
- other
- unknown

EXACT JSON SCHEMA OUTPUT:
{
  "documentType": "prescription | laboratory_report | discharge_summary | diagnostic_report | medical_report | other | unknown",
  "documentDate": "String (e.g. 15 Sep 2026) or null",
  "detectedLanguage": "en | hi | bn",
  "confidence": 0.90,
  "needsReview": false,
  "patient": {
    "name": "String or null",
    "age": "String or null",
    "gender": "String or null"
  },
  "facility": {
    "hospitalOrClinic": "String or null",
    "doctorName": "String or null"
  },
  "prescription": {
    "diagnosisOrIndication": "String or null",
    "medicines": [
      {
        "medicineName": "String",
        "dosage": "String or null",
        "frequency": "String or null",
        "duration": "String or null",
        "route": "String or null",
        "instructions": "String or null",
        "confidence": 0.95,
        "needsReview": false
      }
    ]
  },
  "laboratoryReport": {
    "laboratoryName": "String or null",
    "tests": [
      {
        "testName": "String",
        "result": "String",
        "unit": "String or null",
        "referenceRange": "String or null",
        "confidence": 0.95,
        "needsReview": false
      }
    ]
  },
  "dischargeSummary": {
    "hospitalName": "String or null",
    "admissionDate": "String or null",
    "dischargeDate": "String or null",
    "diagnosis": "String or null",
    "procedures": ["Array of strings"],
    "surgeries": ["Array of strings"],
    "medications": ["Array of strings"],
    "followUpInstructions": "String or null",
    "importantFindings": ["Array of strings"]
  },
  "generalFindings": {
    "diagnosesMentioned": ["Array of strings"],
    "observations": ["Array of strings"],
    "procedures": ["Array of strings"],
    "followUpInfo": "String or null"
  }
}`;

/**
 * Cleans markdown JSON fences
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
 * Extracts and structures medical document information using Gemini multimodal API
 * @param {string} filePath Absolute or relative path to stored file
 * @param {string} mimeType MIME type of file (image/jpeg, image/png, application/pdf)
 * @returns {object} Extracted structured record with confidence and status
 */
const processMedicalDocument = async (filePath, mimeType) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('YOUR_GEMINI_API_KEY')) {
    throw new Error('Gemini API key is missing or not configured in backend environment.');
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error('Document file missing from disk storage');
  }

  const fileBuffer = fs.readFileSync(absolutePath);
  const base64Data = fileBuffer.toString('base64');

  const filePart = {
    inlineData: {
      data: base64Data,
      mimeType: mimeType || 'image/jpeg'
    }
  };

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
          temperature: 0.1
        },
        systemInstruction: DOCUMENT_EXTRACTION_SYSTEM_PROMPT
      });

      const result = await model.generateContent([
        'Analyze this medical document and extract structured JSON according to the schema instructions.',
        filePart
      ]);
      responseText = result.response.text();
      if (responseText) break;
    } catch (err) {
      console.warn(`[MedicalDocumentService] Model ${modelName} failed: ${err.message}. Retrying fallback...`);
      lastError = err;
    }
  }

  if (!responseText) {
    throw new Error(`AI Document Processing failed: ${lastError ? lastError.message : 'No response from Gemini API'}`);
  }

  const jsonString = sanitizeJsonString(responseText);
  let parsedData = {};

  try {
    parsedData = JSON.parse(jsonString);
  } catch (parseErr) {
    console.error('[MedicalDocumentService] Malformed JSON from Gemini:', jsonString);
    throw new Error('Malformed JSON output from AI document service.');
  }

  // Normalize document type
  const validTypes = ['prescription', 'laboratory_report', 'discharge_summary', 'diagnostic_report', 'medical_report', 'other', 'unknown'];
  const docType = validTypes.includes(parsedData.documentType) ? parsedData.documentType : 'medical_report';

  // Process lab tests deterministically
  let rawTests = parsedData.laboratoryReport?.tests || [];
  const evaluatedTests = processLabTestsEvaluator(rawTests);

  // Calculate overall confidence and review requirement
  let totalConfidence = typeof parsedData.confidence === 'number' ? parsedData.confidence : 0.85;
  let needsReview = Boolean(parsedData.needsReview);

  // Check if any medicine or lab test has low confidence
  if (parsedData.prescription?.medicines?.some((m) => m.needsReview || (m.confidence && m.confidence < 0.75))) {
    needsReview = true;
  }
  if (evaluatedTests.some((t) => t.needsReview || (t.confidence && t.confidence < 0.75))) {
    needsReview = true;
  }

  if (totalConfidence < 0.75) {
    needsReview = true;
  }

  const processingStatus = needsReview ? 'needs_review' : 'processed';

  const validatedResult = {
    documentType: docType,
    documentDate: parsedData.documentDate || null,
    detectedLanguage: parsedData.detectedLanguage || 'en',
    extractionConfidence: Math.round(totalConfidence * 100) / 100,
    processingStatus,
    needsReview,
    patient: {
      name: parsedData.patient?.name || null,
      age: parsedData.patient?.age || null,
      gender: parsedData.patient?.gender || null
    },
    facility: {
      hospitalOrClinic: parsedData.facility?.hospitalOrClinic || null,
      doctorName: parsedData.facility?.doctorName || null
    },
    prescription: {
      diagnosisOrIndication: parsedData.prescription?.diagnosisOrIndication || null,
      medicines: Array.isArray(parsedData.prescription?.medicines)
        ? parsedData.prescription.medicines.map((m) => ({
            medicineName: String(m.medicineName || 'Unspecified Medicine'),
            dosage: m.dosage ? String(m.dosage) : null,
            frequency: m.frequency ? String(m.frequency) : null,
            duration: m.duration ? String(m.duration) : null,
            route: m.route ? String(m.route) : null,
            instructions: m.instructions ? String(m.instructions) : null,
            confidence: typeof m.confidence === 'number' ? m.confidence : 0.9,
            needsReview: Boolean(m.needsReview || (m.confidence && m.confidence < 0.75))
          }))
        : []
    },
    laboratoryReport: {
      laboratoryName: parsedData.laboratoryReport?.laboratoryName || parsedData.facility?.hospitalOrClinic || null,
      tests: evaluatedTests
    },
    dischargeSummary: {
      hospitalName: parsedData.dischargeSummary?.hospitalName || parsedData.facility?.hospitalOrClinic || null,
      admissionDate: parsedData.dischargeSummary?.admissionDate || null,
      dischargeDate: parsedData.dischargeSummary?.dischargeDate || null,
      diagnosis: parsedData.dischargeSummary?.diagnosis || null,
      procedures: Array.isArray(parsedData.dischargeSummary?.procedures) ? parsedData.dischargeSummary.procedures.map(String) : [],
      surgeries: Array.isArray(parsedData.dischargeSummary?.surgeries) ? parsedData.dischargeSummary.surgeries.map(String) : [],
      medications: Array.isArray(parsedData.dischargeSummary?.medications) ? parsedData.dischargeSummary.medications.map(String) : [],
      followUpInstructions: parsedData.dischargeSummary?.followUpInstructions || null,
      importantFindings: Array.isArray(parsedData.dischargeSummary?.importantFindings) ? parsedData.dischargeSummary.importantFindings.map(String) : []
    },
    generalFindings: {
      diagnosesMentioned: Array.isArray(parsedData.generalFindings?.diagnosesMentioned) ? parsedData.generalFindings.diagnosesMentioned.map(String) : [],
      observations: Array.isArray(parsedData.generalFindings?.observations) ? parsedData.generalFindings.observations.map(String) : [],
      procedures: Array.isArray(parsedData.generalFindings?.procedures) ? parsedData.generalFindings.procedures.map(String) : [],
      followUpInfo: parsedData.generalFindings?.followUpInfo || null
    }
  };

  return validatedResult;
};

module.exports = {
  processMedicalDocument,
  DOCUMENT_EXTRACTION_SYSTEM_PROMPT
};
