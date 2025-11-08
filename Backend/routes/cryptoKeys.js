const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const {
  uploadPublicKey,
  getPublicKey,
  getDoctorPublicKey,
  revokePublicKey
} = require('../controllers/cryptoKeys');

// Upload public keys (doctor or patient)
router.post('/upload', verifyToken, uploadPublicKey);

// Get public key by user ID
router.get('/user/:userId/public', getPublicKey);

// Get doctor's public key specifically (THIS WAS MISSING)
router.get('/doctor/:doctorId/public', getDoctorPublicKey);

// Revoke public keys
router.delete('/revoke', verifyToken, revokePublicKey);

module.exports = router;