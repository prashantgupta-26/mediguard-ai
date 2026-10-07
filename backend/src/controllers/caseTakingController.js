const ClinicalSession = require('../models/ClinicalSession');
const User = require('../models/User');
const { processCaseTakingTurn } = require('../services/caseTakingService');
const { checkDeterministicRedFlags } = require('../services/redFlagService');

/**
 * Merge newly extracted fields into existing structured case data cleanly
 */
const mergeStructuredCaseData = (existing = {}, newlyExtracted = {}) => {
  const merged = { ...existing };

  if (newlyExtracted.chiefComplaint) merged.chiefComplaint = newlyExtracted.chiefComplaint;
  if (newlyExtracted.onset) merged.onset = newlyExtracted.onset;
  if (newlyExtracted.duration) merged.duration = newlyExtracted.duration;
  if (newlyExtracted.severity) merged.severity = newlyExtracted.severity;

  const arrayFields = [
    'symptoms',
    'pastMedicalHistory',
    'pastSurgicalHistory',
    'medications',
    'allergies',
    'familyHistory',
    'personalHistory',
    'previousTreatment',
    'reviewOfSystems'
  ];

  for (const field of arrayFields) {
    const existingArr = Array.isArray(merged[field]) ? merged[field] : [];
    const newArr = Array.isArray(newlyExtracted[field]) ? newlyExtracted[field] : [];
    // Combine arrays uniquely (case-insensitive)
    const combinedSet = new Set(existingArr.map((s) => String(s).trim()));
    newArr.forEach((item) => {
      if (item && String(item).trim()) {
        combinedSet.add(String(item).trim());
      }
    });
    merged[field] = Array.from(combinedSet);
  }

  return merged;
};

// @desc    Start or resume AI Case-Taking session
// @route   POST /api/case-taking/start
exports.startCaseTakingSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found.'
      });
    }

    // Check if there is an active IN_PROGRESS session
    let session = await ClinicalSession.findOne({
      patientId: userId,
      status: 'in_progress'
    }).sort({ updatedAt: -1 });

    if (session) {
      return res.status(200).json({
        success: true,
        isExistingSession: true,
        message: 'Resumed existing in-progress case-taking session.',
        session: {
          sessionId: session.sessionId,
          status: session.status,
          conversationHistory: session.conversationHistory,
          currentAiQuestion: session.currentAiQuestion,
          structuredClinicalData: session.structuredClinicalData,
          isRedFlag: session.isRedFlag,
          redFlags: session.redFlags,
          startTime: session.startTime
        }
      });
    }

    // Create a new session
    const sessionId = `CASE-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const greetingText = "Hello! I'll help collect information about your current health concern so your case history can be prepared.";
    const initialQuestionText = "What is the main health problem you are experiencing today?";

    const conversationHistory = [
      { role: 'assistant', text: greetingText, timestamp: new Date() },
      { role: 'assistant', text: initialQuestionText, timestamp: new Date() }
    ];

    const currentAiQuestion = {
      question: initialQuestionText,
      suggestedOptions: ["Fever / Cold", "Stomach Ache", "Headache / Body Pain", "Cough / Breathing Issue"]
    };

    session = await ClinicalSession.create({
      sessionId,
      patientId: user._id,
      patientHealthId: user.healthId || null,
      patientName: user.name || 'Patient',
      status: 'in_progress',
      mode: 'ai_conversational',
      conversationHistory,
      currentAiQuestion,
      structuredClinicalData: {
        chiefComplaint: null,
        onset: null,
        duration: null,
        severity: null,
        symptoms: [],
        pastMedicalHistory: [],
        pastSurgicalHistory: [],
        medications: [],
        allergies: [],
        familyHistory: [],
        personalHistory: [],
        previousTreatment: [],
        reviewOfSystems: []
      },
      isRedFlag: false,
      redFlags: []
    });

    return res.status(201).json({
      success: true,
      isExistingSession: false,
      message: 'Started new case-taking session.',
      session: {
        sessionId: session.sessionId,
        status: session.status,
        conversationHistory: session.conversationHistory,
        currentAiQuestion: session.currentAiQuestion,
        structuredClinicalData: session.structuredClinicalData,
        isRedFlag: session.isRedFlag,
        redFlags: session.redFlags,
        startTime: session.startTime
      }
    });
  } catch (error) {
    console.error('Start case-taking session error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while starting case-taking session.'
    });
  }
};

// @desc    Get active IN_PROGRESS session for user if any
// @route   GET /api/case-taking/active
exports.getActiveCaseTakingSession = async (req, res) => {
  try {
    const session = await ClinicalSession.findOne({
      patientId: req.user.id,
      status: 'in_progress'
    }).sort({ updatedAt: -1 });

    if (!session) {
      return res.status(200).json({
        success: true,
        hasActiveSession: false,
        session: null
      });
    }

    return res.status(200).json({
      success: true,
      hasActiveSession: true,
      session: {
        sessionId: session.sessionId,
        status: session.status,
        conversationHistory: session.conversationHistory,
        currentAiQuestion: session.currentAiQuestion,
        structuredClinicalData: session.structuredClinicalData,
        isRedFlag: session.isRedFlag,
        redFlags: session.redFlags,
        startTime: session.startTime
      }
    });
  } catch (error) {
    console.error('Get active session error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while checking active case-taking session.'
    });
  }
};

// @desc    Send patient message and get next adaptive AI question
// @route   POST /api/case-taking/:sessionId/message
exports.sendCaseTakingMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required.'
      });
    }

    const session = await ClinicalSession.findOne({
      sessionId,
      patientId: req.user.id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Case-taking session not found.'
      });
    }

    if (session.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'This case-taking session has already been completed.'
      });
    }

    const userText = String(message).trim();

    // 1. Add patient message to transcript
    session.conversationHistory.push({
      role: 'user',
      text: userText,
      timestamp: new Date()
    });

    // 2. Check Layer 1 Deterministic Red Flags
    const detRedFlags = checkDeterministicRedFlags(userText);
    let sessionIsRedFlag = session.isRedFlag || detRedFlags.isRedFlag;

    if (detRedFlags.isRedFlag) {
      detRedFlags.redFlags.forEach((rf) => {
        const exists = session.redFlags.some((r) => r.symptom === rf.symptom);
        if (!exists) {
          session.redFlags.push({
            symptom: rf.symptom,
            severity: rf.severity || 'HIGH',
            layer: 'deterministic',
            message: rf.message,
            timestamp: new Date()
          });
        }
      });
    }

    // 3. Process turn with Gemini AI Service
    const aiResult = await processCaseTakingTurn({
      patientInput: userText,
      conversationHistory: session.conversationHistory.map((h) => ({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        text: h.text
      })),
      existingStructuredData: session.structuredClinicalData || {}
    });

    // 4. Update structured clinical data
    session.structuredClinicalData = mergeStructuredCaseData(
      session.structuredClinicalData || {},
      aiResult.extracted_information || {}
    );

    // 5. Add AI red flags if detected
    if (aiResult.red_flags && aiResult.red_flags.length > 0) {
      sessionIsRedFlag = true;
      aiResult.red_flags.forEach((rfText) => {
        const exists = session.redFlags.some((r) => r.symptom === rfText);
        if (!exists) {
          session.redFlags.push({
            symptom: rfText,
            severity: 'HIGH',
            layer: 'gemini',
            message: 'Potential high-priority symptom identified during case-taking conversation.',
            timestamp: new Date()
          });
        }
      });
    }

    session.isRedFlag = sessionIsRedFlag;

    // 6. Add AI response question to transcript
    const nextQ = aiResult.next_question || 'Could you tell me more about your symptoms?';
    session.conversationHistory.push({
      role: 'assistant',
      text: nextQ,
      timestamp: new Date()
    });

    session.currentAiQuestion = {
      question: nextQ,
      suggestedOptions: aiResult.suggested_options || []
    };

    session.lastActivityTime = new Date();
    await session.save();

    return res.status(200).json({
      success: true,
      session: {
        sessionId: session.sessionId,
        status: session.status,
        conversationHistory: session.conversationHistory,
        currentAiQuestion: session.currentAiQuestion,
        structuredClinicalData: session.structuredClinicalData,
        isRedFlag: session.isRedFlag,
        redFlags: session.redFlags,
        isCompleteCandidate: aiResult.is_intake_complete
      }
    });
  } catch (error) {
    console.error('Send case-taking message error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while processing case-taking message.'
    });
  }
};

// @desc    Complete and save case-taking session
// @route   POST /api/case-taking/:sessionId/complete
exports.completeCaseTakingSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ClinicalSession.findOne({
      sessionId,
      patientId: req.user.id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Case-taking session not found.'
      });
    }

    session.status = 'completed';
    session.lastActivityTime = new Date();
    await session.save();

    return res.status(200).json({
      success: true,
      message: 'Case-taking session completed and structured summary saved.',
      session: {
        sessionId: session.sessionId,
        status: session.status,
        conversationHistory: session.conversationHistory,
        structuredClinicalData: session.structuredClinicalData,
        isRedFlag: session.isRedFlag,
        redFlags: session.redFlags
      }
    });
  } catch (error) {
    console.error('Complete case-taking session error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while completing case-taking session.'
    });
  }
};

// @desc    Get session details by ID
// @route   GET /api/case-taking/:sessionId
exports.getCaseTakingSessionById = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ClinicalSession.findOne({
      sessionId,
      patientId: req.user.id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Case-taking session not found.'
      });
    }

    return res.status(200).json({
      success: true,
      session: {
        sessionId: session.sessionId,
        status: session.status,
        conversationHistory: session.conversationHistory,
        currentAiQuestion: session.currentAiQuestion,
        structuredClinicalData: session.structuredClinicalData,
        isRedFlag: session.isRedFlag,
        redFlags: session.redFlags,
        startTime: session.startTime,
        updatedAt: session.updatedAt
      }
    });
  } catch (error) {
    console.error('Get case-taking session error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching case-taking session.'
    });
  }
};
