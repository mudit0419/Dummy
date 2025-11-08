const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const {
  sendEncryptedReport,
  getEncryptedReport,
  listEncryptedReports,
  deleteEncryptedReport
} = require('../controllers/encryptedReports');

// Send encrypted report
router.post('/send', verifyToken, sendEncryptedReport);

// Get encrypted report by ID
router.get('/:reportId', verifyToken, getEncryptedReport);

// List all encrypted reports for logged-in doctor
router.get('/', verifyToken, listEncryptedReports);

// Delete encrypted report
router.delete('/:reportId', verifyToken, deleteEncryptedReport);

module.exports = router;