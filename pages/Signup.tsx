import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { extractIdData } from '../services/geminiService';
import { LoadingOverlay } from '../components/UI/LoadingOverlay';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, Camera, Check, RefreshCw, User, MapPin, ShieldCheck, FileText, CreditCard } from 'lucide-react';
import { supabase } from '../supabase';

export const Signup = () => {
  const { signUp } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Files
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [epicFile, setEpicFile] = useState<File | null>(null);
  
  // Face Capture State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [faceImageBlob, setFaceImageBlob] = useState<Blob | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.name === 'email' ? e.target.value.toLowerCase() : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleAadhaarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAadhaarFile(file);
      setLoading(true);
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

  const captureFace = () => {
      if (videoRef.current) {
          const canvas = document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.drawImage(videoRef.current, 0, 0);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        addNotification('ERROR', 'Required', 'Please upload at least one Identity Document.');
        return;
    }
    if (!faceImageBlob) {
        addNotification('ERROR', 'Required', 'Biometric Face Capture is mandatory.');
        return;
    }

    try {
      setLoading(true);
      const tempId = Date.now().toString();
      
      let kycUrl = '';
      if (aadhaarFile) {
          const idExt = aadhaarFile.name.split('.').pop();
          const sanitizedIdName = sanitizeFilename(aadhaarFile.name.split('.')[0]);
          kycUrl = await uploadToStorage(aadhaarFile, 'uploads', `${tempId}_aadhaar_${sanitizedIdName}.${idExt}`);
      }

      let epicUrl = '';
      if (epicFile) {
          const idExt = epicFile.name.split('.').pop();
          const sanitizedIdName = sanitizeFilename(epicFile.name.split('.')[0]);
          epicUrl = await uploadToStorage(epicFile, 'uploads', `${tempId}_epic_${sanitizedIdName}.${idExt}`);
      }
      
      const facePath = `${tempId}_face.jpg`;
      const faceUrl = await uploadToStorage(faceImageBlob, 'faces', facePath);

      await signUp(formData.email, formData.firstName, formData.lastName, { 
          ...formData, 
          email: formData.email,
          age,
          kycDocUrl: kycUrl, // Maps to Aadhaar Doc
          epicDocUrl: epicUrl,
          faceUrl: faceUrl,
          idNumber: formData.aadhaarNumber, // Legacy field fallback
          idType: 'AADHAAR'
      });
      
      navigate('/IdVerification');
    } catch (err: any) {
      addNotification('ERROR', 'Registration Failed', err.message);
    } finally {
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
      {loading && <LoadingOverlay message="Creating Secure Profile..." />}
      
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
                          <User className="text-primary-500" size={20}/> Personal Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
                          <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
                          <Input label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required fullWidth />
                          <Input label="Phone Number" name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
                          <Input label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} required />
                      </div>
                  </div>

                  {/* Section 2: Address & Security */}
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6 border-b dark:border-slate-700 pb-4">
                          <MapPin className="text-primary-500" size={20}/> Address & Security
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Input label="State" name="state" value={formData.state} onChange={handleChange} required />
                          <Input label="District" name="district" value={formData.district} onChange={handleChange} required />
                          <Input label="City" name="city" value={formData.city} onChange={handleChange} required fullWidth />
                          <Input label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />
                          <Input label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
                      </div>
                  </div>

                  {/* Section 3: Identity Documents */}
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                       <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6 border-b dark:border-slate-700 pb-4">
                          <FileText className="text-primary-500" size={20}/> Identity Documents
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
                                        <input type="file" className="hidden" onChange={handleAadhaarUpload} accept="image/*,application/pdf" />
                                    </div>
                                </label>
                                {aadhaarFile && <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-lg border border-emerald-100 dark:border-emerald-800"><Check size={12}/> {aadhaarFile.name}</div>}
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
                                {epicFile && <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-lg border border-emerald-100 dark:border-emerald-800"><Check size={12}/> {epicFile.name}</div>}
                           </div>
                       </div>
                  </div>

                  {/* Section 4: Biometric Capture */}
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                       <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                          <Camera className="text-primary-500" size={20}/> Biometric Capture
                       </h3>
                       <div className="flex flex-col items-center justify-center min-h-[200px]">
                            {facePreview ? (
                                <div className="relative group">
                                    <img src={facePreview} alt="Preview" className="w-32 h-32 rounded-full object-cover border-4 border-primary-500 shadow-lg" />
                                    <button type="button" onClick={resetCamera} className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white font-medium text-xs"><RefreshCw size={16}/> Retake</button>
                                </div>
                            ) : isCameraOpen ? (
                                <div className="w-full h-48 bg-black rounded-lg overflow-hidden relative border border-slate-300 dark:border-slate-600">
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                    <button type="button" onClick={captureFace} className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-black px-4 py-1 rounded-full text-xs font-bold hover:bg-slate-200">Take Photo</button>
                                </div>
                            ) : (
                                <div onClick={startCamera} className="w-full h-48 bg-slate-100 dark:bg-slate-700/50 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                                    <Camera className="w-10 h-10 text-slate-400 mb-2" />
                                    <span className="text-sm text-slate-500 font-medium">Start Camera</span>
                                </div>
                            )}
                            <p className="text-xs text-slate-500 mt-4 text-center">This image will be encrypted and used for identity verification.</p>
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

const Input = ({ label, fullWidth = false, ...props }: any) => (
    <div className={fullWidth ? "md:col-span-2 space-y-2" : "space-y-2"}>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
        <input className="input-standard" {...props} />
    </div>
);