import React from 'react';
import { useNavigate } from 'react-router-dom';

export const IdVerification = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-primary-600 p-6 text-center">
          <h2 className="text-2xl font-bold text-white">Identity Verification</h2>
          <p className="text-primary-100">KYC &amp; Biometric Setup</p>
        </div>

        <div className="p-8 space-y-6 text-sm text-gray-700">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-yellow-800">
            <strong className="block mb-2">What happens next?</strong>
            <ul className="list-disc ml-5 space-y-1">
              <li>Your KYC documents and biometric photo were captured during registration.</li>
              <li>An admin will manually review your details and approve your account for voting.</li>
              <li>Once approved, your status will update to VERIFIED and you will be able to vote.</li>
              <li>If biometric checks fail repeatedly during voting, admins can still approve you here after manual verification.</li>
            </ul>
          </div>

          <p>
            You don&apos;t need to do anything else on this page. You can return to your dashboard and wait
            for approval, or contact support if your status does not update in time.
          </p>

          <button
            onClick={() => navigate('/User')}
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};