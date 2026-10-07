const User = require('../models/User');
const MedicalDocument = require('../models/MedicalDocument');
const HealthRecord = require('../models/HealthRecord');

// Helper to format date strings cleanly (YYYY-MM-DD or standard display date)
function formatDateString(dateVal) {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return d.toISOString().split('T')[0];
}

// @desc    Get patient dashboard info
// @route   GET /api/patient/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const patient = await User.findById(req.user.id).select('-passwordHash');
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found.'
      });
    }

    return res.status(200).json({
      success: true,
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        healthId: patient.healthId,
        emailVerified: patient.emailVerified,
        createdAt: patient.createdAt
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard'
    });
  }
};

// @desc    Get patient profile
// @route   GET /api/patient/profile
exports.getProfile = async (req, res) => {
  try {
    const patient = await User.findById(req.user.id).select('-passwordHash');
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found.'
      });
    }

    return res.status(200).json({
      success: true,
      patient
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
};

// @desc    Update patient profile (allowed personal info only)
// @route   PUT /api/patient/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, dateOfBirth, gender } = req.body;

    const patient = await User.findById(req.user.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found.'
      });
    }

    if (name) patient.name = name;
    if (dateOfBirth) patient.dateOfBirth = dateOfBirth;
    if (gender && ['Male', 'Female', 'Other'].includes(gender)) patient.gender = gender;

    await patient.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        healthId: patient.healthId
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
};

// @desc    Get patient health timeline (Feature 3)
// @route   GET /api/patient/health-timeline
exports.getHealthTimeline = async (req, res) => {
  try {
    const documents = await MedicalDocument.find({ patientId: req.user.id });

    // Process and aggregate timeline items
    const rawTimeline = documents.map((doc) => {
      const isCompleted = doc.aiAnalysisStatus === 'completed';
      const extracted = isCompleted ? doc.aiExtractedData : null;

      // Extract reportDate if present, fallback to uploadedAt timestamp
      let dateString = null;
      let sortTimestamp = new Date(doc.uploadedAt).getTime();

      if (extracted && extracted.reportDate) {
        dateString = extracted.reportDate;
        const parsedReportDate = Date.parse(extracted.reportDate);
        if (!isNaN(parsedReportDate)) {
          sortTimestamp = parsedReportDate;
        }
      } else {
        dateString = formatDateString(doc.uploadedAt);
      }

      return {
        documentId: doc._id.toString(),
        date: dateString,
        rawDate: doc.uploadedAt,
        sortTimestamp,
        documentType: extracted?.documentType || 'Medical Record',
        fileName: doc.originalFileName,
        fileType: doc.fileType,
        aiAnalysisStatus: doc.aiAnalysisStatus,
        tests: extracted?.tests || [],
        medicines: extracted?.medicines || [],
        diagnosesMentioned: extracted?.diagnosesMentioned || [],
        observations: extracted?.observations || []
      };
    });

    // Sort chronologically: NEWEST → OLDEST
    rawTimeline.sort((a, b) => b.sortTimestamp - a.sortTimestamp);

    // Clean up temporary sort keys before returning
    const timeline = rawTimeline.map(({ sortTimestamp, rawDate, ...item }) => item);

    return res.status(200).json({
      success: true,
      timeline
    });
  } catch (error) {
    console.error('Get health timeline error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching health timeline'
    });
  }
};

// @desc    Get patient health summary (Feature 3)
// @route   GET /api/patient/health-summary
exports.getHealthSummary = async (req, res) => {
  try {
    const patient = await User.findById(req.user.id).select('-passwordHash');
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found.'
      });
    }

    // Query HealthRecord model if available
    const healthRecord = await HealthRecord.findOne({ patientId: req.user.id });

    // Query MedicalDocument collection for record counts
    const documents = await MedicalDocument.find({ patientId: req.user.id });
    const totalDocuments = documents.length;
    const analyzedDocuments = documents.filter((doc) => doc.aiAnalysisStatus === 'completed').length;

    // Find latest report date from extracted reportDate or uploadedAt
    let latestReportDate = null;
    let maxTimestamp = 0;

    documents.forEach((doc) => {
      let reportDateStr = null;
      let ts = new Date(doc.uploadedAt).getTime();

      if (doc.aiAnalysisStatus === 'completed' && doc.aiExtractedData?.reportDate) {
        reportDateStr = doc.aiExtractedData.reportDate;
        const parsed = Date.parse(doc.aiExtractedData.reportDate);
        if (!isNaN(parsed)) ts = parsed;
      } else {
        reportDateStr = formatDateString(doc.uploadedAt);
      }

      if (ts > maxTimestamp) {
        maxTimestamp = ts;
        latestReportDate = reportDateStr;
      }
    });

    return res.status(200).json({
      success: true,
      summary: {
        patient: {
          name: patient.name ? patient.name.toUpperCase() : 'N/A',
          dateOfBirth: patient.dateOfBirth || null,
          gender: patient.gender || null,
          healthId: patient.healthId || null
        },
        healthInformation: {
          bloodGroup: healthRecord?.bloodGroup || null,
          height: healthRecord?.height || null,
          weight: healthRecord?.weight || null,
          allergies: healthRecord?.allergies || null,
          existingConditions: healthRecord?.existingConditions || null,
          currentMedications: healthRecord?.currentMedications || null
        },
        records: {
          totalDocuments,
          analyzedDocuments,
          latestReportDate
        }
      }
    });
  } catch (error) {
    console.error('Get health summary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching health summary'
    });
  }
};

// @desc    Get Smart Patient Intake record (Feature 4)
// @route   GET /api/patient/smart-intake
exports.getSmartIntake = async (req, res) => {
  try {
    const patient = await User.findById(req.user.id).select('-passwordHash');
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found.'
      });
    }

    const healthRecord = await HealthRecord.findOne({ patientId: req.user.id });
    const documents = await MedicalDocument.find({ patientId: req.user.id }).sort({ uploadedAt: -1 });

    const total = documents.length;
    const analyzedDocs = documents.filter((doc) => doc.aiAnalysisStatus === 'completed');
    const analyzed = analyzedDocs.length;

    let latestDate = null;
    let maxTimestamp = 0;

    documents.forEach((doc) => {
      let reportDateStr = null;
      let ts = new Date(doc.uploadedAt).getTime();

      if (doc.aiAnalysisStatus === 'completed' && doc.aiExtractedData?.reportDate) {
        reportDateStr = doc.aiExtractedData.reportDate;
        const parsed = Date.parse(doc.aiExtractedData.reportDate);
        if (!isNaN(parsed)) ts = parsed;
      } else {
        reportDateStr = formatDateString(doc.uploadedAt);
      }

      if (ts > maxTimestamp) {
        maxTimestamp = ts;
        latestDate = reportDateStr;
      }
    });

    // Recent records (latest 3-5 analyzed or uploaded docs)
    const recentRecords = documents.slice(0, 5).map((doc) => ({
      documentId: doc._id.toString(),
      originalFileName: doc.originalFileName,
      fileType: doc.fileType,
      documentType: doc.aiExtractedData?.documentType || 'Medical Report',
      reportDate: doc.aiExtractedData?.reportDate || formatDateString(doc.uploadedAt),
      uploadedAt: doc.uploadedAt,
      aiAnalysisStatus: doc.aiAnalysisStatus,
      tests: doc.aiExtractedData?.tests || []
    }));

    // Aggregate extracted lists with document traceability
    const recentTests = [];
    const medicinesMentioned = [];
    const documentedConditions = [];
    const observations = [];

    analyzedDocs.forEach((doc) => {
      const data = doc.aiExtractedData || {};
      const reportDateStr = data.reportDate || formatDateString(doc.uploadedAt);

      if (Array.isArray(data.tests)) {
        data.tests.forEach((t) => {
          recentTests.push({
            name: t.name,
            value: t.value,
            unit: t.unit || null,
            reportDate: reportDateStr,
            sourceDocument: doc.originalFileName,
            documentId: doc._id.toString()
          });
        });
      }

      if (Array.isArray(data.medicines)) {
        data.medicines.forEach((m) => {
          medicinesMentioned.push({
            name: m.name,
            dosage: m.dosage || null,
            frequency: m.frequency || null,
            duration: m.duration || null,
            sourceDocument: doc.originalFileName,
            documentId: doc._id.toString()
          });
        });
      }

      if (Array.isArray(data.diagnosesMentioned)) {
        data.diagnosesMentioned.forEach((c) => {
          documentedConditions.push({
            condition: String(c),
            sourceDocument: doc.originalFileName,
            documentId: doc._id.toString()
          });
        });
      }

      if (Array.isArray(data.observations)) {
        data.observations.forEach((o) => {
          observations.push({
            observation: String(o),
            sourceDocument: doc.originalFileName,
            documentId: doc._id.toString()
          });
        });
      }
    });

    return res.status(200).json({
      success: true,
      intake: {
        patient: {
          name: patient.name ? patient.name.toUpperCase() : 'N/A',
          dateOfBirth: patient.dateOfBirth || null,
          gender: patient.gender || null,
          email: patient.email || null,
          healthId: patient.healthId || null
        },
        healthProfile: {
          bloodGroup: healthRecord?.bloodGroup || null,
          height: healthRecord?.height || null,
          weight: healthRecord?.weight || null,
          allergies: healthRecord?.allergies || null,
          existingConditions: healthRecord?.existingConditions || null,
          currentMedications: healthRecord?.currentMedications || null
        },
        records: {
          total,
          analyzed,
          latestDate
        },
        recentRecords,
        recentTests,
        medicinesMentioned,
        documentedConditions,
        observations,
        patientNotes: healthRecord?.patientNotes || null
      }
    });
  } catch (error) {
    console.error('Get smart intake error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching Smart Patient Intake'
    });
  }
};

// @desc    Update patient intake notes (Feature 4)
// @route   PUT /api/patient/smart-intake/notes
exports.updatePatientNotes = async (req, res) => {
  try {
    const { patientNotes } = req.body;

    let healthRecord = await HealthRecord.findOne({ patientId: req.user.id });
    if (!healthRecord) {
      healthRecord = new HealthRecord({ patientId: req.user.id });
    }

    healthRecord.patientNotes = patientNotes !== undefined ? patientNotes : null;
    await healthRecord.save();

    return res.status(200).json({
      success: true,
      message: 'Patient notes saved successfully',
      patientNotes: healthRecord.patientNotes
    });
  } catch (error) {
    console.error('Update patient notes error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while saving patient notes'
    });
  }
};
