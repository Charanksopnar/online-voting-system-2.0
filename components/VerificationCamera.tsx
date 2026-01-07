import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, ShieldCheck, Eye, UserCheck } from 'lucide-react';

interface VerificationCameraProps {
    onCapture: (frames: string[]) => void;
    onCancel: () => void;
}

type CaptureStep = 0 | 1 | 2 | 3;

const INSTRUCTIONS = [
    { text: 'Look straight at the camera', emoji: '👀', duration: 2000 },
    { text: 'Turn your head slightly LEFT', emoji: '👈', duration: 2000 },
    { text: 'Turn your head slightly RIGHT', emoji: '👉', duration: 2000 },
    { text: 'Blink your eyes twice', emoji: '😌', duration: 2000 },
];

export const VerificationCamera: React.FC<VerificationCameraProps> = ({ onCapture, onCancel }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [currentStep, setCurrentStep] = useState<CaptureStep>(0);
    const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const streamRef = useRef<MediaStream | null>(null);
    const captureTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
            if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current);
        };
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsReady(true);
            }
        } catch (error) {
            alert('Camera access denied or unavailable.');
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
                return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
            }
        }
        return null;
    };

    const startCapture = () => {
        setIsCapturing(true);
        setCurrentStep(0);
        setCapturedFrames([]);
        captureNextFrame(0);
    };

    const captureNextFrame = (step: CaptureStep) => {
        captureTimeoutRef.current = window.setTimeout(() => {
            const frame = captureFrame();
            if (frame) {
                const newFrames = [...capturedFrames, frame];
                setCapturedFrames(newFrames);

                if (step < 3) {
                    setCurrentStep((step + 1) as CaptureStep);
                    captureNextFrame((step + 1) as CaptureStep);
                } else {
                    // All frames captured
                    stopCamera();
                    onCapture(newFrames);
                }
            }
        }, INSTRUCTIONS[step].duration);
    };

    const progress = ((currentStep + (isCapturing ? 1 : 0)) / 4) * 100;

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl border border-white/10">
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <ShieldCheck size={24} />
                        <div>
                            <h3 className="text-lg font-bold">Face Liveness Verification</h3>
                            <p className="text-xs text-primary-100">Verify your identity</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {isCapturing && (
                        <div className="mb-4">
                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary-500 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1 text-center">
                                Step {currentStep + 1} of 4
                            </p>
                        </div>
                    )}

                    <div className="relative aspect-video bg-black rounded-xl overflow-hidden mb-6">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover transform scale-x-[-1]"
                        />

                        {/* Face guide overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-48 h-48 md:w-56 md:h-56 rounded-full border-2 border-primary-500/50 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center w-full">
                                    {isReady ? (
                                        <UserCheck className="w-10 h-10 mx-auto opacity-50" />
                                    ) : (
                                        <Eye className="w-10 h-10 mx-auto opacity-50 animate-pulse" />
                                    )}
                                    <p className="text-xs mt-2 opacity-75">Position your face here</p>
                                </div>
                            </div>
                        </div>

                        {/* Instruction overlay during capture */}
                        {isCapturing && (
                            <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm rounded-xl p-4 text-center">
                                <div className="text-4xl mb-2">{INSTRUCTIONS[currentStep].emoji}</div>
                                <p className="text-white text-lg font-medium">
                                    {INSTRUCTIONS[currentStep].text}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl text-center mb-6">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {isCapturing
                                ? 'Follow the instructions on screen'
                                : isReady
                                    ? 'Position your face and click Start Verification'
                                    : 'Initializing camera...'}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={startCapture}
                            disabled={!isReady || isCapturing}
                            className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 transition flex items-center justify-center gap-2"
                        >
                            <Camera size={18} />
                            {isCapturing ? 'Capturing...' : 'Start Verification'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
