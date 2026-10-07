const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const extractDocumentInfo = async (filePath, mimeType) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.includes('YOUR_GEMINI_API_KEY')) {
    throw new Error('Gemini API key is missing or not configured in backend/.env');
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
      mimeType: mimeType || 'application/pdf'
    }
  };

  const prompt = `You are a medical document information extraction system.
Analyze the provided medical document image or PDF.
Extract ONLY information explicitly visible or stated in the document.

CRITICAL MEDICAL SAFETY RULES:
1. Do NOT diagnose the patient.
2. Do NOT provide treatment recommendations.
3. Do NOT recommend medicines or suggest dosage changes.
4. Do NOT infer missing information or guess values.
5. If a field is not present in the document, return null.
6. "diagnosesMentioned" means diagnoses explicitly written by a clinician in the document text. It does NOT mean you determine a diagnosis.

Return ONLY valid JSON according to this exact schema:

{
  "documentType": "String (e.g. Blood Test Report, Prescription, X-Ray Report, Discharge Summary)",
  "patient": {
    "name": "String or null",
    "age": "String or null",
    "gender": "String or null"
  },
  "hospital": "String or null (Hospital, Laboratory or Clinic Name)",
  "doctor": "String or null (Doctor or Clinician Name)",
  "reportDate": "String or null (e.g. 06 Sep 2026)",
  "tests": [
    {
      "name": "String (e.g. Hemoglobin, WBC, Platelets)",
      "value": "String (e.g. 13.5)",
      "unit": "String or null (e.g. g/dL, /µL)",
      "referenceRange": "String or null (e.g. 12.0 - 15.5)"
    }
  ],
  "medicines": [
    {
      "name": "String (e.g. Paracetamol)",
      "dosage": "String or null (e.g. 500mg)",
      "frequency": "String or null (e.g. Twice daily)",
      "duration": "String or null (e.g. 5 days)"
    }
  ],
  "diagnosesMentioned": ["Array of strings explicitly written in the report"],
  "observations": ["Array of key observations/findings explicitly written in the report"],
  "confidence": "High / Medium / Low"
}`;

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
          responseMimeType: 'application/json'
        }
      });

      const result = await model.generateContent([prompt, filePart]);
      responseText = result.response.text();
      if (responseText) break;
    } catch (err) {
      console.warn(`Attempt with ${modelName} failed: ${err.message}. Trying next fallback model...`);
      lastError = err;
    }
  }

  if (!responseText) {
    throw new Error(`AI Extraction failed: ${lastError ? lastError.message : 'No response from Gemini API'}`);
  }

  // Clean up JSON block if returned with markdown code fences
  let jsonString = responseText.trim();
  if (jsonString.startsWith('```json')) {
    jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (jsonString.startsWith('```')) {
    jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    const parsedData = JSON.parse(jsonString);

    // Validate and sanitize response schema
    const validatedData = {
      documentType: parsedData.documentType || 'Medical Report',
      patient: {
        name: parsedData.patient?.name || null,
        age: parsedData.patient?.age || null,
        gender: parsedData.patient?.gender || null
      },
      hospital: parsedData.hospital || null,
      doctor: parsedData.doctor || null,
      reportDate: parsedData.reportDate || null,
      tests: Array.isArray(parsedData.tests)
        ? parsedData.tests.map((t) => ({
            name: String(t.name || ''),
            value: String(t.value || ''),
            unit: t.unit ? String(t.unit) : null,
            referenceRange: t.referenceRange ? String(t.referenceRange) : null
          }))
        : [],
      medicines: Array.isArray(parsedData.medicines)
        ? parsedData.medicines.map((m) => ({
            name: String(m.name || ''),
            dosage: m.dosage ? String(m.dosage) : null,
            frequency: m.frequency ? String(m.frequency) : null,
            duration: m.duration ? String(m.duration) : null
          }))
        : [],
      diagnosesMentioned: Array.isArray(parsedData.diagnosesMentioned)
        ? parsedData.diagnosesMentioned.map((d) => String(d))
        : [],
      observations: Array.isArray(parsedData.observations)
        ? parsedData.observations.map((o) => String(o))
        : [],
      confidence: parsedData.confidence || 'High'
    };

    return validatedData;
  } catch (parseError) {
    console.error('Failed to parse Gemini JSON output:', jsonString);
    throw new Error('Malformed JSON output from AI extraction service.');
  }
};

module.exports = {
  extractDocumentInfo
};
