
import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, CheckCircle, AlertCircle, Loader2, Eye, UserCheck } from 'lucide-react';
import { logger } from '../services/loggerService';
import { tensorFaceService, FaceDetectionResult, LivenessState } from '../services/tensorFaceService';

type LivenessStep = 'INIT' | 'TASK' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

interface LivenessTask {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
}

interface LivenessCameraProps {
    onCapture: (frames: string[]) => void;
    onCancel: () => void;
    mode?: 'register' | 'verify';
}

export const LivenessCamera: React.FC<LivenessCameraProps> = ({ onCapture, onCancel, mode = 'register' }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [step, setStep] = useState<LivenessStep>('INIT');
    const [tasks, setTasks] = useState<LivenessTask[]>([]);
    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
    const [instruction, setInstruction] = useState('Initializing camera...');
    const [progress, setProgress] = useState(0);
    const [faceResult, setFaceResult] = useState<FaceDetectionResult | null>(null);
    const [liveness, setLiveness] = useState<LivenessState | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const detectionInterval = useRef<number | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                await tensorFaceService.loadModels();
                await startCamera();
            } catch (err) {
                console.error('Failed to initialize liveness camera:', err);
                setStep('ERROR');
                setInstruction('Failed to load face verification models.');
            }
        };
        init();
        return () => {
            stopCamera();
            if (detectionInterval.current) clearInterval(detectionInterval.current);
        };
    }, []);

    const startCamera = async () => {
        logger.info('LivenessCamera', 'Requesting camera access...');
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
                logger.success('LivenessCamera', 'Camera stream active.');

                const allTasks: LivenessTask[] = [
                    { id: 'STRAIGHT', label: 'Look Straight', description: 'Look directly at the camera', icon: <Eye size={24} /> },
                    { id: 'LEFT', label: 'Turn Left', description: 'Turn your head slowly to the left', icon: <Camera size={24} /> },
                    { id: 'RIGHT', label: 'Turn Right', description: 'Turn your head slowly to the right', icon: <Camera size={24} /> },
                    { id: 'BLINK', label: 'Blink Twice', description: 'Blink your eyes naturally', icon: <Eye size={24} /> }
                ];

                const shuffled = [allTasks[0], ...allTasks.slice(1).sort(() => Math.random() - 0.5)];
                setTasks(shuffled);

                setTimeout(() => {
                    setStep('TASK');
                    setInstruction(shuffled[0].description);
                    setProgress(20);
                    startDetectionLoop();
                }, 1000);
            }
        } catch (error: any) {
            console.error('Camera access error:', error);
            setStep('ERROR');
            setInstruction('Camera access failed. Please check permissions.');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const startDetectionLoop = () => {
        // DISABLED: Auto-progression removed for manual-only mode
        // Users now click "Capture & Continue" button manually for each step
        /*
        if (detectionInterval.current) clearInterval(detectionInterval.current);
        detectionInterval.current = window.setInterval(async () => {
            if (videoRef.current && step === 'TASK') {
                const result = await tensorFaceService.detectFace(videoRef.current);
                setFaceResult(result);

                if (result.landmarks) {
                    const livenessState = tensorFaceService.checkLiveness(result.landmarks);
                    setLiveness(livenessState);
                    validateLivenessTask(livenessState, result);
                }
            }
        }, 200);
        */
    };

    const validateLivenessTask = (liveness: LivenessState, result: FaceDetectionResult) => {
        if (!tasks[currentTaskIndex]) return;

        const currentTask = tasks[currentTaskIndex];
        let taskCompleted = false;

        switch (currentTask.id) {
            case 'STRAIGHT':
                if (result.quality.isCentered && Math.abs(liveness.headPose.yaw) < 0.1) {
                    taskCompleted = true;
                }
                break;
            case 'LEFT':
                if (liveness.headPose.yaw < -0.2) taskCompleted = true;
                break;
            case 'RIGHT':
                if (liveness.headPose.yaw > 0.2) taskCompleted = true;
                break;
            case 'BLINK':
                if (liveness.isBlinking) taskCompleted = true;
                break;
        }

        if (taskCompleted) {
            handleNext();
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

    const handleNext = async () => {
        const frame = captureFrame();
        if (!frame) return;

        const newFrames = [...capturedFrames, frame];
        setCapturedFrames(newFrames);

        if (currentTaskIndex < tasks.length - 1) {
            const nextIndex = currentTaskIndex + 1;
            setCurrentTaskIndex(nextIndex);
            setInstruction(tasks[nextIndex].description);
            setProgress(Math.round(((nextIndex + 1) / tasks.length) * 100));
        } else {
            if (detectionInterval.current) clearInterval(detectionInterval.current);
            setStep('PROCESSING');
            setInstruction('Verifying identity...');
            setProgress(100);
            stopCamera();
            setTimeout(() => {
                onCapture(newFrames);
            }, 500);
        }
    };

    const handleCancel = () => {
        stopCamera();
        onCancel();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl">
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

                <div className="bg-gray-200 dark:bg-gray-700 h-2">
                    <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

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
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden mb-4">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover transform scale-x-[-1]"
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className={`relative w-64 h-80 border-2 rounded-3xl transition-colors duration-300 ${faceResult?.quality.isCentered ? 'border-primary-500/50' : 'border-red-500/30'}`}>
                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center w-full">
                                            {faceResult?.detection ? (
                                                <div className="animate-pulse">
                                                    <UserCheck className="w-12 h-12 mx-auto mb-2 text-primary-400" />
                                                    <p className="text-sm font-bold text-primary-300">{faceResult.quality.feedback}</p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm opacity-75">Position your face here</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl border-2 border-primary-200 dark:border-primary-800">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-800 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-primary-700 dark:text-primary-300 font-bold text-lg">
                                            {currentTaskIndex + 1}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-lg font-bold text-gray-900 dark:text-white mb-0.5">{tasks[currentTaskIndex]?.label}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium italic">
                                            {instruction}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={handleCancel}
                                    className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-bold shadow-lg hover:from-primary-700 hover:to-primary-800 transition flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={20} />
                                    {currentTaskIndex === tasks.length - 1 ? 'Complete Verification' : 'Capture & Continue'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
