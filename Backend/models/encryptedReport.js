const mongoose = require('mongoose');

const encryptedReportSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'senderModel'
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['Patient', 'Doctor']
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Doctor'
  },
  filename: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  // Encrypted data stored as base64 string
  encryptedData: {
    type: String,
    required: true
  },
  // Initialization Vector for AES-GCM
  iv: {
    type: String,
    required: true
  },
  // AES key wrapped with doctor's RSA public key
  wrappedKey: {
    type: String,
    required: true
  },
  // Digital signature from sender
  signature: {
    type: String,
    required: true
  },
  // Algorithm details
  algorithm: {
    type: String,
    default: 'AES-GCM-256/RSA-OAEP-SHA-256/RSA-PSS-SHA-256'
  },
  // Metadata
  metadata: {
    originalSize: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('EncryptedReport', encryptedReportSchema);