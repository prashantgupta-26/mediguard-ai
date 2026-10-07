const { GoogleGenerativeAI } = require('@google/generative-ai');

const checkInteractions = async (req, res) => {
  try {
    const { medicines = [], foods = [] } = req.body;

    const medList = (Array.isArray(medicines) ? medicines : [medicines])
      .map(m => String(m).trim())
      .filter(Boolean);
    const foodList = (Array.isArray(foods) ? foods : [foods])
      .map(f => String(f).trim())
      .filter(Boolean);

    if (medList.length === 0 && foodList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one medicine or food item to check for interactions.'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        success: false,
        error: 'Gemini API key is not configured.',
        interactionsFound: false,
        overallSummary: 'Unable to verify interactions: Gemini API key missing.',
        highestSeverity: 'Unable to verify',
        interactions: [],
        disclaimer: 'This information is for informational purposes only. Consult a doctor or pharmacist for medical decisions.'
      });
    }

    const prompt = `You are a clinical pharmacology and medication safety expert AI for MEDIGUARD AI — Smart Medication Safety System.
Analyze the following patient medications and food/beverage items for potential Drug–Drug and Drug–Food interactions.

Input:
Medicines: ${JSON.stringify(medList)}
Foods / Beverages: ${JSON.stringify(foodList)}

Clinical Safety Rules:
1. Identify all clinically significant Drug–Drug interactions between pairs of medicines.
2. Identify all clinically significant Drug–Food interactions between each medicine and each food or beverage.
3. Classify severity strictly as: "High", "Moderate", "Low", or "Unable to verify".
4. Provide a clear, simple, patient-friendly explanation without unnecessary medical jargon.
5. Provide actionable, practical precautions and questions the patient should discuss with their doctor or pharmacist.
6. CRITICAL SAFETY RULE: Never tell the user to stop, start, increase, or decrease medications. Always advise discussing with a licensed healthcare provider.
7. If an interaction cannot be reliably determined or clinical evidence is contradictory/sparse, set severity to "Unable to verify" and uncertainty to true.
8. If no interactions are found between the provided items, set "interactionsFound": false, "highestSeverity": "None", and "interactions": [].

Return ONLY a valid JSON object matching this schema:
{
  "interactionsFound": true,
  "overallSummary": "Clear 1-2 sentence overview of the findings",
  "highestSeverity": "High | Moderate | Low | None | Unable to verify",
  "interactions": [
    {
      "type": "Drug–Drug | Drug–Food",
      "item1": "First medicine name",
      "item2": "Second medicine or food item name",
      "severity": "High | Moderate | Low | Unable to verify",
      "explanation": "Simple explanation of what happens and why",
      "precautions": "Precautions to take and questions to ask your doctor or pharmacist",
      "uncertainty": false,
      "uncertaintyReason": ""
    }
  ]
}`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-flash-latest'];
    let lastError = null;

    for (const m of models) {
      try {
        const model = genAI.getGenerativeModel({
          model: m,
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = JSON.parse(text);

        return res.status(200).json({
          success: true,
          modelUsed: m,
          interactionsFound: parsed.interactionsFound || false,
          overallSummary: parsed.overallSummary || '',
          highestSeverity: parsed.highestSeverity || 'None',
          interactions: parsed.interactions || [],
          disclaimer: 'This information is for informational purposes only. Consult a doctor or pharmacist for medical decisions.'
        });
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    return res.status(200).json({
      success: false,
      error: 'Unable to verify interactions with Gemini at this time.',
      interactionsFound: false,
      overallSummary: 'Unable to verify interactions reliably due to service timeout. Please consult a doctor or pharmacist.',
      highestSeverity: 'Unable to verify',
      interactions: [],
      disclaimer: 'This information is for informational purposes only. Consult a doctor or pharmacist for medical decisions.'
    });

  } catch (error) {
    console.error('Interaction checker error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error processing interaction check.',
      error: error.message
    });
  }
};

module.exports = {
  checkInteractions
};
