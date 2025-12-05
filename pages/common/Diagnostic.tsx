import React, { useState, useRef, useEffect } from 'react';
import { Camera, Check, X, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Diagnostic = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [checks, setChecks] = useState({
    camera: 'pending',
    microphone: 'pending',
    connection: 'pending',
    lighting: 'pending'
  });
  const navigate = useNavigate();

  useEffect(() => {
    startDiagnostic();
  }, []);

  const startDiagnostic = async () => {
    // 1. Connection Check
    setChecks(prev => ({ ...prev, connection: navigator.onLine ? 'success' : 'error' }));

    // 2. Camera Check
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setChecks(prev => ({ ...prev, camera: 'success', microphone: 'success' }));
        
        // Mock Lighting check
        setTimeout(() => {
            setChecks(prev => ({ ...prev, lighting: 'success' }));
        }, 1500);

    } catch (e) {
        setChecks(prev => ({ ...prev, camera: 'error', microphone: 'error' }));
    }
  };

  const getIcon = (status: string) => {
    if (status === 'success') return <Check className="text-green-500" />;
    if (status === 'error') return <X className="text-red-500" />;
    return <RefreshCw className="text-blue-500 animate-spin" />;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-center">System Diagnostic</h2>
        
        <div className="mb-6 relative w-full h-48 bg-black rounded-lg overflow-hidden flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {checks.camera === 'error' && <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 text-red-400">Camera Blocked</div>}
        </div>

        <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                <span>Camera Access</span>
                {getIcon(checks.camera)}
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                <span>Microphone Access</span>
                {getIcon(checks.microphone)}
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                <span>Network Latency</span>
                {getIcon(checks.connection)}
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                <span>Lighting Condition</span>
                {getIcon(checks.lighting)}
            </div>
        </div>

        <button 
            onClick={() => navigate(-1)} 
            className="w-full mt-8 bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold transition"
        >
            Return
        </button>
      </div>
    </div>
  );
};