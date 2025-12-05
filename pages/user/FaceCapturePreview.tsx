import React, { useRef, useState } from 'react';
import { Camera, Check, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FaceCapturePreview = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [captured, setCaptured] = useState<string | null>(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (e) {
            console.error(e);
        }
    };

    const capture = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(videoRef.current, 0, 0);
            setCaptured(canvas.toDataURL('image/jpeg'));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            <h1 className="text-2xl font-bold mb-6">Biometric Capture Preview</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg border max-w-md w-full">
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
                    {captured ? (
                        <img src={captured} alt="Captured" className="w-full h-full object-cover" />
                    ) : (
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    )}
                </div>

                <div className="flex gap-4 justify-center">
                    {!captured ? (
                        <>
                            <button onClick={startCamera} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Start Camera</button>
                            <button onClick={capture} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"><Camera size={18}/> Capture</button>
                        </>
                    ) : (
                        <button onClick={() => setCaptured(null)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center gap-2"><RefreshCw size={18}/> Retake</button>
                    )}
                </div>
            </div>
            <Link to="/" className="mt-8 text-primary-600 hover:underline">Back to Home</Link>
        </div>
    );
};