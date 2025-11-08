const mongoose = require('mongoose');

const publicKeySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel'
  },
  userModel: {
    type: String,
    required: true,
    enum: ['Patient', 'Doctor']
  },
  // RSA-OAEP public key for encryption (JWK format)
  encryptionPublicKey: {
    type: Object,
    required: true
  },
  // RSA-PSS public key for signature verification (JWK format)
  signingPublicKey: {
    type: Object,
    required: true
  },
  keyType: {
    type: String,
    default: 'RSA'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    // Keys expire after 1 year
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  }
}, { timestamps: true });

// Index for faster lookups
publicKeySchema.index({ userId: 1, userModel: 1 });

module.exports = mongoose.model('PublicKey', publicKeySchema);