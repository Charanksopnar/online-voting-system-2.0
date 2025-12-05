import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtime } from '../../contexts/RealtimeContext';
import { useNavigate } from 'react-router-dom';
import { Camera, CheckCircle, XCircle } from 'lucide-react';
import { VerificationStatus } from '../../types';

export const IdVerification = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [step, setStep] = useState(1); // 1: Info, 2: Capture, 3: Success
  const { user } = useAuth();
  const { updateVoterStatus } = useRealtime();
  const navigate = useNavigate();

  useEffect(() => {
    if (step === 2 && !isCameraActive) {
      startCamera();
    }
    return () => stopCamera();
  }, [step]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      alert("Could not access camera. Please allow permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const handleCapture = () => {
    // Simulate biometric processing time
    stopCamera();
    
    // In real app: Send frame to backend for Face Match + Liveness
    // Here we simulate immediate success and update DB
    if (user) {
        // We set to PENDING for Admin Review usually, but for demo flow we can auto-verify or set PENDING
        updateVoterStatus(user.id, VerificationStatus.PENDING);
    }
    setStep(3);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-primary-600 p-6 text-center">
          <h2 className="text-2xl font-bold text-white">Identity Verification</h2>
          <p className="text-primary-100">KYC & Biometric Setup</p>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="text-center space-y-6">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-yellow-800 text-sm text-left">
                <strong>Instructions:</strong>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>Ensure you are in a well-lit environment.</li>
                  <li>Remove glasses or hats.</li>
                  <li>Look directly at the camera.</li>
                </ul>
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700"
              >
                Start Face Verification
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-64 h-64 bg-gray-900 rounded-full overflow-hidden border-4 border-primary-500 shadow-xl">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover transform scale-x-[-1]" 
                />
                {/* Face guide overlay */}
                <div className="absolute inset-0 border-4 border-white/30 rounded-full m-4 pointer-events-none"></div>
              </div>
              <p className="text-sm text-gray-500 animate-pulse">Analyzing face geometry...</p>
              <button
                onClick={handleCapture}
                className="flex items-center gap-2 px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <Camera size={20} /> Capture
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Submitted for Review</h3>
              <p className="text-gray-600">Your biometric data has been captured. An admin will review your KYC shortly.</p>
              <button
                onClick={() => navigate('/User')}
                className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};