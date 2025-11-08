import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  unwrapKey,
  decryptData,
  verifySignature,
  base64ToArrayBuffer,
  importPublicKeyJWK,
  retrievePrivateKeySecurely,
  importPrivateKeyJWK,
  downloadBlob
} from '../utils/crypto';

const ViewEncryptedReports = ({ doctorId }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [decrypting, setDecrypting] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/reports`,
        { withCredentials: true }
      );
      setReports(response.data.reports);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDecryptReport = async (reportId) => {
    setDecrypting(reportId);
    setError('');

    try {
      // 1. Fetch full encrypted report details
      const reportResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/reports/${reportId}`,
        { withCredentials: true }
      );

      const reportData = reportResponse.data;

      // 2. Retrieve doctor's private encryption key
      const doctorEncryptionPrivateKeyJWK = retrievePrivateKeySecurely(`${doctorId}_encryption`);
      if (!doctorEncryptionPrivateKeyJWK) {
        throw new Error('Decryption key not found. Please generate keys first.');
      }

      const doctorPrivateKey = await importPrivateKeyJWK(doctorEncryptionPrivateKeyJWK, 'encryption');

      // 3. Convert base64 strings back to ArrayBuffers
      const wrappedKeyBuffer = base64ToArrayBuffer(reportData.wrappedKey);
      const encryptedDataBuffer = base64ToArrayBuffer(reportData.encryptedData);
      const ivBuffer = base64ToArrayBuffer(reportData.iv);
      const signatureBuffer = base64ToArrayBuffer(reportData.signature);

      // 4. Unwrap the AES key
      const aesKey = await unwrapKey(wrappedKeyBuffer, doctorPrivateKey);

      // 5. Decrypt the data
      const decryptedData = await decryptData(encryptedDataBuffer, aesKey, ivBuffer);

      // 6. Verify signature (if sender's public key is available)
      if (reportData.senderPublicKey) {
        const senderPublicKey = await importPublicKeyJWK(reportData.senderPublicKey, 'signing');
        const isValid = await verifySignature(signatureBuffer, encryptedDataBuffer, senderPublicKey);
        
        if (!isValid) {
          throw new Error('⚠️ Signature verification failed! The report may have been tampered with.');
        }
        console.log('✓ Signature verified successfully');
      }

      // 7. Create blob and download
      const blob = new Blob([decryptedData], { type: reportData.contentType });
      downloadBlob(blob, reportData.filename);

      alert('Report decrypted and downloaded successfully!');

    } catch (err) {
      console.error('Error decrypting report:', err);
      setError(err.message || 'Failed to decrypt report');
    } finally {
      setDecrypting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Encrypted Medical Reports
      </h2>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600">No encrypted reports received yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {report.sender.photo && (
                      <img
                        src={report.sender.photo}
                        alt={report.sender.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {report.filename}
                      </h3>
                      <p className="text-sm text-gray-600">
                        From: {report.sender.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>📄 {report.contentType}</span>
                    <span>📅 {new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDecryptReport(report.id)}
                  disabled={decrypting === report.id}
                  className={`px-4 py-2 rounded-lg font-semibold ${
                    decrypting === report.id
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {decrypting === report.id ? (
                    <span className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Decrypting...
                    </span>
                  ) : (
                    '🔓 Decrypt & Download'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
        <p className="text-sm text-blue-700">
          <strong>🔒 Security:</strong> Reports are end-to-end encrypted. Only you can decrypt them with your private key.
          Signatures are verified automatically to ensure authenticity.
        </p>
      </div>
    </div>
  );
};

export default ViewEncryptedReports;