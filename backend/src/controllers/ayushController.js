const ayushService = require('../services/ayushService');

exports.getQuestions = async (req, res) => {
  try {
    const questions = ayushService.getQuestions();
    return res.status(200).json({
      success: true,
      questions
    });
  } catch (error) {
    console.error('[AyushController] Error fetching questions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch AYUSH questions',
      error: error.message
    });
  }
};

exports.submitAyushIntake = async (req, res) => {
  try {
    const { clinicalSessionId, answers, language } = req.body;
    let patientId = req.user ? (req.user.id || req.user._id) : req.body.patientId;

    if (!clinicalSessionId) {
      return res.status(400).json({
        success: false,
        message: 'clinicalSessionId is required'
      });
    }

    if (!patientId) {
      const ClinicalSession = require('../models/ClinicalSession');
      const session = await ClinicalSession.findOne({ sessionId: clinicalSessionId });
      if (session && session.patientId) {
        patientId = session.patientId;
      }
    }

    const ayushRecord = await ayushService.saveAyushIntake({
      patientId,
      clinicalSessionId,
      answers,
      language
    });

    return res.status(200).json({
      success: true,
      message: 'AYUSH Dashavidha Pariksha intake saved successfully',
      ayushRecord
    });
  } catch (error) {
    console.error('[AyushController] Error saving AYUSH intake:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save AYUSH intake',
      error: error.message
    });
  }
};

exports.getAyushBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const ayushRecord = await ayushService.getAyushBySession(sessionId);

    return res.status(200).json({
      success: true,
      ayushRecord
    });
  } catch (error) {
    console.error('[AyushController] Error fetching AYUSH record:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch AYUSH record',
      error: error.message
    });
  }
};
