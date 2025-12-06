
import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, CheckCircle, AlertCircle, Loader2, Eye } from 'lucide-react';

type LivenessStep = 'INIT' | 'STRAIGHT' | 'LEFT' | 'RIGHT' | 'BLINK' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

interface LivenessCameraProps {
    onCapture: (frames: string[]) => void;
    onCancel: () => void;
    mode?: 'register' | 'verify';
}

export const LivenessCamera: React.FC<LivenessCameraProps> = ({ onCapture, onCancel, mode = 'register' }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [step, setStep] = useState<LivenessStep>('INIT');
    const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
    const [instruction, setInstruction] = useState('Initializing camera...');
    const [progress, setProgress] = useState(0);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setTimeout(() => {
                    setStep('STRAIGHT');
                    setInstruction('Look straight at the camera');
                    setProgress(20);
                }, 1000);
            }
        } catch (error) {
            console.error('Camera access error:', error);
            setStep('ERROR');
            setInstruction('Camera access denied. Please allow camera access.');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
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
                return canvas.toDataURL('image/jpeg', 0.8).split(',')[1]; // Return base64 without prefix
            }
        }
        return null;
    };

    const handleNext = () => {
        const frame = captureFrame();
        if (!frame) return;

        const newFrames = [...capturedFrames, frame];
        setCapturedFrames(newFrames);

        switch (step) {
            case 'STRAIGHT':
                setStep('LEFT');
                setInstruction('Turn your head slowly to the LEFT');
                setProgress(40);
                break;
            case 'LEFT':
                setStep('RIGHT');
                setInstruction('Turn your head slowly to the RIGHT');
                setProgress(60);
                break;
            case 'RIGHT':
                setStep('BLINK');
                setInstruction('Blink your eyes twice');
                setProgress(80);
                break;
            case 'BLINK':
                setStep('PROCESSING');
                setInstruction('Processing face data...');
                setProgress(100);
                stopCamera();
                // Capture final frames
                setTimeout(() => {
                    onCapture([...newFrames, frame]);
                }, 500);
                break;
        }
    };

    const handleCancel = () => {
        stopCamera();
        onCancel();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white relative">
                    <button
                        onClick={handleCancel}
                        disabled={step === 'PROCESSING'}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <Camera className="w-8 h-8" />
                        <div>
                            <h3 className="text-xl font-bold">Face Liveness Verification</h3>
                            <p className="text-sm text-primary-100">
                                {mode === 'register' ? 'Secure your identity' : 'Verify your identity'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="bg-gray-200 dark:bg-gray-700 h-2">
                    <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Video/Content Area */}
                <div className="p-6">
                    {step === 'ERROR' ? (
                        <div className="text-center py-12">
                            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                            <p className="text-red-600 dark:text-red-400 font-medium">{instruction}</p>
                            <button
                                onClick={handleCancel}
                                className="mt-4 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                            >
                                Close
                            </button>
                        </div>
                    ) : step === 'PROCESSING' ? (
                        <div className="text-center py-12">
                            <Loader2 className="w-16 h-16 text-primary-600 mx-auto mb-4 animate-spin" />
                            <p className="text-gray-700 dark:text-gray-300 font-medium">{instruction}</p>
                            <p className="text-sm text-gray-500 mt-2">Please wait while we verify your face...</p>
                        </div>
                    ) : (
                        <>
                            {/* Camera View */}
                            <div className="relative">
                                {/* Face Guide Overlay */}
                                <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden mb-4">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover transform scale-x-[-1]"
                                    />

                                    {/* Face Boundary Guide */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="relative w-64 h-80">
                                            {/* Corner guides */}
                                            <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-primary-400" />
                                            <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-primary-400" />
                                            <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-primary-400" />
                                            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-primary-400" />

                                            {/* Center text */}
                                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center">
                                                <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm opacity-75">Position your face here</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Instruction Panel */}
                                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl border-2 border-primary-200 dark:border-primary-800">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-800 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-primary-700 dark:text-primary-300 font-bold">
                                                {step === 'STRAIGHT' ? '1' : step === 'LEFT' ? '2' : step === 'RIGHT' ? '3' : '4'}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">{instruction}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {step === 'STRAIGHT' && 'Keep your face within the frame and look directly at the camera.'}
                                                {step === 'LEFT' && 'Slowly turn your head to show your left profile.'}
                                                {step === 'RIGHT' && 'Slowly turn your head to show your right profile.'}
                                                {step === 'BLINK' && 'Blink your eyes naturally twice to confirm you are a real person.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Capture Button */}
                                <div className="mt-6 flex gap-3">
                                    <button
                                        onClick={handleCancel}
                                        className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleNext}
                                        disabled={step === 'INIT'}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-bold shadow-lg hover:from-primary-700 hover:to-primary-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={20} />
                                        {step === 'BLINK' ? 'Complete Verification' : 'Capture & Continue'}
                                    </button>
                                </div>

                                {/* Progress Indicator */}
                                <div className="mt-4 flex justify-center gap-2">
                                    {['STRAIGHT', 'LEFT', 'RIGHT', 'BLINK'].map((s, idx) => (
                                        <div
                                            key={s}
                                            className={`w-3 h-3 rounded-full transition-all ${capturedFrames.length > idx
                                                    ? 'bg-green-500 scale-110'
                                                    : step === s
                                                        ? 'bg-primary-500 scale-125 ring-4 ring-primary-200'
                                                        : 'bg-gray-300 dark:bg-gray-600'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
