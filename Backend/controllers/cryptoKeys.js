const PublicKey = require('../models/publicKey');
const Doctor = require('../models/doctor');
const Patient = require('../models/patient');

// Upload public keys (for both doctors and patients)
exports.uploadPublicKey = async (req, res) => {
  try {
    const { encryptionPublicKey, signingPublicKey, userType } = req.body;
    const userId = req.auth.id;

    // Validate input
    if (!encryptionPublicKey || !signingPublicKey) {
      return res.status(400).json({
        error: 'Both encryption and signing public keys are required'
      });
    }

    if (!userType || !['doctor', 'patient'].includes(userType)) {
      return res.status(400).json({
        error: 'Valid userType (doctor or patient) is required'
      });
    }

    // Determine the correct model based on userType
    const userModel = userType === 'doctor' ? 'Doctor' : 'Patient';
    
    // Verify user exists
    const Model = userType === 'doctor' ? Doctor : Patient;
    const user = await Model.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: `${userType.charAt(0).toUpperCase() + userType.slice(1)} not found`
      });
    }

    // Check if keys already exist for this user
    let existingKey = await PublicKey.findOne({ userId, userModel });

    if (existingKey) {
      // Update existing keys
      existingKey.encryptionPublicKey = encryptionPublicKey;
      existingKey.signingPublicKey = signingPublicKey;
      existingKey.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      await existingKey.save();

      return res.status(200).json({
        message: 'Public keys updated successfully',
        keyId: existingKey._id
      });
    }

    // Create new public key record
    const publicKey = new PublicKey({
      userId,
      userModel,
      encryptionPublicKey,
      signingPublicKey
    });

    await publicKey.save();

    res.status(201).json({
      message: 'Public keys uploaded successfully',
      keyId: publicKey._id
    });
  } catch (error) {
    console.error('Error uploading public keys:', error);
    res.status(500).json({
      error: 'Failed to upload public keys',
      details: error.message
    });
  }
};

// Get public key by user ID
exports.getPublicKey = async (req, res) => {
  try {
    const { userId } = req.params;
    const { userType } = req.query;

    if (!userType || !['doctor', 'patient'].includes(userType)) {
      return res.status(400).json({
        error: 'Valid userType query parameter (doctor or patient) is required'
      });
    }

    const userModel = userType === 'doctor' ? 'Doctor' : 'Patient';

    const publicKey = await PublicKey.findOne({ 
      userId, 
      userModel,
      expiresAt: { $gt: new Date() }
    });

    if (!publicKey) {
      return res.status(404).json({
        error: 'Public key not found or expired'
      });
    }

    res.status(200).json({
      userId: publicKey.userId,
      userType,
      encryptionPublicKey: publicKey.encryptionPublicKey,
      signingPublicKey: publicKey.signingPublicKey,
      createdAt: publicKey.createdAt,
      expiresAt: publicKey.expiresAt
    });
  } catch (error) {
    console.error('Error fetching public key:', error);
    res.status(500).json({
      error: 'Failed to fetch public key',
      details: error.message
    });
  }
};

// Get doctor's public key (for patients sending reports)
exports.getDoctorPublicKey = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const publicKey = await PublicKey.findOne({ 
      userId: doctorId, 
      userModel: 'Doctor',
      expiresAt: { $gt: new Date() }
    });

    if (!publicKey) {
      return res.status(404).json({
        error: 'Doctor public key not found or expired'
      });
    }

    // Also fetch doctor details for verification
    const doctor = await Doctor.findById(doctorId).select('fullName email specializations');

    res.status(200).json({
      doctorId: publicKey.userId,
      doctorInfo: doctor,
      encryptionPublicKey: publicKey.encryptionPublicKey,
      signingPublicKey: publicKey.signingPublicKey
    });
  } catch (error) {
    console.error('Error fetching doctor public key:', error);
    res.status(500).json({
      error: 'Failed to fetch doctor public key',
      details: error.message
    });
  }
};

// Delete public keys (key revocation)
exports.revokePublicKey = async (req, res) => {
  try {
    const userId = req.auth.id;

    const result = await PublicKey.deleteMany({ userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: 'No public keys found to revoke'
      });
    }

    res.status(200).json({
      message: 'Public keys revoked successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error revoking public keys:', error);
    res.status(500).json({
      error: 'Failed to revoke public keys',
      details: error.message
    });
  }
};