const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  uploadRecord,
  getRecords,
  getRecordById,
  viewRecord,
  deleteRecord,
  processRecord,
  updateRecordVerification,
  analyzeRecord,
  getRecordAnalysis
} = require('../controllers/recordController');

// Helper wrapper to handle Multer upload errors cleanly (supports single file or array of files)
const uploadFlexibleFiles = (req, res, next) => {
  upload.array('files', 10)(req, res, (err) => {
    if (err) {
      // Try fallback single file 'file' if 'files' is empty
      upload.single('file')(req, res, (errSingle) => {
        if (errSingle instanceof multer.MulterError || err instanceof multer.MulterError) {
          const mErr = errSingle || err;
          if (mErr.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'File size exceeds maximum allowed limit of 10 MB.'
            });
          }
          return res.status(400).json({
            success: false,
            message: `File upload error: ${mErr.message}`
          });
        } else if (errSingle || err) {
          return res.status(400).json({
            success: false,
            message: (errSingle || err).message
          });
        }
        next();
      });
      return;
    }
    next();
  });
};

// Medical Document Routes
router.post('/upload', protect, uploadFlexibleFiles, uploadRecord);
router.get('/', protect, getRecords);
router.get('/:id', protect, getRecordById);
router.get('/:id/view', protect, viewRecord);
router.post('/:id/process', protect, processRecord);
router.patch('/:id', protect, updateRecordVerification);
router.delete('/:id', protect, deleteRecord);

// Backward Compatibility Aliases
router.post('/:id/analyze', protect, analyzeRecord);
router.get('/:id/analysis', protect, getRecordAnalysis);

module.exports = router;
