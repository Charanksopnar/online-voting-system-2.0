import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Save, ArrowLeft, Camera, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { LoadingOverlay } from '../../components/UI/LoadingOverlay';
import { LivenessCamera } from '../../components/LivenessCamera';
import { getEmbeddingForBase64Image, verifyIdentityAgainstDoc } from '../../services/faceService';
import { supabase } from '../../supabase';

export const EditProfile = () => {
    const { user } = useAuth();
    const { addNotification } = useNotification();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Updating Profile...');
    const [showCamera, setShowCamera] = useState(false);

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState('');

    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        photoUrl: user?.faceUrl || user?.photoUrl || ''
    });

    const [newFaceBlob, setNewFaceBlob] = useState<Blob | null>(null);
    const [newFaceBase64, setNewFaceBase64] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCameraCapture = async (frames: string[]) => {
        setShowCamera(false);
        if (!frames || frames.length === 0) return;

        // Use the middle frame as the best shot
        const middleIndex = Math.floor(frames.length / 2);
        const bestFrame = frames[middleIndex];

        setNewFaceBase64(bestFrame);
        setFormData(prev => ({
            ...prev,
            photoUrl: `data:image/jpeg;base64,${bestFrame}`
        }));

        // Convert base64 to blob for upload
        const byteCharacters = atob(bestFrame);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        setNewFaceBlob(new Blob([byteArray], { type: 'image/jpeg' }));

        addNotification('SUCCESS', 'Face Captured', 'Biometric data ready for update.');
    };

    const handleSaveClick = (e: React.FormEvent) => {
        e.preventDefault();
        // Security Challenge: Require password for sensitive biometric changes
        if (newFaceBase64) {
            setShowPasswordModal(true);
        } else {
            handleSubmit(); // No password needed for non-sensitive changes
        }
    };

    const verifyPassword = async () => {
        try {
            if (!user?.email) throw new Error("User email not found");
            const { error } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: password
            });
            if (error) throw new Error("Incorrect password");
            return true;
        } catch (err) {
            addNotification('ERROR', 'Authentication Failed', 'Incorrect password. Cannot update biometrics.');
            return false;
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setLoadingMessage('Updating Profile...');

        try {
            if (!user?.id) throw new Error("User session invalid.");

            const updates: any = {
                first_name: formData.firstName,
                last_name: formData.lastName,
                phone: formData.phone,
                updated_at: new Date().toISOString()
            };

            // If a new face was captured, process embeddings and upload image
            if (newFaceBase64 && newFaceBlob) {

                // SECURITY: Verify Password First
                const isAuth = await verifyPassword();
                if (!isAuth) {
                    setLoading(false);
                    return;
                }

                setLoadingMessage('Generating Identity Embeddings...');

                // 1. Generate Embeddings
                const embeddings = await getEmbeddingForBase64Image(newFaceBase64);
                if (!embeddings || embeddings.length === 0) {
                    throw new Error("Failed to generate face verification data. Please retake photo.");
                }
                updates.face_embeddings = embeddings;
                updates.liveness_verified = true;

                // 2. Upload Image
                setLoadingMessage('Uploading Secure Photo...');
                const filePath = `${user.id}_face_update_${Date.now()}.jpg`;
                const { error: uploadError } = await supabase.storage
                    .from('faces')
                    .upload(filePath, newFaceBlob, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('faces')
                    .getPublicUrl(filePath);

                updates.face_url = publicUrl;
                updates.photo_url = publicUrl; // Sync both logic

                // SECURITY + AI: Automatic Auto-Approval Check
                let aiVerified = false;
                let aiMessage = '';

                // If user has an ID document (Aadhaar or Voter ID), try to verify
                const docUrl = user.kycDocUrl || user.epicDocUrl;
                if (docUrl) {
                    setLoadingMessage('AI Verification: Checking against ID Document...');
                    const { verified, message } = await verifyIdentityAgainstDoc(newFaceBase64, docUrl);
                    aiVerified = verified;
                    aiMessage = message;
                }

                if (aiVerified) {
                    // AI Approved!
                    updates.verification_status = 'VERIFIED';
                    updates.manual_verify_requested = false;
                    updates.electoral_roll_verified = true;
                    updates.verification_rejection_reason = null; // Clear any old rejections
                    addNotification('SUCCESS', 'AI Verification Passed', 'Identity confirmed against your ID document. You are VERIFIED.');
                } else {
                    // Fallback to Admin Lock
                    updates.verification_status = 'PENDING'; // Lock voting
                    updates.manual_verify_requested = true; // Queue for Admin
                    updates.manual_verify_requested_at = new Date().toISOString();

                    if (docUrl) {
                        addNotification('WARNING', 'AI Verification Failed', aiMessage + ' Account locked for manual review.');
                    } else {
                        addNotification('INFO', 'Manual Review Required', 'No ID document found for auto-comparison. Account locked for Admin review.');
                    }
                }
            }

            // 3. Update Profile Logic
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            // Clear sensitive states
            setPassword('');
            setShowPasswordModal(false);

            if (newFaceBase64) {
                addNotification('SUCCESS', 'Security Update', 'Biometrics updated. Your account is PENDING REVIEW by Admin.');
            } else {
                addNotification('SUCCESS', 'Profile Updated', 'Your details have been saved.');
            }

            navigate('/User');

        } catch (error: any) {
            console.error('Profile update error:', error);
            addNotification('ERROR', 'Update Failed', error.message || 'Could not update profile.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 pt-8 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            {loading && <LoadingOverlay message={loadingMessage} />}
            {showCamera && (
                <LivenessCamera
                    onCapture={handleCameraCapture}
                    onCancel={() => setShowCamera(false)}
                    mode="register"
                />
            )}

            {/* Security Check Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in duration-200">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <Shield className="text-yellow-600" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Security Check</h3>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            Updating biometric data is a sensitive action. Please enter your password to confirm.
                        </p>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border rounded-lg mb-4 focus:ring-primary-500 focus:border-primary-500"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                className="flex-1 px-4 py-2 border text-gray-600 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-3xl mx-auto">
                <button onClick={() => navigate('/User')} className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 transition-colors">
                    <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
                </button>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="bg-primary-600 px-6 py-4 flex justify-between items-center">
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <User size={20} /> Edit Profile
                        </h1>
                    </div>

                    <form onSubmit={handleSaveClick} className="p-8 space-y-6">

                        {/* Face Update Section */}
                        <div className="flex flex-col items-center mb-8 p-6 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                            <div className="relative group cursor-pointer" onClick={() => setShowCamera(true)}>
                                <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full mb-3 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                                    {formData.photoUrl ? (
                                        <img src={formData.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={48} className="text-gray-400" />
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                    <Camera className="text-white" />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowCamera(true)}
                                className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-2 bg-white dark:bg-gray-700 px-4 py-2 rounded-full shadow-sm border border-gray-200 dark:border-gray-600"
                            >
                                <Camera size={16} />
                                {user?.faceEmbeddings ? 'Update Face Photo' : 'Setup Face Biometrics'}
                            </button>
                            {!user?.faceEmbeddings && (
                                <p className="text-xs text-red-500 dark:text-red-400 mt-2 font-medium flex items-center gap-1">
                                    <AlertTriangle size={12} /> Action Required: Face data missing for voting
                                </p>
                            )}
                            {newFaceBase64 && (
                                <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-bold flex items-center gap-1">
                                    <CheckCircle size={12} /> New biometric data ready to save
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                                <input name="firstName" value={formData.firstName} onChange={handleChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                                <input name="lastName" value={formData.lastName} onChange={handleChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><Mail size={14} /> Email (Read Only)</label>
                                <input name="email" value={formData.email} disabled className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><Phone size={14} /> Phone Number</label>
                                <input name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white" placeholder="+91..." />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button type="submit" className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 shadow-sm transition">
                                <Save size={18} /> Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

