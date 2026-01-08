import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LivenessCamera } from '../../components/LivenessCamera';
import { Fingerprint, CheckCircle, AlertCircle, Loader2, Shield } from 'lucide-react';
import { registerFace } from '../../services/faceService';
import { supabaseVoter } from '../../supabase';

export const BiometricVerification = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [showCamera, setShowCamera] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [processingStep, setProcessingStep] = useState('');

    const handleStartVerification = () => {
        setShowCamera(true);
        setVerificationStatus('idle');
        setErrorMessage('');
        setProcessingStep('');
    };

    const handleCaptureComplete = async (frames: string[]) => {
        setShowCamera(false);
        setIsProcessing(true);
        setVerificationStatus('processing');

        try {
            if (!user?.id) {
                throw new Error('User not found');
            }

            // Step 1: Extract Biometrics
            setProcessingStep('Extracting biometric features...');
            const result = await registerFace(user.id, frames);

            if (!result.success) {
                throw new Error(result.message || 'Failed to process biometric data');
            }

            // Step 2: Update profile locally (offline-friendly)
            // We skip immediate Supabase Storage upload here to avoid blocking on slow networks.
            setProcessingStep('Finalizing your digital ID...');
            const { error: updateError } = await supabaseVoter
                .from('profiles')
                .update({
                    face_embeddings: result.embeddings,
                    liveness_verified: result.liveness_verified
                })
                .eq('id', user.id);

            if (updateError) {
                throw new Error(updateError.message || 'Failed to update profile');
            }

            setProcessingStep('All done!');
            setVerificationStatus('success');

            // Redirect to dashboard after a short delay
            setTimeout(() => {
                navigate('/User');
            }, 2000);
        } catch (error: any) {
            console.error('Biometric verification error:', error);
            setVerificationStatus('error');
            setErrorMessage(error.message || 'Verification failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancel = () => {
        setShowCamera(false);
        setVerificationStatus('idle');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 px-4 transition-colors duration-200">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                        <Fingerprint className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Biometric Verification
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Complete your identity verification to access voting
                    </p>
                </div>

                {/* Main Content */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                    {verificationStatus === 'idle' && !showCamera && (
                        <div className="p-8">
                            <div className="space-y-6">
                                {/* Instructions */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                                    <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                                        <Shield size={20} />
                                        What You'll Need
                                    </h3>
                                    <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                                            <span>A well-lit environment for clear face capture</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                                            <span>Camera access enabled on your device</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                                            <span>Remove glasses or face coverings if possible</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                                            <span>Follow on-screen instructions during capture</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* Process Steps */}
                                <div className="space-y-3">
                                    <h3 className="font-bold text-gray-900 dark:text-white">Verification Process:</h3>
                                    <div className="grid gap-3">
                                        {[
                                            { step: 1, title: 'Face Capture', desc: 'Look straight at the camera' },
                                            { step: 2, title: 'Left Profile', desc: 'Turn your head to the left' },
                                            { step: 3, title: 'Right Profile', desc: 'Turn your head to the right' },
                                            { step: 4, title: 'Liveness Check', desc: 'Blink your eyes twice' }
                                        ].map(({ step, title, desc }) => (
                                            <div key={step} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                    {step}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">{title}</div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">{desc}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => navigate('/User')}
                                        className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleStartVerification}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-bold shadow-lg hover:from-primary-700 hover:to-primary-800 transition flex items-center justify-center gap-2"
                                    >
                                        <Fingerprint size={20} />
                                        Start Face Verification
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {verificationStatus === 'processing' && (
                        <div className="p-12 text-center">
                            <Loader2 className="w-16 h-16 text-primary-600 mx-auto mb-4 animate-spin" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {processingStep || 'Processing Your Biometric Data'}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Please wait while we verify your identity...
                            </p>
                        </div>
                    )}

                    {verificationStatus === 'success' && (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Verification Successful!
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Your biometric data has been securely stored.
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                                Redirecting to dashboard...
                            </p>
                        </div>
                    )}

                    {verificationStatus === 'error' && (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                                <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Verification Failed
                            </h3>
                            <p className="text-red-600 dark:text-red-400 mb-6">
                                {errorMessage}
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => navigate('/User')}
                                    className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                >
                                    Go Back
                                </button>
                                <button
                                    onClick={handleStartVerification}
                                    className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-bold shadow-lg hover:from-primary-700 hover:to-primary-800 transition"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Security Notice */}
                <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                        <Shield className="inline w-3 h-3 mr-1" />
                        Your biometric data is encrypted and stored securely. It will only be used for voter verification purposes.
                    </p>
                </div>
            </div>

            {/* Liveness Camera Modal */}
            {showCamera && (
                <LivenessCamera
                    onCapture={handleCaptureComplete}
                    onCancel={handleCancel}
                    mode="verify"
                />
            )}
        </div>
    );
};
