
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtime } from '../../contexts/RealtimeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { AlertTriangle, Lock, Info, Camera, CheckCircle, ShieldCheck, X, EyeOff } from 'lucide-react';
import { analyzeFraudRisk, verifyFaceIdentity } from '../../services/geminiService';

export const VotingPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { elections, candidates, castVote, votes, reportFraud } = useRealtime();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'CAMERA' | 'PROCESSING' | 'SUCCESS' | 'FAILED'>('CAMERA');

  const [violationCount, setViolationCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const election = elections.find(e => e.id === id);
  const electionCandidates = candidates.filter(c => c.electionId === id);
  const hasVoted = votes.some(v => v.voterId === user?.id && v.electionId === id);

  // BackscreenCapture: Background Policy Enforcement
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation("Tab Switch / Window Blur");
      }
    };

    const handleBlur = () => {
      handleViolation("Window Lost Focus");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    // Initial Environment Check
    const checkEnvironment = async () => {
      const environmentData = {
        mouseJitter: Math.random(),
        windowFocusChanges: 0,
        ipTrustScore: 0.95
      };

      const analysis = await analyzeFraudRisk(environmentData);
      if (analysis.riskLevel === 'HIGH') {
        addNotification('WARNING', 'Security Alert', 'Suspicious activity detected. Session flagged.');
        reportFraud({
          id: Date.now().toString(),
          voterId: user?.id || 'unknown',
          electionId: id || 'unknown',
          reason: 'High Risk Environment',
          riskLevel: 'HIGH',
          details: analysis.reasoning,
          timestamp: new Date().toISOString()
        });
      }
    };
    checkEnvironment();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [user, id]);

  const handleViolation = (type: string) => {
    setViolationCount(prev => prev + 1);
    addNotification('ERROR', 'Security Violation', `${type} detected. This incident has been logged.`);

    if (user && id) {
      reportFraud({
        id: Date.now().toString(),
        voterId: user.id,
        electionId: id,
        reason: type,
        riskLevel: 'MEDIUM',
        details: 'User left the voting tab or window lost focus.',
        timestamp: new Date().toISOString()
      });
    }
  };

  const initiateVote = () => {
    if (!selectedCandidate) return;
    if (violationCount > 3) {
      addNotification('ERROR', 'Session Blocked', 'Too many security violations. You cannot vote in this session.');
      return;
    }
    setShowVerificationModal(true);
    startCamera();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      addNotification('ERROR', 'Camera Error', 'Camera required for voting verification.');
      setShowVerificationModal(false);
    }
  };

  const captureFrame = (): string | null => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        return canvas.toDataURL('image/jpeg').split(',')[1];
      }
    }
    return null;
  };

  const verifyAndVote = async () => {
    setVerificationStep('PROCESSING');

    const liveFaceBase64 = captureFrame();

    if (!liveFaceBase64 || !user?.faceUrl) {
      addNotification('ERROR', 'Verification Error', 'Could not capture face or missing reference photo.');
      setVerificationStep('FAILED');
      return;
    }

    try {
      const result = await verifyFaceIdentity(user.faceUrl, liveFaceBase64);

      if (result.match) {
        setVerificationStep('SUCCESS');

        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }

        setTimeout(async () => {
          setIsSubmitting(true);
          try {
            if (id && selectedCandidate && user) {
              await castVote(id, selectedCandidate, user.id);
              addNotification('SUCCESS', 'Vote Verified & Cast', 'Your vote has been recorded on the blockchain.');
              setTimeout(() => navigate('/User'), 1500);
            }
          } catch (e) {
            addNotification('ERROR', 'Vote Failed', 'Error submitting vote.');
            setIsSubmitting(false);
            setShowVerificationModal(false);
          }
        }, 1000);

      } else {
        setVerificationStep('FAILED');
        addNotification('ERROR', 'Identity Mismatch', 'Face verification failed. Please try again or contact admin.');
      }

    } catch (e) {
      setVerificationStep('FAILED');
      addNotification('ERROR', 'System Error', 'Verification service unavailable.');
    }
  };

  if (hasVoted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <Info className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Vote Already Cast</h2>
          <p className="text-gray-600 mt-2 mb-6">You have already participated in this election.</p>
          <button onClick={() => navigate('/User')} className="bg-gray-800 text-white px-6 py-2 rounded-lg">Return Home</button>
        </div>
      </div>
    );
  }

  if (user?.verificationStatus !== 'VERIFIED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Verification Required</h2>
          <p className="text-gray-600 mt-2 mb-6">You must complete biometric verification (KYC) before voting.</p>
          <button onClick={() => navigate('/IdVerification')} className="bg-primary-600 text-white px-6 py-2 rounded-lg">Go to Verification</button>
        </div>
      </div>
    );
  }

  if (!election) return <div className="p-10 text-center">Election not found.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 relative">
      {/* Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl overflow-hidden max-w-md w-full shadow-2xl relative">
            {verificationStep !== 'SUCCESS' && (
              <button
                onClick={() => setShowVerificationModal(false)}
                className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/40 p-1 rounded-full text-white"
              >
                <X size={20} />
              </button>
            )}

            <div className="bg-gray-900 p-6 text-center text-white">
              <h3 className="text-xl font-bold flex items-center justify-center gap-2">
                <ShieldCheck className="text-green-400" /> Secure Vote Verification
              </h3>
              <p className="text-gray-400 text-sm mt-1">Biometric confirmation required</p>
            </div>

            <div className="p-6 flex flex-col items-center">
              {(verificationStep === 'CAMERA' || verificationStep === 'FAILED') && (
                <>
                  <div className="relative w-64 h-64 bg-black rounded-full overflow-hidden border-4 border-primary-500 mb-4 shadow-inner">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                  </div>
                  <p className="text-gray-600 text-center mb-6">Look directly at the camera to verify your identity.</p>
                  <button
                    onClick={verifyAndVote}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-bold shadow-lg transition"
                  >
                    {verificationStep === 'FAILED' ? 'Retry Verification' : 'Verify & Cast Vote'}
                  </button>
                </>
              )}

              {verificationStep === 'PROCESSING' && (
                <div className="py-12 flex flex-col items-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mb-4"></div>
                  <h4 className="text-xl font-bold text-gray-800">Verifying Identity...</h4>
                  <p className="text-gray-500">Matching biometric data with records</p>
                </div>
              )}

              {verificationStep === 'SUCCESS' && (
                <div className="py-8 flex flex-col items-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-green-700 mb-1">Identity Verified!</h4>
                  <p className="text-gray-500">Vote submitted successfully.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-blue-900 text-white p-6 rounded-t-xl flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-2xl font-bold">Official Ballot</h1>
          <p className="text-blue-200 text-sm">{election.title}</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 text-green-400 bg-white/10 px-3 py-1 rounded-full text-xs border border-green-400/30 mb-1">
            <Lock size={12} /> Secure Session Active
          </div>
          {violationCount > 0 && (
            <div className="flex items-center gap-1 text-red-300 text-xs">
              <EyeOff size={12} /> {violationCount} Violations Logged
            </div>
          )}
        </div>
      </div>

      {/* Candidate List */}
      <div className="bg-white border-x border-b rounded-b-xl p-8 shadow-sm">
        <h3 className="text-gray-700 font-medium mb-6">Select a candidate from the list below:</h3>

        <div className="grid gap-4">
          {electionCandidates.length === 0 ? <p className="text-center text-gray-500 italic">No candidates available.</p> : electionCandidates.map((candidate) => (
            <label
              key={candidate.id}
              className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedCandidate === candidate.id
                  ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-500'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
            >
              <input
                type="radio"
                name="candidate"
                value={candidate.id}
                className="sr-only"
                onChange={() => setSelectedCandidate(candidate.id)}
              />
              <img
                src={candidate.partySymbolUrl || `https://ui-avatars.com/api/?name=${candidate.party.replace(' ', '+')}&background=random`}
                alt="Symbol"
                className="w-16 h-16 rounded-full bg-gray-200 object-cover shadow-sm"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${candidate.party.replace(' ', '+')}&background=random`;
                }}
              />
              <div className="ml-4 flex-1">
                <h4 className="text-lg font-bold text-gray-900">{candidate.name}</h4>
                <p className="text-sm text-primary-600 font-semibold">{candidate.party}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{candidate.manifesto}</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedCandidate === candidate.id ? 'border-primary-600 bg-primary-600' : 'border-gray-300'
                }`}>
                {selectedCandidate === candidate.id && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
              </div>
            </label>
          ))}
        </div>

        <div className="mt-8 flex justify-end pt-6 border-t">
          <button
            onClick={initiateVote}
            disabled={!selectedCandidate || isSubmitting || violationCount > 3}
            className={`px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all flex items-center gap-2 ${!selectedCandidate || isSubmitting || violationCount > 3
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 transform hover:-translate-y-0.5'
              }`}
          >
            {isSubmitting ? 'Processing...' : <>Review & Verify <Camera size={18} /></>}
          </button>
        </div>
      </div>
    </div>
  );
};
