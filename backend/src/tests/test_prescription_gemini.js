const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('ERROR: No GEMINI_API_KEY found in backend/.env');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// Test on one of the real uploaded medical prescription images
const uploadsDir = path.join(__dirname, '../../uploads');
const testFiles = [
  path.join(uploadsDir, 'MK-72D3A3/1788775661746-f936c3b9.jpg'),
  path.join(uploadsDir, 'MK-921E36/1788753614661-6d015612.jpg'),
  path.join(uploadsDir, 'MK-72D3A3/1789027944157-e78f5383.jpg')
];

let targetFile = testFiles.find(f => fs.existsSync(f));

if (!targetFile) {
  console.error('No sample upload file found to test.');
  process.exit(1);
}

console.log('Using sample prescription image:', targetFile);
const fileBuffer = fs.readFileSync(targetFile);
const base64Data = fileBuffer.toString('base64');

async function testGemini() {
  const modelsToTry = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'];

  for (const modelName of modelsToTry) {
    try {
      console.log(`\n==========================================`);
      console.log(`Testing Gemini Model: ${modelName}`);
      console.log(`==========================================`);
      
      const startTime = Date.now();
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });

      const prompt = `You are an expert AI Medical Document Information Extraction System.
Analyze this medical document image (prescription, clinical slip, or report).
Extract all details strictly into this JSON schema:
{
  "isPrescription": true or false,
  "documentType": "prescription" | "laboratory_report" | "other",
  "patient": {
    "name": string or null,
    "age": string or null,
    "gender": string or null
  },
  "doctor": {
    "name": string or null,
    "clinicOrHospital": string or null
  },
  "diagnosesOrSymptoms": [string],
  "medicines": [
    {
      "name": string,
      "dosage": string or null,
      "frequency": string or null,
      "duration": string or null,
      "instructions": string or null
    }
  ],
  "clinicalNotes": string or null
}
Return ONLY valid JSON.`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/jpeg'
          }
        }
      ]);

      const timeTaken = (Date.now() - startTime) / 1000;
      const text = result.response.text();
      console.log(`✅ Success in ${timeTaken.toFixed(2)} seconds!`);
      console.log(`\nExtracted Content:\n`, JSON.stringify(JSON.parse(text), null, 2));
      return;
    } catch (err) {
      console.error(`❌ Model ${modelName} failed:`, err.message);
    }
  }
}

testGemini();
