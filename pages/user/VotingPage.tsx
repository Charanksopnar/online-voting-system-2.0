
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtime } from '../../contexts/RealtimeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { AlertTriangle, Lock, Info, Camera, CheckCircle, ShieldCheck, Loader2, EyeOff } from 'lucide-react';
import { LivenessCamera } from '../../components/LivenessCamera';
import { verifyFace, checkBackendHealth } from '../../services/faceService';

export const VotingPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { elections, candidates, castVote, votes, reportFraud } = useRealtime();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLivenessCamera, setShowLivenessCamera] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'VERIFYING' | 'SUCCESS' | 'FAILED'>('VERIFYING');
  const [showResultModal, setShowResultModal] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [faceAccuracy, setFaceAccuracy] = useState<number | null>(null);

  const [violationCount, setViolationCount] = useState(0);

  const election = elections.find(e => e.id === id);
  const electionCandidates = candidates.filter(c => c.electionId === id);
  const hasVoted = votes.some(v => v.voterId === user?.id && v.electionId === id);

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth().then(setBackendHealthy);
  }, []);

  // BackscreenCapture: Background Policy Enforcement (Tab switch detection only)
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

    // Block voting if no face embeddings exist - require biometric verification
    if (!user?.faceEmbeddings || user.faceEmbeddings.length === 0) {
      addNotification('ERROR', 'Biometric Data Missing',
        'No face verification data found. Please complete your KYC/face registration before voting.');
      return;
    }

    // For biometric path, require backend to be healthy and embeddings present
    if (backendHealthy === false) {
      addNotification('ERROR', 'Service Unavailable', 'Face verification service is offline. Please try again later or contact support.');
      return;
    }

    setShowLivenessCamera(true);
  };

  const handleLivenessCaptureComplete = async (frames: string[]) => {
    setShowLivenessCamera(false);
    setShowResultModal(true);
    setVerificationStep('VERIFYING');

    try {
      // Verify face using Python backend
      const result = await verifyFace(frames, user!.faceEmbeddings);

      if (result.match && result.confidence > 0.5) {
        setFaceAccuracy(result.confidence * 100);
        setVerificationStep('SUCCESS');

        setTimeout(async () => {
          setIsSubmitting(true);
          try {
            if (id && selectedCandidate && user) {
              await castVote(id, selectedCandidate, user.id, 1 - result.confidence);
              addNotification('SUCCESS', 'Vote Cast Successfully', `Your vote has been securely recorded (Confidence: ${(result.confidence * 100).toFixed(1)}%).`);
              setTimeout(() => navigate('/User'), 2000);
            }
          } catch (e: any) {
            addNotification('ERROR', 'Vote Failed', e.message || 'Error submitting vote.');
            setIsSubmitting(false);
            setShowResultModal(false);
          }
        }, 2000);

      } else {
        setFaceAccuracy(result.confidence * 100);
        setVerificationStep('FAILED');
        addNotification('ERROR', 'Identity Verification Failed', `${result.message} (Confidence: ${(result.confidence * 100).toFixed(1)}%)`);

        // Log fraud attempt
        if (user && id) {
          reportFraud({
            id: Date.now().toString(),
            voterId: user.id,
            electionId: id,
            reason: 'Face Verification Failed',
            riskLevel: 'HIGH',
            details: `Confidence: ${result.confidence}, Distance: ${result.distance}`,
            timestamp: new Date().toISOString()
          });
        }
      }

    } catch (e: any) {
      setVerificationStep('FAILED');
      addNotification('ERROR', 'System Error', e.message || 'Verification service unavailable.');
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

  if (!user?.electoralRollVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Electoral Roll Verification Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2 mb-6">Your identity must be verified against the Electoral Roll before you can vote. Please wait for admin verification or request manual verification from your dashboard.</p>
          <button onClick={() => navigate('/User')} className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  if (!election) return <div className="p-10 text-center">Election not found.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 relative">
      {/* Liveness Camera Modal */}
      {showLivenessCamera && (
        <LivenessCamera
          onCapture={handleLivenessCaptureComplete}
          onCancel={() => setShowLivenessCamera(false)}
          mode="verify"
        />
      )}

      {/* Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl overflow-hidden max-w-md w-full shadow-2xl">
            <div className="bg-gray-900 p-6 text-center text-white">
              <h3 className="text-xl font-bold flex items-center justify-center gap-2">
                <ShieldCheck className="text-green-400" /> Secure Vote Verification
              </h3>
              <p className="text-gray-400 text-sm mt-1">Biometric confirmation in progress</p>
            </div>

            <div className="p-6 flex flex-col items-center">
              {verificationStep === 'VERIFYING' && (
                <div className="py-12 flex flex-col items-center">
                  <Loader2 className="animate-spin rounded-full h-16 w-16 text-primary-600 mb-4" />
                  <h4 className="text-xl font-bold text-gray-800">Verifying Identity...</h4>
                  <p className="text-gray-500">Comparing face data with registration</p>
                </div>
              )}

              {verificationStep === 'SUCCESS' && (
                <div className="py-8 flex flex-col items-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-green-700 mb-1">Identity Verified!</h4>
                  {faceAccuracy !== null && (
                    <div className="mb-3 text-center">
                      <div className="text-3xl font-bold text-green-600">{faceAccuracy.toFixed(1)}%</div>
                      <div className="text-sm text-gray-500">Face Match Accuracy</div>
                    </div>
                  )}
                  <p className="text-gray-500">Casting your vote securely...</p>
                </div>
              )}

              {verificationStep === 'FAILED' && (
                <div className="py-8 flex flex-col items-center">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="w-10 h-10 text-red-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-red-700 mb-1">Verification Failed</h4>
                  {faceAccuracy !== null && (
                    <div className="mb-3 text-center">
                      <div className="text-3xl font-bold text-red-500">{faceAccuracy.toFixed(1)}%</div>
                      <div className="text-sm text-gray-500">Face Match Accuracy (Min: 50%)</div>
                    </div>
                  )}
                  <p className="text-gray-500 text-center mb-6">Your identity could not be verified. Please try again.</p>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setShowResultModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setShowResultModal(false);
                        setShowLivenessCamera(true);
                      }}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Retry
                    </button>
                  </div>
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
            {isSubmitting ? 'Processing...' : <><Camera size={18} /> Verify & Cast Vote</>}
          </button>
        </div>
      </div>
    </div>
  );
};
