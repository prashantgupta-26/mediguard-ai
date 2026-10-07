const ClinicalSession = require('../models/ClinicalSession');
const ClinicalHistory = require('../models/ClinicalHistory');
const User = require('../models/User');
const { checkDeterministicRedFlags } = require('../services/redFlagService');
const { processClinicalInteraction } = require('../services/geminiClinicalService');

const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes inactivity timeout on server

// Helper to generate a unique random Session ID (e.g. KS-849201)
const generateSessionId = () => {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `KS-${randomNum}`;
};

const INITIAL_QUESTIONS = {
  en: {
    text: 'What problem or symptom is bringing you in today?',
    suggestedOptions: ['Fever & Chills', 'Chest Pain', 'Cough & Cold', 'Stomach Pain']
  },
  hi: {
    text: 'आज आपको क्या समस्या या लक्षण महसूस हो रहे हैं?',
    suggestedOptions: ['बुखार और ठंड', 'छाती में दर्द', 'खांसी और जुकाम', 'पेट में दर्द']
  },
  bn: {
    text: 'আজ আপনার কী সমস্যা বা লক্ষণ দেখা দিচ্ছে?',
    suggestedOptions: ['জ্বর ও ঠাণ্ডা', 'বুকে ব্যথা', 'কাশি ও সর্দি', 'পেটে ব্যথা']
  }
};

// 1. Start a new Kiosk Session
exports.startSession = async (req, res) => {
  try {
    const { language = 'en', healthId, patientName, mode = 'ai_conversational' } = req.body;
    const selectedLang = ['en', 'hi', 'bn'].includes(language) ? language : 'en';

    let patientObj = null;
    if (healthId) {
      patientObj = await User.findOne({ healthId: healthId.trim().toUpperCase() });
    } else if (req.user) {
      patientObj = await User.findById(req.user.id || req.user._id);
    }

    const sessionId = generateSessionId();
    const initialQ = INITIAL_QUESTIONS[selectedLang] || INITIAL_QUESTIONS.en;

    const sessionData = {
      sessionId,
      language: selectedLang,
      mode: ['ai_conversational', 'touch_guided'].includes(mode) ? mode : 'ai_conversational',
      patientId: patientObj ? patientObj._id : (req.user ? (req.user.id || req.user._id) : null),
      patientHealthId: patientObj ? patientObj.healthId : healthId ? healthId.trim() : null,
      patientName: patientObj ? (patientObj.name || patientObj.email) : patientName ? patientName.trim() : null,
      currentSection: 'chief_complaint',
      currentQuestionIndex: 0,
      answers: {},
      structuredClinicalData: {},
      currentAiQuestion: {
        text: initialQ.text,
        section: 'chief_complaint',
        suggestedOptions: initialQ.suggestedOptions,
        timestamp: new Date()
      },
      conversationHistory: [
        {
          role: 'model',
          text: initialQ.text,
          timestamp: new Date()
        }
      ],
      isRedFlag: false,
      redFlags: [],
      startTime: new Date(),
      lastActivityTime: new Date(),
      status: 'in_progress'
    };

    const session = await ClinicalSession.create(sessionData);

    res.status(201).json({
      success: true,
      message: 'Kiosk session initialized successfully.',
      session: {
        sessionId: session.sessionId,
        language: session.language,
        mode: session.mode,
        patientId: session.patientId,
        patientHealthId: session.patientHealthId,
        patientName: session.patientName,
        currentSection: session.currentSection,
        currentAiQuestion: session.currentAiQuestion,
        startTime: session.startTime,
        status: session.status
      }
    });
  } catch (error) {
    console.error('Error starting kiosk session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start kiosk session',
      error: error.message
    });
  }
};

// 2. Get active Kiosk Session
exports.getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ClinicalSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Kiosk session not found.'
      });
    }

    // Check timeout
    const now = new Date();
    const elapsed = now - new Date(session.lastActivityTime);
    if (session.status === 'in_progress' && elapsed > SESSION_TIMEOUT_MS) {
      session.status = 'timed_out';
      await session.save();
      return res.status(408).json({
        success: false,
        timedOut: true,
        message: 'Kiosk session timed out due to inactivity.'
      });
    }

    res.status(200).json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error fetching kiosk session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch kiosk session',
      error: error.message
    });
  }
};

// 3. Save or update answer for a question
exports.saveAnswer = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questionId, section, questionText, answer, inputMethod = 'touch' } = req.body;

    if (!questionId || !section) {
      return res.status(400).json({
        success: false,
        message: 'questionId and section are required.'
      });
    }

    const session = await ClinicalSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Kiosk session not found.'
      });
    }

    if (session.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: `Session is no longer active (Status: ${session.status}).`
      });
    }

    // Update answer in Mongoose Map
    session.answers.set(questionId, {
      questionId,
      section,
      questionText: questionText || '',
      answer,
      inputMethod: ['touch', 'voice', 'document', 'ai_generated'].includes(inputMethod) ? inputMethod : 'touch',
      timestamp: new Date()
    });

    session.lastActivityTime = new Date();
    if (section) {
      session.currentSection = section;
    }

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Answer saved successfully.',
      session
    });
  } catch (error) {
    console.error('Error saving kiosk answer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save answer',
      error: error.message
    });
  }
};

// 4. Session Heartbeat
exports.heartbeat = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await ClinicalSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    if (session.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Session not active.' });
    }

    session.lastActivityTime = new Date();
    await session.save();

    res.status(200).json({ success: true, lastActivityTime: session.lastActivityTime });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Heartbeat failed' });
  }
};

// 4b. AI Conversational Patient Interaction (Phase 2)
exports.interactSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { input, inputMethod = 'voice', language } = req.body;

    if (!input || typeof input !== 'string' || !input.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Patient input text is required.'
      });
    }

    const session = await ClinicalSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Kiosk session not found.'
      });
    }

    if (session.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: `Session is no longer active (Status: ${session.status}).`
      });
    }

    const currentLang = ['en', 'hi', 'bn'].includes(language) ? language : (session.language || 'en');
    const trimmedInput = input.trim();

    // 1. Layer 1: Deterministic Red Flag Safety Check
    const layer1Result = checkDeterministicRedFlags(trimmedInput);

    // 2. Call Gemini Service for NL Understanding, Extraction, Adaptive Question, Layer 2 Red Flags
    let aiResponse;
    try {
      aiResponse = await processClinicalInteraction({
        patientInput: trimmedInput,
        language: currentLang,
        conversationHistory: session.conversationHistory || [],
        existingStructuredData: session.structuredClinicalData || {},
        currentSection: session.currentSection || 'chief_complaint'
      });
    } catch (aiErr) {
      console.error('Gemini interaction error:', aiErr);
      return res.status(530).json({
        success: false,
        message: 'We couldn\'t process that response right now. Please try again or use touch input.',
        retryable: true,
        error: aiErr.message
      });
    }

    // Combine Red Flags (Layer 1 + Layer 2)
    const newRedFlags = [...layer1Result.redFlags];
    if (Array.isArray(aiResponse.red_flags) && aiResponse.red_flags.length > 0) {
      aiResponse.red_flags.forEach((rf) => {
        newRedFlags.push({
          symptom: rf,
          severity: 'HIGH',
          layer: 'gemini',
          message: 'Your symptoms may require urgent medical attention. Please wait for healthcare staff.',
          timestamp: new Date()
        });
      });
    }

    if (newRedFlags.length > 0) {
      session.isRedFlag = true;
      session.redFlags.push(...newRedFlags);
    }

    // Merge Extracted Clinical Data
    const updatedStructuredData = {
      ...(session.structuredClinicalData || {}),
      ...(aiResponse.extracted_information || {})
    };
    session.structuredClinicalData = updatedStructuredData;

    // Update Section if changed
    if (aiResponse.clinical_section) {
      session.currentSection = aiResponse.clinical_section;
    }

    // Update Conversation History
    session.conversationHistory.push({
      role: 'user',
      text: trimmedInput,
      timestamp: new Date()
    });

    session.conversationHistory.push({
      role: 'model',
      text: aiResponse.next_question,
      timestamp: new Date()
    });

    // Update Current AI Question
    session.currentAiQuestion = {
      text: aiResponse.next_question,
      section: aiResponse.clinical_section || session.currentSection,
      suggestedOptions: aiResponse.suggested_options || [],
      timestamp: new Date()
    };

    session.lastActivityTime = new Date();
    await session.save();

    res.status(200).json({
      success: true,
      sessionId: session.sessionId,
      nextQuestion: aiResponse.next_question,
      suggestedOptions: aiResponse.suggested_options || [],
      currentSection: session.currentSection,
      extractedInformation: updatedStructuredData,
      isRedFlag: session.isRedFlag,
      redFlags: session.redFlags,
      isComplete: aiResponse.is_intake_complete,
      confidence: aiResponse.confidence
    });
  } catch (error) {
    console.error('Error handling AI clinical interaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process clinical interaction',
      error: error.message
    });
  }
};

// 5. Submit Session & Build 16-Domain Clinical History
exports.submitSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { additionalNotes = '' } = req.body;

    const session = await ClinicalSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Kiosk session not found.'
      });
    }

    const answersMap = session.answers || new Map();
    const rawAnswers = [];
    const answersBySection = {};

    answersMap.forEach((val, key) => {
      rawAnswers.push({
        questionId: val.questionId,
        section: val.section,
        questionText: val.questionText,
        answer: val.answer,
        timestamp: val.timestamp || new Date(),
        inputMethod: val.inputMethod || 'touch'
      });

      if (!answersBySection[val.section]) {
        answersBySection[val.section] = {};
      }
      answersBySection[val.section][val.questionId] = val.answer;
    });

    const structData = session.structuredClinicalData || {};

    // Map into 16 clinical domains
    const clinicalHistoryData = {
      sessionId: session.sessionId,
      patientId: session.patientId,
      patientHealthId: session.patientHealthId,
      patientName: session.patientName,
      language: session.language,

      chiefComplaint: structData.chief_complaint || structData.chiefComplaint || answersBySection['chief_complaint'] || null,
      historyOfPresentIllness: structData.hpi || structData.historyOfPresentIllness || answersBySection['hpi'] || null,
      pastMedicalHistory: structData.past_medical || structData.pastMedicalHistory || answersBySection['past_medical'] || null,
      pastSurgicalHistory: structData.past_surgical || structData.pastSurgicalHistory || answersBySection['past_surgical'] || null,
      currentMedications: structData.current_meds || structData.currentMedications || answersBySection['current_meds'] || null,
      drugAllergies: structData.drug_allergies || structData.drugAllergies || answersBySection['drug_allergies'] || null,
      familyHistory: structData.family_history || structData.familyHistory || answersBySection['family_history'] || null,
      personalHistory: structData.personal_history || structData.personalHistory || answersBySection['personal_history'] || null,
      dietHistory: structData.diet || answersBySection['personal_history']?.diet || null,
      sleepHistory: structData.sleep || answersBySection['personal_history']?.sleep || null,
      substanceUse: structData.substance_use || structData.substanceUse || answersBySection['personal_history']?.substance || null,
      reviewOfSystems: structData.ros || structData.reviewOfSystems || answersBySection['ros'] || null,
      previousInvestigations: structData.previous_investigations || answersBySection['previous_investigations'] || null,
      previousDiagnoses: structData.previous_diagnoses || answersBySection['previous_diagnoses'] || null,
      additionalNotes: additionalNotes || structData.additional_notes || answersBySection['additional_notes']?.notes || '',
      isRedFlag: session.isRedFlag || false,
      redFlags: session.redFlags || [],
      conversationHistory: session.conversationHistory || [],
      rawAnswers,
      completedAt: new Date()
    };

    const history = await ClinicalHistory.create(clinicalHistoryData);

    session.status = 'completed';
    session.lastActivityTime = new Date();
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Clinical history submitted successfully and ready for physician review.',
      clinicalHistoryId: history._id,
      sessionId: session.sessionId,
      patientHealthId: session.patientHealthId
    });
  } catch (error) {
    console.error('Error submitting kiosk session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit clinical history',
      error: error.message
    });
  }
};

// 6. Reset / Cancel Session
exports.resetSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await ClinicalSession.findOne({ sessionId });

    if (session) {
      session.status = 'cancelled';
      session.answers = new Map();
      await session.save();
    }

    res.status(200).json({
      success: true,
      message: 'Session cleared successfully.'
    });
  } catch (error) {
    console.error('Error resetting kiosk session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset session',
      error: error.message
    });
  }
};

// 7. Get Clinical History Record (by historyId or sessionId)
exports.getClinicalHistory = async (req, res) => {
  try {
    const { id } = req.params;
    let history = await ClinicalHistory.findById(id);
    if (!history) {
      history = await ClinicalHistory.findOne({ sessionId: id });
    }

    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'Clinical history record not found.'
      });
    }

    res.status(200).json({
      success: true,
      clinicalHistory: history
    });
  } catch (error) {
    console.error('Error fetching clinical history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clinical history',
      error: error.message
    });
  }
};
