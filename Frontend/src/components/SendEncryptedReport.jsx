import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  generateAESKey,
  encryptData,
  wrapKey,
  signData,
  readFileAsArrayBuffer,
  arrayBufferToBase64,
  importPublicKeyJWK,
  retrievePrivateKeySecurely,
  importPrivateKeyJWK
} from '../utils/crypto';

const SendEncryptedReport = ({ patientId }) => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [hasKeys, setHasKeys] = useState(false);

  useEffect(() => {
    fetchDoctors();
    checkKeys();
  }, [patientId]);

  const checkKeys = () => {
    const signingKey = localStorage.getItem(`privateKey_${patientId}_signing`);
    setHasKeys(!!signingKey);
  };

  const fetchDoctors = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/doctors`,
        { withCredentials: true }
      );
      setDoctors(response.data.doctors);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Failed to load doctors list');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please select a valid PDF file');
      setFile(null);
    }
  };

  const handleSendReport = async () => {
    if (!file || !selectedDoctor) {
      setError('Please select a doctor and a file');
      return;
    }

    if (!hasKeys) {
      setError('Please generate encryption keys first');
      return;
    }

    setLoading(true);
    setError('');
    setStatus('Reading file...');

    try {
      // 1. Read file as ArrayBuffer
      const fileData = await readFileAsArrayBuffer(file);
      setStatus('Fetching doctor\'s public key...');

      // 2. Fetch doctor's public key - FIXED URL
      const keyResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/keys/doctor/${selectedDoctor}/public`,
        { withCredentials: true }
      );
      const doctorEncryptionPublicKeyJWK = keyResponse.data.encryptionPublicKey;
      setStatus('Generating encryption key...');

      // 3. Generate ephemeral AES key
      const aesKey = await generateAESKey();
      setStatus('Encrypting file...');

      // 4. Encrypt file data with AES-GCM
      const { ciphertext, iv } = await encryptData(fileData, aesKey);
      setStatus('Wrapping encryption key...');

      // 5. Import doctor's RSA public key
      const doctorPublicKey = await importPublicKeyJWK(doctorEncryptionPublicKeyJWK, 'encryption');

      // 6. Wrap AES key with doctor's public key
      const wrappedKey = await wrapKey(aesKey, doctorPublicKey);
      setStatus('Retrieving signing key...');

      // 7. Retrieve patient's private signing key
      const patientSigningPrivateKeyJWK = retrievePrivateKeySecurely(`${patientId}_signing`);
      if (!patientSigningPrivateKeyJWK) {
        throw new Error('Signing key not found. Please generate keys first.');
      }

      const patientSigningPrivateKey = await importPrivateKeyJWK(patientSigningPrivateKeyJWK, 'signing');
      setStatus('Signing data...');

      // 8. Sign the ciphertext
      const signature = await signData(ciphertext, patientSigningPrivateKey);
      setStatus('Uploading encrypted report...');

      // 9. Prepare payload
      const payload = {
        recipientId: selectedDoctor,
        filename: file.name,
        contentType: file.type,
        encryptedData: arrayBufferToBase64(ciphertext),
        iv: arrayBufferToBase64(iv),
        wrappedKey: arrayBufferToBase64(wrappedKey),
        signature: arrayBufferToBase64(signature),
        metadata: {
          originalSize: file.size,
          uploadedAt: new Date().toISOString()
        }
      };

      // 10. Send to server
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/reports/send`,
        payload,
        { withCredentials: true }
      );

      setStatus('Report sent successfully!');
      setFile(null);
      setSelectedDoctor('');

      // Reset form
      setTimeout(() => {
        setStatus('');
      }, 3000);

    } catch (err) {
      console.error('Error sending encrypted report:', err);
      setError(err.response?.data?.error || err.message || 'Failed to send report');
    } finally {
      setLoading(false);
    }
  };

  if (!hasKeys) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
        <p className="text-yellow-700 font-semibold mb-2">⚠️ Keys Not Generated</p>
        <p className="text-yellow-600 mb-4">
          You need to generate encryption keys before you can send encrypted reports.
        </p>
        <button
          onClick={() => window.location.href = '/generate-keys'}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Generate Keys Now
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Send Encrypted Medical Report
      </h2>

      <div className="space-y-4">
        {/* Doctor Selection */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Select Doctor
          </label>
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">-- Select a Doctor --</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.fullName} - {doctor.specializations?.[0] || 'General'}
              </option>
            ))}
          </select>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Select Report (PDF only)
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
            disabled={loading}
          />
          {file && (
            <p className="text-sm text-gray-600 mt-1">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSendReport}
          disabled={loading || !file || !selectedDoctor}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white ${
            loading || !file || !selectedDoctor
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
            'Send Encrypted Report'
          )}
        </button>

        {/* Status/Error Messages */}
        {status && !loading && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <p className="text-green-700">{status}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Security Info */}
      <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
        <p className="text-sm text-blue-700">
          <strong>🔒 Security:</strong> Your report is encrypted on your device before sending.
          Only the selected doctor can decrypt it.
        </p>
      </div>
    </div>
  );
};

export default SendEncryptedReport;