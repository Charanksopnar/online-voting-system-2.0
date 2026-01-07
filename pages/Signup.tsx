import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { extractIdData } from '../services/geminiService';
import { LoadingOverlay } from '../components/UI/LoadingOverlay';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, Camera, Check, RefreshCw, User, MapPin, ShieldCheck, FileText, CreditCard, X } from 'lucide-react';
import { supabase } from '../supabase';
import { INDIAN_STATES_DISTRICTS } from '../data/indianStatesDistricts';
import { getEmbeddingForBase64Image, verifyIdentityAgainstDoc } from '../services/faceService';
import { optimizeImage } from '../utils/imageOptimizer';

function Input({ label, fullWidth = false, className = '', ...props }: any) {
    return (
        <div className={fullWidth ? "md:col-span-2 space-y-2" : "space-y-2"}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
            <input className={`input-standard ${className}`} {...props} />
        </div>
    );
}

export const Signup = () => {
    const { signUp } = useAuth();
    const { addNotification } = useNotification();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    // Safety timeout ref
    const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('Creating Secure Profile...');

    const [showAadhaarPopup, setShowAadhaarPopup] = useState(true);
    const aadhaarInputRef = useRef<HTMLInputElement>(null);

    // Files
    const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
    const [epicFile, setEpicFile] = useState<File | null>(null);

    // Face Capture State
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [faceImageBlob, setFaceImageBlob] = useState<Blob | null>(null);
    const [facePreview, setFacePreview] = useState<string | null>(null);
    const [faceBase64, setFaceBase64] = useState<string | null>(null); // For DeepFace embeddings

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        fatherName: '',
        email: '',
        phone: '',
        dob: '',
        state: '',
        district: '',
        city: '',
        password: '',
        confirmPassword: '',
        aadhaarNumber: '',
        epicNumber: ''
    });

    const districtsForState = useMemo(() => {
        return formData.state ? INDIAN_STATES_DISTRICTS[formData.state] || [] : [];
    }, [formData.state]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        let value = e.target.value;

        // Auto-capitalize proper names and city/state for better data quality
        if (['firstName', 'lastName', 'city'].includes(e.target.name)) {
            value = value.replace(/\b\w/g, char => char.toUpperCase());
        }

        if (e.target.name === 'email') {
            value = value.toLowerCase();
        }

        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData({
            ...formData,
            state: e.target.value,
            district: '' // Reset district when state changes
        });
    };

    const handleAadhaarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAadhaarFile(file);
            setLoadingMessage('Extracting Aadhaar Details...');
            setLoading(true);

            // Scroll to the file input to show where it landed
            setTimeout(() => {
                aadhaarInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);

            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                // Call OCR with AADHAAR type
                const extracted = await extractIdData(base64.split(',')[1], 'AADHAAR');
                if (extracted) {
                    addNotification('SUCCESS', 'Aadhaar Scanned', 'Details extracted successfully.');

                    const updates: any = {};
                    if (extracted.name) {
                        const names = extracted.name.split(' ');
                        updates.firstName = names[0];
                        updates.lastName = names.slice(1).join(' ');
                    }
                    if (extracted.idNumber) updates.aadhaarNumber = extracted.idNumber;
                    if (extracted.dob) updates.dob = extracted.dob;
                    if (extracted.state) updates.state = extracted.state;
                    if (extracted.district) updates.district = extracted.district;
                    if (extracted.city) updates.city = extracted.city;
                    if (extracted.email) updates.email = extracted.email.toLowerCase();
                    if (extracted.phone) updates.phone = extracted.phone.replace(/\D/g, '').slice(-10);

                    setFormData(prev => ({ ...prev, ...updates }));
                }
                setLoading(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEpicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEpicFile(file);
            setLoadingMessage('Scanning Voter ID...');
            setLoading(true);
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                // Call OCR with EPIC type
                const extracted = await extractIdData(base64.split(',')[1], 'EPIC');
                if (extracted) {
                    addNotification('SUCCESS', 'Voter ID Scanned', 'EPIC Number extracted.');
                    if (extracted.idNumber) {
                        setFormData(prev => ({ ...prev, epicNumber: extracted.idNumber }));
                    }
                }
                setLoading(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const startCamera = async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera error", err);
            addNotification('ERROR', 'Camera Error', 'Could not access camera for face registration.');
            setIsCameraOpen(false);
        }
    };


    const captureFace = async () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);

                // Store base64 for DeepFace embedding extraction
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                const base64 = dataUrl.split(',')[1];

                // SECURITY: Validate face count before accepting capture
                try {
                    setLoadingMessage('Validating face...');
                    setLoading(true);

                    const { detectAndCountFaces } = await import('../services/faceService');
                    const faceCheck = await detectAndCountFaces(base64);

                    if (faceCheck.faceCount !== 1) {
                        addNotification('ERROR', 'Face Detection Failed', faceCheck.message);
                        setLoading(false);
                        return; // Don't capture if validation fails
                    }

                    setLoading(false);
                    addNotification('SUCCESS', 'Face Validated', 'Single face detected successfully.');
                } catch (err: any) {
                    setLoading(false);
                    addNotification('ERROR', 'Validation Error', err.message || 'Could not validate face.');
                    return;
                }

                setFaceBase64(base64);

                canvas.toBlob((blob) => {
                    if (blob) {
                        setFaceImageBlob(blob);
                        setFacePreview(URL.createObjectURL(blob));
                        const stream = videoRef.current?.srcObject as MediaStream;
                        stream?.getTracks().forEach(track => track.stop());
                        setIsCameraOpen(false);
                    }
                }, 'image/jpeg');
            }
        }
    };


    const resetCamera = () => {
        setFaceImageBlob(null);
        setFacePreview(null);
        setFaceBase64(null);
        startCamera();
    };

    const uploadToStorage = async (file: File | Blob, bucket: string, path: string) => {
        const { data, error } = await supabase.storage.from(bucket).upload(path, file);
        if (error) {
            console.warn(`Upload to ${bucket} failed:`, error.message);
            // Fallback to avoid breaking flow, though image won't be viewable
            return `https://ui-avatars.com/api/?name=Error&background=random`;
        }
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
        return publicUrl;
    };

    const sanitizeFilename = (name: string) => {
        return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Basic Field Validation
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            addNotification('ERROR', 'Required Field', 'Full Name is mandatory.');
            return;
        }
        if (!formData.email.trim()) {
            addNotification('ERROR', 'Required Field', 'Email Address is mandatory.');
            return;
        }
        if (!formData.phone.trim()) {
            addNotification('ERROR', 'Required Field', 'Phone Number is mandatory.');
            return;
        }
        if (!formData.dob) {
            addNotification('ERROR', 'Required Field', 'Date of Birth is mandatory.');
            return;
        }
        if (!formData.password) {
            addNotification('ERROR', 'Required Field', 'Password is mandatory.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            addNotification('ERROR', 'Validation Error', 'Passwords do not match');
            return;
        }

        const age = new Date().getFullYear() - new Date(formData.dob).getFullYear();
        if (age < 18) {
            addNotification('ERROR', 'Eligibility Error', 'You must be at least 18 years old to register.');
            return;
        }

        if (!aadhaarFile && !epicFile) {
            addNotification('ERROR', 'Identity Missing', 'You must upload either Aadhaar Card OR Voter ID (or both) to register.');
            return;
        }
        if (!faceImageBlob) {
            addNotification('ERROR', 'Biometric Missing', 'Biometric Face Capture is mandatory for secure voting.');
            return;
        }
        if (!faceBase64) {
            addNotification('ERROR', 'Biometric Error', 'Face image data is missing. Please recapture your face.');
            return;
        }

        try {
            setLoadingMessage('Validating Identity Documents...');
            setLoading(true);

            // 2. Check for Duplicate Aadhaar Number
            if (formData.aadhaarNumber && formData.aadhaarNumber.trim()) {
                const { data: existingAadhaar, error: aadhaarError } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name')
                    .eq('aadhaar_number', formData.aadhaarNumber.trim())
                    .limit(1);

                if (aadhaarError) {
                    console.error('Error checking Aadhaar:', aadhaarError);
                } else if (existingAadhaar && existingAadhaar.length > 0) {
                    setLoading(false);
                    addNotification('ERROR', 'Duplicate Aadhaar Number',
                        `This Aadhaar number is already registered. Each Aadhaar can only be used once.`);
                    return;
                }
            }

            // 3. Check for Duplicate EPIC Number
            if (formData.epicNumber && formData.epicNumber.trim()) {
                const { data: existingEpic, error: epicError } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name')
                    .eq('epic_number', formData.epicNumber.trim())
                    .limit(1);

                if (epicError) {
                    console.error('Error checking EPIC:', epicError);
                } else if (existingEpic && existingEpic.length > 0) {
                    setLoading(false);
                    addNotification('ERROR', 'Duplicate Voter ID',
                        `This Voter ID (EPIC) number is already registered. Each Voter ID can only be used once.`);
                    return;
                }
            }

            setLoadingMessage('Creating Secure Profile...');
            setLoading(true);

            // Global safety timeout: If nothing happens in 60 seconds, kill it
            loadingTimeoutRef.current = setTimeout(() => {
                setLoading(false);
                addNotification('ERROR', 'Timeout', 'The request took too long. Please check your network or try again.');
            }, 60000);

            console.time('RegistrationTotal');

            const tempId = Date.now().toString();

            // 1. Optimize Images First (this is the main speed improvement)
            console.time('ImageOptimization');

            let optimizedFace: { blob: Blob, base64: string } | null = null;
            let optimizedAadhaar: { blob: Blob, base64: string } | null = null;
            let optimizedEpic: { blob: Blob, base64: string } | null = null;

            if (faceImageBlob) {
                optimizedFace = await optimizeImage(faceImageBlob, 1024, 0.8);
            }

            if (aadhaarFile) {
                if (aadhaarFile.type === 'application/pdf') {
                    const b64 = await fileToBase64(aadhaarFile);
                    optimizedAadhaar = { blob: aadhaarFile, base64: b64.split(',')[1] };
                } else {
                    optimizedAadhaar = await optimizeImage(aadhaarFile, 1024, 0.8);
                }
            }

            if (epicFile) {
                if (epicFile.type === 'application/pdf') {
                    const b64 = await fileToBase64(epicFile);
                    optimizedEpic = { blob: epicFile, base64: b64.split(',')[1] };
                } else {
                    optimizedEpic = await optimizeImage(epicFile, 1024, 0.8);
                }
            }

            console.timeEnd('ImageOptimization');

            if (!optimizedFace) throw new Error('Face image processing failed.');

            // 2. Upload Files (using optimized versions)
            console.time('Uploads');

            const facePath = `${tempId}_face.jpg`;
            const faceUrl = await uploadToStorage(optimizedFace.blob, 'faces', facePath);

            let kycUrl = '';
            if (optimizedAadhaar && aadhaarFile) {
                const ext = aadhaarFile.type === 'application/pdf' ? 'pdf' : 'jpg';
                const name = sanitizeFilename(aadhaarFile.name.split('.')[0]);
                kycUrl = await uploadToStorage(optimizedAadhaar.blob, 'uploads', `${tempId}_aadhaar_${name}.${ext}`);
            }

            let epicUrl = '';
            if (optimizedEpic && epicFile) {
                const ext = epicFile.type === 'application/pdf' ? 'pdf' : 'jpg';
                const name = sanitizeFilename(epicFile.name.split('.')[0]);
                epicUrl = await uploadToStorage(optimizedEpic.blob, 'uploads', `${tempId}_epic_${name}.${ext}`);
            }

            console.timeEnd('Uploads');

            // 3. Get Face Embedding
            console.time('FaceEmbedding');
            const faceEmbeddings = await getEmbeddingForBase64Image(optimizedFace.base64);
            console.timeEnd('FaceEmbedding');

            // SECURITY: Strict validation of face embeddings
            if (!faceEmbeddings || faceEmbeddings.length === 0) {
                throw new Error('Face embedding extraction failed. Please retake photo and ensure your face is clearly visible.');
            }

            // Validate embeddings are actually valid numbers
            if (!Array.isArray(faceEmbeddings) || faceEmbeddings.some(val => typeof val !== 'number' || isNaN(val))) {
                throw new Error('Invalid face embedding data generated. Please try again.');
            }

            console.log(`✓ Face embeddings generated successfully: ${faceEmbeddings.length} dimensions`);
            addNotification('SUCCESS', 'Biometric Success', 'Face data processed.');

            // 4. Create User Account
            await signUp(formData.email, formData.firstName, formData.lastName, {
                ...formData,
                email: formData.email,
                age,
                kycDocUrl: kycUrl,
                epicDocUrl: epicUrl,
                faceUrl: faceUrl,
                idNumber: formData.aadhaarNumber,
                idType: 'AADHAAR'
            });


            // 5. Electoral Roll Verification + AI Identity Verification
            let verificationStatus = 'PENDING';
            let electoralRollVerified = false;
            let electoralRollMatchId: string | null = null;
            let manualVerifyRequested = false;
            let verificationMessage = '';

            // 5a. Electoral Roll Cross-Check
            console.time('ElectoralRollVerification');
            setLoadingMessage('Verifying against Electoral Roll...');

            try {
                const { verifyAgainstElectoralRoll } = await import('../services/electoralRollService');
                const electoralResult = await verifyAgainstElectoralRoll({
                    aadhaarNumber: formData.aadhaarNumber,
                    epicNumber: formData.epicNumber,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    fatherName: formData.fatherName,
                    dob: formData.dob,
                    state: formData.state,
                    district: formData.district,
                    city: formData.city
                });

                console.timeEnd('ElectoralRollVerification');
                console.log('Electoral Roll Result:', electoralResult);

                if (electoralResult.found) {
                    // Found in electoral roll
                    electoralRollMatchId = electoralResult.match?.id || null;

                    if (electoralResult.verified) {
                        // Perfect match - auto-verify electoral roll BUT keep biometric unverified
                        electoralRollVerified = true;
                        verificationStatus = 'PENDING'; // Still needs biometric verification
                        manualVerifyRequested = false;
                        verificationMessage = electoralResult.message;
                        addNotification('SUCCESS', 'Electoral Roll Verified', 'Your data matches official voter records.');
                    } else {
                        // Data mismatch - flag for manual review
                        electoralRollVerified = false;
                        verificationStatus = 'PENDING';
                        manualVerifyRequested = true;
                        verificationMessage = electoralResult.message;

                        const mismatchDetails = [];
                        if (!electoralResult.details.nameMatch) mismatchDetails.push('Name');
                        if (!electoralResult.details.dobMatch) mismatchDetails.push('DOB');
                        if (!electoralResult.details.fatherNameMatch) mismatchDetails.push('Father Name');
                        if (!electoralResult.details.addressMatch) mismatchDetails.push('Address');

                        addNotification('WARNING', 'Data Mismatch',
                            `Mismatch detected: ${mismatchDetails.join(', ')}. Manual review required.`);
                    }
                } else {
                    // Not found in electoral roll - ALLOW registration but notify
                    electoralRollVerified = false;
                    verificationStatus = 'PENDING';
                    manualVerifyRequested = false;
                    verificationMessage = electoralResult.message;
                    addNotification('INFO', 'Electoral Roll Not Found',
                        'Your data is not registered in the voter list. You may not generate your voter ID till now.');
                }
            } catch (electoralErr) {
                console.warn('Electoral Roll Check Error (non-fatal):', electoralErr);
                addNotification('WARNING', 'Electoral Roll Check Failed',
                    'Could not verify against electoral roll. Proceeding with registration.');
            }

            // 5b. AI Biometric Verification (Face vs ID Document)
            setLoadingMessage('Verifying biometric data...');
            const docOpt = optimizedAadhaar || optimizedEpic;
            if (docOpt && docOpt.blob.type !== 'application/pdf') {
                try {
                    console.time('AIVerification');
                    const { verified } = await verifyIdentityAgainstDoc(
                        optimizedFace.base64,
                        docOpt.base64,
                        faceEmbeddings
                    );
                    console.timeEnd('AIVerification');

                    if (verified) {
                        // Biometric matches ID document
                        if (electoralRollVerified) {
                            // BOTH electoral roll AND biometric verified - FULLY VERIFIED
                            verificationStatus = 'VERIFIED';
                            addNotification('SUCCESS', 'Full Verification Complete',
                                'Electoral roll and biometric verification successful!');
                        } else {
                            // Biometric verified but electoral roll not verified
                            verificationStatus = 'PENDING';
                            addNotification('SUCCESS', 'Biometric Verified',
                                'Face matches ID document. Electoral roll verification pending.');
                        }
                    } else {
                        // Biometric verification failed - BLOCK registration
                        throw new Error('Biometric verification failed: Face does not match ID document. Please ensure you are using your own ID and photo.');
                    }
                } catch (aiErr: any) {
                    // CRITICAL: Biometric verification is MANDATORY
                    console.error('AI Biometric Verification Error:', aiErr);
                    throw new Error(aiErr.message || 'Biometric verification failed. Please ensure DeepFace service is running and try again.');
                }
            } else {
                // No ID document provided or it's a PDF
                addNotification('WARNING', 'Biometric Verification Skipped',
                    'ID document is PDF or missing. Manual review will be required.');
                manualVerifyRequested = true;
            }

            // 6. Update Profile
            const { data: { user: currentUser } } = await supabase.auth.getUser();

            if (currentUser) {
                await supabase
                    .from('profiles')
                    .update({
                        face_embeddings: faceEmbeddings,
                        liveness_verified: true,
                        verification_status: verificationStatus,
                        electoral_roll_verified: electoralRollVerified,
                        electoral_roll_match_id: electoralRollMatchId,
                        manual_verify_requested: manualVerifyRequested,
                        manual_verify_requested_at: manualVerifyRequested ? new Date().toISOString() : null,
                        verification_rejection_reason: verificationMessage || (manualVerifyRequested ? 'Manual review needed' : null)
                    })
                    .eq('id', currentUser.id);
            }


            addNotification('SUCCESS', 'Registration Complete', 'Your secure voter profile has been created.');
            console.timeEnd('RegistrationTotal');
            navigate('/User');

        } catch (err: any) {
            console.error('Registration Error:', err);
            addNotification('ERROR', 'Registration Failed', err.message || 'Unknown error');
        } finally {
            if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
            setLoading(false);
        }
    };

    useEffect(() => {
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex transition-colors duration-200">
            {loading && <LoadingOverlay message={loadingMessage} />}

            {/* Auto-fill Popup */}
            {showAadhaarPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animation-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative animation-scale-up border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setShowAadhaarPopup(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center space-y-4 pt-2">
                            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
                                <CreditCard className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                Fast-Track Registration
                            </h3>

                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed px-2">
                                Upload your Aadhaar card to automatically fetch details. This helps you fill the form automatically and prevents errors.
                            </p>

                            <div className="pt-4 flex flex-col gap-3">
                                <button
                                    onClick={() => {
                                        aadhaarInputRef.current?.click();
                                        setShowAadhaarPopup(false);
                                    }}
                                    className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20"
                                >
                                    <Upload size={18} />
                                    Upload Aadhaar Now
                                </button>

                                <button
                                    onClick={() => setShowAadhaarPopup(false)}
                                    className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition"
                                >
                                    I'll fill it manually
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Left Info Panel */}
            <div className="hidden xl:flex w-1/3 bg-primary-900 relative overflow-hidden flex-col justify-between p-12 text-white">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&q=80')] bg-cover opacity-10"></div>
                <div className="relative z-10">
                    <Link to="/" className="flex items-center gap-2 mb-12">
                        <ShieldCheck size={32} className="text-primary-300" />
                        <span className="text-2xl font-bold">SecureVote</span>
                    </Link>
                    <h2 className="text-4xl font-bold mb-6">Join the future of democracy.</h2>
                    <p className="text-primary-100 text-lg leading-relaxed">
                        Create your secure voter profile today. Our advanced biometric system ensures that your voice is unique, your vote is counted, and your identity is protected.
                    </p>
                </div>
                <div className="relative z-10 space-y-4 text-sm text-primary-200">
                    <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center font-bold border border-primary-700">1</div> Upload Government ID</div>
                    <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center font-bold border border-primary-700">2</div> Capture Biometric Face</div>
                    <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center font-bold border border-primary-700">3</div> Instant Verification</div>
                </div>
            </div>

            {/* Main Form Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto py-12 px-6 lg:px-12">
                    <div className="flex justify-between items-center mb-10">
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Create Account</h1>
                        <Link to="/Login" className="text-sm font-medium text-primary-600 hover:text-primary-500">Already a member?</Link>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Section 1: Personal Info */}
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6 border-b dark:border-slate-700 pb-4">
                                <User className="text-primary-500" size={20} /> Personal Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required className="capitalize" />
                                <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required className="capitalize" />
                                <Input label="Father Name" name="fatherName" value={formData.fatherName} onChange={handleChange} placeholder="For electoral roll verification" className="capitalize" fullWidth />
                                <Input label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required fullWidth />
                                <Input label="Phone Number" name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
                                <Input label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} required />
                            </div>
                        </div>

                        {/* Section 2: Address & Security */}
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6 border-b dark:border-slate-700 pb-4">
                                <MapPin className="text-primary-500" size={20} /> Address & Security
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">State</label>
                                    <select
                                        name="state"
                                        value={formData.state}
                                        onChange={handleStateChange}
                                        required
                                        className="input-standard appearance-none"
                                    >
                                        <option value="">Select State</option>
                                        {Object.keys(INDIAN_STATES_DISTRICTS).map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">District</label>
                                    <select
                                        name="district"
                                        value={formData.district}
                                        onChange={handleChange}
                                        required
                                        disabled={!formData.state}
                                        className="input-standard appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="">Select District</option>
                                        {districtsForState.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <Input label="City" name="city" value={formData.city} onChange={handleChange} required fullWidth className="capitalize" />
                                <Input label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />
                                <Input label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
                            </div>
                        </div>

                        {/* Section 3: Identity Documents */}
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6 border-b dark:border-slate-700 pb-4">
                                <FileText className="text-primary-500" size={20} /> Identity Documents
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Aadhaar Upload */}
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">1. Aadhaar Card (Front/PDF)</label>
                                    <Input label="Aadhaar Number" name="aadhaarNumber" value={formData.aadhaarNumber} onChange={handleChange} placeholder="XXXX-XXXX-XXXX" />

                                    <label className="block">
                                        <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <CreditCard className="w-8 h-8 text-slate-400 mb-2" />
                                                <p className="text-xs text-slate-500 font-medium">Upload Aadhaar</p>
                                            </div>
                                            <input
                                                ref={aadhaarInputRef}
                                                type="file"
                                                className="hidden"
                                                onChange={handleAadhaarUpload}
                                                accept="image/*,application/pdf"
                                            />
                                        </div>
                                    </label>
                                    {aadhaarFile && <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-lg border border-emerald-100 dark:border-emerald-800"><Check size={12} /> {aadhaarFile.name}</div>}
                                </div>

                                {/* EPIC Upload */}
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">2. Voter ID / EPIC (Optional)</label>
                                    <Input label="EPIC Number" name="epicNumber" value={formData.epicNumber} onChange={handleChange} placeholder="ABC1234567" />

                                    <label className="block">
                                        <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <CreditCard className="w-8 h-8 text-slate-400 mb-2" />
                                                <p className="text-xs text-slate-500 font-medium">Upload Voter ID</p>
                                            </div>
                                            <input type="file" className="hidden" onChange={handleEpicUpload} accept="image/*,application/pdf" />
                                        </div>
                                    </label>
                                    {epicFile && <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-lg border border-emerald-100 dark:border-emerald-800"><Check size={12} /> {epicFile.name}</div>}
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Biometric Capture */}
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                                <Camera className="text-primary-500" size={20} /> Biometric Capture
                            </h3>
                            <div className="flex flex-col lg:flex-row gap-8 items-center">
                                <div className="w-full lg:w-1/3 space-y-3">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold">Live capture tips</p>
                                    <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside">
                                        <li>Center your face inside the circle with both eyes visible.</li>
                                        <li>Sit at arm's length so your shoulders are also in view.</li>
                                        <li>Avoid strong backlight; use a bright, even front light.</li>
                                        <li>Keep a neutral expression and look straight at the camera.</li>
                                    </ul>
                                </div>

                                <div className="flex-1 flex flex-col items-center justify-center min-h-[220px]">
                                    {facePreview ? (
                                        <div className="relative group">
                                            <img
                                                src={facePreview}
                                                alt="Preview"
                                                className="w-32 h-32 rounded-full object-cover border-4 border-primary-500 shadow-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={resetCamera}
                                                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white font-medium text-xs"
                                            >
                                                <RefreshCw size={16} /> Retake
                                            </button>
                                        </div>
                                    ) : isCameraOpen ? (
                                        <div className="w-full max-w-md aspect-video bg-black rounded-xl overflow-hidden relative border border-slate-300 dark:border-slate-600">
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                muted
                                                className="w-full h-full object-cover"
                                            />
                                            {/* Circular face guide */}
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="w-40 h-40 md:w-52 md:h-52 rounded-full border-4 border-primary-500/80 shadow-[0_0_40px_rgba(37,99,235,0.6)]" />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={captureFace}
                                                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-5 py-1.5 rounded-full text-xs font-bold hover:bg-slate-200 shadow-md"
                                            >
                                                Take Photo
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={startCamera}
                                            className="w-full max-w-md h-48 bg-slate-100 dark:bg-slate-700/50 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                                        >
                                            <Camera className="w-10 h-10 text-slate-400 mb-2" />
                                            <span className="text-sm text-slate-500 dark:text-slate-300 font-medium">Start Live Camera</span>
                                            <span className="text-[11px] text-slate-400 mt-1">Align your face inside the circular guide when the camera opens</span>
                                        </div>
                                    )}
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center max-w-md">
                                        This image will be encrypted and used only for identity verification. Make sure your full face fits inside the circular guide.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 px-6 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-primary-500/20 transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                Create Secure Profile
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};