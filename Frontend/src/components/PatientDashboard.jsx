import { useState, useEffect } from 'react';
import GenerateKeys from './GenerateKeys';
import SendEncryptedReport from './SendEncryptedReport';

const PatientDashboard = ({ patientId }) => {
  const [activeTab, setActiveTab] = useState('send');
  const [hasKeys, setHasKeys] = useState(false);

  useEffect(() => {
    // Check if patient has generated keys
    const signingKey = localStorage.getItem(`privateKey_${patientId}_signing`);
    setHasKeys(!!signingKey);
  }, [patientId]);

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Patient Dashboard
        </h1>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('send')}
              className={`px-6 py-3 font-semibold ${
                activeTab === 'send'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Send Report
            </button>
            <button
              onClick={() => setActiveTab('keys')}
              className={`px-6 py-3 font-semibold ${
                activeTab === 'keys'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Encryption Keys
            </button>
          </div>
        </div>

        {/* Warning if no keys */}
        {!hasKeys && activeTab === 'send' && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-yellow-700">
              <strong>⚠️ Action Required:</strong> You need to generate encryption keys before you can send encrypted reports.
              <button
                onClick={() => setActiveTab('keys')}
                className="ml-2 text-blue-600 hover:underline font-semibold"
              >
                Generate Keys Now →
              </button>
            </p>
          </div>
        )}

        {/* Tab Content */}
        <div>
          {activeTab === 'send' && (
            <SendEncryptedReport patientId={patientId} />
          )}
          {activeTab === 'keys' && (
            <GenerateKeys userType="patient" userId={patientId} />
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;