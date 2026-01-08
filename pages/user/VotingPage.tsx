
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtime } from '../../contexts/RealtimeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { AlertTriangle, Lock, Info, Camera, CheckCircle, ShieldCheck, Loader2, EyeOff, RefreshCw } from 'lucide-react';
import { VerificationCamera } from '../../components/VerificationCamera';
import { LogConsole } from '../../components/UI/LogConsole';
import { verifyUserWithDeepFace, checkBackendHealth, generateVerificationToken } from '../../services/faceService';
import { logger } from '../../services/loggerService';
import { supabaseVoter, supabase } from '../../supabase';

export const VotingPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { elections, candidates, castVote, votes, reportFraud } = useRealtime();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLivenessCamera, setShowLivenessCamera] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'LOADING_EMBEDDING' | 'VERIFYING' | 'SUCCESS' | 'FAILED'>('LOADING_EMBEDDING');
  const [showResultModal, setShowResultModal] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [verificationScore, setVerificationScore] = useState<number | null>(null);

  const [violationCount, setViolationCount] = useState(0);

  // PRODUCTION: Face verification retry limits
  const MAX_FAILED_ATTEMPTS = 3;
  const RETRY_COOLDOWN_MS = 5000; // 5 second cooldown between retries
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lastFailedTime, setLastFailedTime] = useState<number | null>(null);

  const election = elections.find(e => e.id === id);
  const electionCandidates = candidates.filter(c => c.electionId === id);
  const hasVoted = votes.some(v => v.voterId === user?.id && v.electionId === id);

  // Session State
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Check backend health and start session on mount
  useEffect(() => {
    checkBackendHealth().then(setBackendHealthy);

    const startSession = async () => {
      if (!user || !id) return;

      const { data, error } = await supabase
        .from('voting_sessions')
        .insert({
          voter_id: user.id,
          election_id: id,
          ip_address: 'unknown', // Ideally fetch this
          user_agent: navigator.userAgent
        })
        .select()
        .single();

      if (!error && data) {
        setSessionId(data.id);
      }
    };

    startSession();
  }, [user, id]);

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

  const handleViolation = async (type: string) => {
    setViolationCount(prev => prev + 1);
    addNotification('ERROR', 'Security Violation', `${type} detected. This incident has been logged.`);

    if (user && id) {
      // 1. Log to fraud_alerts
      reportFraud({
        id: Date.now().toString(),
        voterId: user.id,
        electionId: id,
        reason: type,
        riskLevel: 'MEDIUM',
        details: 'User left the voting tab or window lost focus.',
        timestamp: new Date().toISOString()
      });

      // 2. Update voting session in DB
      if (sessionId) {
        await supabase
          .from('voting_sessions')
          .update({
            violation_count: violationCount + 1,
            blocked_at: (violationCount + 1) > 3 ? new Date().toISOString() : null,
            blocked_reason: (violationCount + 1) > 3 ? 'Too many violations' : null
          })
          .eq('id', sessionId);
      }
    }
  };

  const initiateVote = () => {
    logger.info('Voting', 'Initiating vote sequence...', { candidateId: selectedCandidate });
    if (!selectedCandidate) return;
    if (violationCount > 3) {
      logger.error('Voting', 'Session blocked due to too many security violations.');
      addNotification('ERROR', 'Session Blocked', 'Too many security violations. You cannot vote in this session.');
      return;
    }

    // Block voting if no face embeddings exist - require biometric verification
    if (!user?.faceEmbeddings || user.faceEmbeddings.length === 0) {
      logger.warning('Voting', 'Face embeddings missing from user profile. Checking local backup...');

      // Attempt local fallback
      const tryLocalFallback = async () => {
        const backup = await logger.getLocalBackup(`${user?.firstName} ${user?.lastName}`);
        if (backup && backup.faceEmbeddings) {
          logger.success('Voting', 'Local backup found. Using offline biometric data.');
          user!.faceEmbeddings = backup.faceEmbeddings;
          return true;
        }
        return false;
      };

      tryLocalFallback().then(found => {
        if (!found) {
          addNotification('ERROR', 'Biometric Data Missing',
            'No face verification data found online or offline. Please update your face biometrics.');
          setTimeout(() => navigate('/Edit'), 2000);
        } else {
          // Retry initiateVote after loading fallback
          initiateVote();
        }
      });
      return;
    }

    // PRODUCTION: Check failed attempts limit
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      addNotification('ERROR', 'Verification Blocked',
        'Too many failed face verification attempts. Please contact support or try again later.');
      return;
    }

    // PRODUCTION: Check cooldown period after failed attempt
    if (lastFailedTime) {
      const timeSinceFailure = Date.now() - lastFailedTime;
      if (timeSinceFailure < RETRY_COOLDOWN_MS) {
        const remaining = Math.ceil((RETRY_COOLDOWN_MS - timeSinceFailure) / 1000);
        addNotification('WARNING', 'Please Wait',
          `Wait ${remaining} seconds before your next verification attempt.`);
        return;
      }
    }

    // For biometric path, require backend to be healthy and embeddings present
    if (backendHealthy === false) {
      logger.error('Voting', 'Face service offline.');
      addNotification('ERROR', 'Service Unavailable', 'Face verification service is offline. Please try again later or contact support.');
      return;
    }

    logger.debug('Voting', 'Opening verification camera.');
    setShowLivenessCamera(true);
  };

  const handleVerificationComplete = async (frames: string[]) => {
    logger.info('Voting', 'Verification samples received. Starting verification process...');
    setShowLivenessCamera(false);
    setShowResultModal(true);

    try {
      // Step 1: Show loading state for embedding retrieval
      setVerificationStep('LOADING_EMBEDDING');
      logger.debug('Voting', 'Loading stored face embedding from database...');

      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 2: Start verification with DeepFace
      setVerificationStep('VERIFYING');
      logger.debug('Voting', 'Comparing with DeepFace backend...');

      const result = await verifyUserWithDeepFace(frames, user!.faceEmbeddings);

      logger.info('Voting', `Verification result: ${result.success ? 'SUCCESS' : 'FAILED'} | Score: ${result.score}%`);

      // PRODUCTION: Log ALL verification attempts for auditing
      try {
        await supabaseVoter.from('fraud_alerts').insert({
          voter_id: user!.id,
          election_id: id,
          reason: result.success ? 'FACE_VERIFY_SUCCESS' : 'FACE_VERIFY_FAILED',
          risk_level: result.success ? 'LOW' : (result.confidence < 0.3 ? 'HIGH' : 'MEDIUM'),
          details: JSON.stringify({
            score: result.score,
            confidence: result.confidence,
            distance: result.distance,
            timestamp: new Date().toISOString(),
            attemptNumber: failedAttempts + 1
          })
        });
      } catch (logErr) {
        console.warn('Failed to log verification attempt:', logErr);
      }

      if (result.success && result.confidence >= 0.60) {
        setVerificationScore(result.score);
        setVerificationStep('SUCCESS');
        setFailedAttempts(0); // Reset on success

        // Log to face_verification_attempts
        try {
          await supabase.from('face_verification_attempts').insert({
            voter_id: user!.id,
            election_id: id,
            success: true,
            confidence_score: result.confidence,
            distance: result.distance,
            ip_address: 'unknown'
          });
        } catch (logErr) {
          console.warn('Failed to log success attempt:', logErr);
        }

        setTimeout(async () => {
          setIsSubmitting(true);
          try {
            if (id && selectedCandidate && user) {
              logger.info('Voting', 'Generating verification token...');
              const token = generateVerificationToken(user.id, id, result.confidence);

              logger.info('Voting', 'Submitting vote with secure token...');
              await castVote(id, selectedCandidate, user.id, 1 - result.confidence, token, result.confidence);

              // Mark session as completed
              if (sessionId) {
                await supabase
                  .from('voting_sessions')
                  .update({ completed_at: new Date().toISOString() })
                  .eq('id', sessionId);
              }

              logger.success('Voting', 'Vote successfully recorded.');

              // Persist locally for offline audit
              await logger.persistLocally(`${user.firstName} ${user.lastName}`, 'VOTE_CAST', {
                user: user.id,
                electionId: id,
                candidateId: selectedCandidate,
                score: result.score,
                confidence: result.confidence,
                timestamp: new Date().toISOString()
              });

              addNotification('SUCCESS', 'Vote Cast Successfully', `Your vote has been securely recorded (Match: ${result.score}%).`);
              setTimeout(() => navigate('/User'), 2000);
            }
          } catch (e: any) {
            addNotification('ERROR', 'Vote Failed', e.message || 'Error submitting vote.');
            setIsSubmitting(false);
            setShowResultModal(false);
          }
        }, 2000);

      } else {
        // PRODUCTION: Track failed attempts in DB
        try {
          await supabase.from('face_verification_attempts').insert({
            voter_id: user!.id,
            election_id: id,
            success: false,
            confidence_score: result.confidence,
            distance: result.distance,
            failure_reason: result.message,
            ip_address: 'unknown'
          });
        } catch (logErr) {
          console.warn('Failed to log failure attempt:', logErr);
        }

        setFailedAttempts(prev => prev + 1);
        setLastFailedTime(Date.now());

        setVerificationScore(result.score);
        setVerificationStep('FAILED');

        const remainingAttempts = MAX_FAILED_ATTEMPTS - (failedAttempts + 1);
        addNotification('ERROR', 'Identity Verification Failed',
          `${result.message} (${remainingAttempts} attempts remaining)`);
      }

    } catch (e: any) {
      logger.error('Voting', 'System error during verification', e);
      setVerificationStep('FAILED');
      setFailedAttempts(prev => prev + 1);
      setLastFailedTime(Date.now());
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

  if (user?.verificationStatus !== 'VERIFIED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center max-w-md">
          <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Account Locked</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2 mb-6">
            Your verification status is <strong>{user.verificationStatus}</strong>.
            {user.verificationStatus === 'PENDING'
              ? ' You recently updated your profile/biometrics. Please wait for Admin approval.'
              : ' You are not authorized to vote.'}
          </p>
          <button onClick={() => navigate('/User')} className="bg-gray-800 text-white px-6 py-2 rounded-lg">Return to Dashboard</button>
        </div>
      </div>
    );
  }

  if (!election) return <div className="p-10 text-center">Election not found.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 relative">
      {/* Verification Camera Modal */}
      {showLivenessCamera && (
        <VerificationCamera
          onCapture={handleVerificationComplete}
          onCancel={() => {
            logger.warning('Voting', 'Verification cancelled by user.');
            setShowLivenessCamera(false);
          }}
        />
      )}

      {/* Live Logs Overlay */}
      <LogConsole />

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
              {verificationStep === 'LOADING_EMBEDDING' && (
                <div className="py-12 flex flex-col items-center">
                  <Loader2 className="animate-spin rounded-full h-16 w-16 text-primary-600 mb-4" />
                  <h4 className="text-xl font-bold text-gray-800">Loading Your Data...</h4>
                  <p className="text-gray-500">Retrieving your face embedding from database</p>
                </div>
              )}

              {verificationStep === 'VERIFYING' && (
                <div className="py-12 flex flex-col items-center">
                  <Loader2 className="animate-spin rounded-full h-16 w-16 text-primary-600 mb-4" />
                  <h4 className="text-xl font-bold text-gray-800">Verifying with DeepFace...</h4>
                  <p className="text-gray-500">Comparing captured frames with stored embedding</p>
                </div>
              )}

              {verificationStep === 'SUCCESS' && (
                <div className="py-8 flex flex-col items-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-green-700 mb-1">Identity Verified!</h4>
                  {verificationScore !== null && (
                    <div className="mb-3 text-center">
                      <div className="text-5xl font-bold text-green-600">{verificationScore}%</div>
                      <div className="text-sm text-gray-500 font-medium">Match Score</div>
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
                  {verificationScore !== null && (
                    <div className="mb-3 text-center">
                      <div className="text-5xl font-bold text-red-500">{verificationScore}%</div>
                      <div className="text-sm text-gray-500 font-medium">Match Score (Min: 60% required)</div>
                    </div>
                  )}
                  <p className="text-gray-500 text-center mb-4">Your identity could not be verified.</p>
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-center mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <RefreshCw className="inline w-4 h-4 mr-1" />
                      {failedAttempts >= MAX_FAILED_ATTEMPTS
                        ? 'Maximum attempts reached. Please contact support.'
                        : `${MAX_FAILED_ATTEMPTS - failedAttempts} attempts remaining`
                      }
                    </p>
                  </div>
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
                        if (failedAttempts < MAX_FAILED_ATTEMPTS) {
                          setTimeout(() => setShowLivenessCamera(true), 100);
                        }
                      }}
                      disabled={failedAttempts >= MAX_FAILED_ATTEMPTS}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {failedAttempts >= MAX_FAILED_ATTEMPTS ? 'No Retries Left' : 'Retry'}
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
              />
              <div className="ml-4 flex-1">
                <h4 className="text-lg font-bold text-gray-900 capitalize">{candidate.name}</h4>
                <p className="text-sm text-primary-600 font-semibold capitalize">{candidate.party}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{candidate.manifesto}</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedCandidate === candidate.id ? 'border-primary-600 bg-primary-600' : 'border-gray-300'}`}>
                {selectedCandidate === candidate.id && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
              </div>
            </label>
          ))}
        </div>
        <div className="mt-8 pt-6 border-t">
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
              <Camera size={16} className="flex-shrink-0" />
              <span>You'll need to verify your identity with a live face scan before casting your vote. Keep your ID ready and ensure you're in a well-lit area.</span>
            </p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={initiateVote}
              disabled={!selectedCandidate || isSubmitting || violationCount > 3}
              className={`px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all flex items-center gap-2 ${!selectedCandidate || isSubmitting || violationCount > 3
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 transform hover:-translate-y-0.5'
                }`}
            >
              {isSubmitting ? 'Processing...' : <><Camera size={18} /> Start Face Verification</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
