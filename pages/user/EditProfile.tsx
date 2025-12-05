import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Save, ArrowLeft } from 'lucide-react';
import { LoadingOverlay } from '../../components/UI/LoadingOverlay';

export const EditProfile = () => {
  const { user } = useAuth(); // In real app, we'd have a 'updateUser' method
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    photoUrl: user?.photoUrl || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
        setLoading(false);
        addNotification('SUCCESS', 'Profile Updated', 'Your details have been saved successfully.');
        navigate('/User');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-12 px-4 sm:px-6 lg:px-8">
      {loading && <LoadingOverlay message="Updating Profile..." />}
      
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/User')} className="flex items-center text-gray-500 hover:text-gray-700 mb-6">
            <ArrowLeft size={16} className="mr-1"/> Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-primary-600 px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <User size={20} /> Edit Profile
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 bg-gray-200 rounded-full mb-3 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                        {formData.photoUrl ? (
                            <img src={formData.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User size={40} className="text-gray-400" />
                        )}
                    </div>
                    <button type="button" className="text-sm text-primary-600 font-medium hover:text-primary-700">Change Photo</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">First Name</label>
                        <input name="firstName" value={formData.firstName} onChange={handleChange} className="w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Last Name</label>
                        <input name="lastName" value={formData.lastName} onChange={handleChange} className="w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><Mail size={14}/> Email (Read Only)</label>
                        <input name="email" value={formData.email} disabled className="w-full p-2 border rounded-md bg-gray-50 text-gray-500 cursor-not-allowed" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><Phone size={14}/> Phone Number</label>
                        <input name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500" placeholder="+91..." />
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