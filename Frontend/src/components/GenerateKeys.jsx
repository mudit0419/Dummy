import { useState } from 'react';
import axios from 'axios';
import {
  generateEncryptionKeyPair,
  generateSigningKeyPair,
  exportPublicKeyJWK,
  exportPrivateKeyJWK,
  storePrivateKeySecurely
} from '../utils/crypto';

const GenerateKeys = ({ userType, userId }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [keysGenerated, setKeysGenerated] = useState(false);

  const handleGenerateKeys = async () => {
    setLoading(true);
    setError('');
    setStatus('Generating encryption key pair...');

    try {
      // 1. Generate RSA-OAEP key pair for encryption
      const encryptionKeyPair = await generateEncryptionKeyPair();
      setStatus('Generating signing key pair...');

      // 2. Generate RSA-PSS key pair for signing
      const signingKeyPair = await generateSigningKeyPair();
      setStatus('Exporting keys...');

      // 3. Export public keys to JWK
      const encryptionPublicKeyJWK = await exportPublicKeyJWK(encryptionKeyPair.publicKey);
      const signingPublicKeyJWK = await exportPublicKeyJWK(signingKeyPair.publicKey);

      // 4. Export private keys to JWK
      const encryptionPrivateKeyJWK = await exportPrivateKeyJWK(encryptionKeyPair.privateKey);
      const signingPrivateKeyJWK = await exportPrivateKeyJWK(signingKeyPair.privateKey);

      // 5. Store private keys securely (client-side)
      setStatus('Storing private keys securely...');
      await storePrivateKeySecurely(encryptionPrivateKeyJWK, 'user-password', `${userId}_encryption`);
      await storePrivateKeySecurely(signingPrivateKeyJWK, 'user-password', `${userId}_signing`);

      // 6. Upload public keys to server
      setStatus('Uploading public keys to server...');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/keys/upload`,
        {
          encryptionPublicKey: encryptionPublicKeyJWK,
          signingPublicKey: signingPublicKeyJWK,
          userType
        },
        { withCredentials: true }
      );

      setStatus('Keys generated and uploaded successfully!');
      setKeysGenerated(true);

      // Provide backup option
      downloadPrivateKeysBackup({
        encryptionPrivateKey: encryptionPrivateKeyJWK,
        signingPrivateKey: signingPrivateKeyJWK,
        userId,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('Error generating keys:', err);
      setError(err.response?.data?.error || err.message || 'Failed to generate keys');
    } finally {
      setLoading(false);
    }
  };

  const downloadPrivateKeysBackup = (keysData) => {
    const blob = new Blob([JSON.stringify(keysData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `private-keys-backup-${userId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {userType === 'doctor' ? 'Doctor' : 'Patient'} Encryption Keys
      </h2>
      
      <div className="mb-4">
        <p className="text-gray-600 mb-2">
          Generate your encryption keys to securely send and receive medical reports.
        </p>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <p className="text-sm text-yellow-700">
            <strong>⚠️ Important:</strong> Your private keys will be stored securely in your browser
            and will be automatically backed up to a file. Keep this backup safe!
          </p>
        </div>
      </div>

      {!keysGenerated ? (
        <button
          onClick={handleGenerateKeys}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {status}
            </span>
          ) : (
            'Generate Encryption Keys'
          )}
        </button>
      ) : (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <p className="text-green-700 font-semibold">✓ Keys generated successfully!</p>
          <p className="text-sm text-green-600 mt-2">
            Your private keys have been backed up. You can now securely send and receive encrypted reports.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {status && !loading && !keysGenerated && (
        <div className="mt-4 text-gray-600">
          <p>{status}</p>
        </div>
      )}
    </div>
  );
};

export default GenerateKeys;