import React from 'react';
import { useRealtime } from '../../contexts/RealtimeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { CheckCircle, XCircle, FileText } from 'lucide-react';
import { VerificationStatus } from '../../types';

export const KycReview = () => {
    const { voters, updateVoterStatus } = useRealtime();
    const { addNotification } = useNotification();
    const pendingVoters = voters.filter(v => v.verificationStatus === VerificationStatus.PENDING);

    const handleAction = (id: string, status: VerificationStatus) => {
        updateVoterStatus(id, status);
        addNotification(status === VerificationStatus.VERIFIED ? 'SUCCESS' : 'INFO',
            status === VerificationStatus.VERIFIED ? 'Voter Approved' : 'Voter Rejected',
            `KYC status updated for user.`);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">KYC Review Queue</h1>
                <p className="text-gray-500">Review identity documents and approve voter eligibility.</p>
            </div>

            {pendingVoters.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                    <CheckCircle className="mx-auto h-16 w-16 text-green-200 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
                    <p className="text-gray-500">No pending verification requests.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {pendingVoters.map((voter) => (
                        <div key={voter.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                                        {voter.firstName[0]}{voter.lastName[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{voter.firstName} {voter.lastName}</h3>
                                        <p className="text-sm text-gray-500">{voter.email}</p>
                                    </div>
                                </div>
                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold">Pending</span>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg mb-6 text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">ID Type:</span>
                                    <span className="font-medium">{voter.idType || 'Aadhaar'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">DOB:</span>
                                    <span className="font-medium">{voter.dob || 'N/A'} ({voter.age ? `${voter.age} yrs` : 'N/A'})</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Aadhaar No.:</span>
                                    <span className="font-medium font-mono">{voter.aadhaarNumber || voter.idNumber || 'N/A'}</span>
                                </div>
                                {voter.epicNumber && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">EPIC No.:</span>
                                        <span className="font-medium font-mono">{voter.epicNumber}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Aadhaar Doc:</span>
                                    {voter.kycDocUrl ? (
                                        <a href={voter.kycDocUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                            <FileText size={14} /> View Document
                                        </a>
                                    ) : (
                                        <span className="text-gray-400 italic">Not Uploaded</span>
                                    )}
                                </div>
                                {voter.epicDocUrl && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">EPIC Doc:</span>
                                        <a href={voter.epicDocUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                            <FileText size={14} /> View Document
                                        </a>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Face Photo:</span>
                                    {voter.faceUrl ? (
                                        <a href={voter.faceUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                            <FileText size={14} /> View Photo
                                        </a>
                                    ) : (
                                        <span className="text-gray-400 italic">Not Captured</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => handleAction(voter.id, VerificationStatus.VERIFIED)} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2">
                                    <CheckCircle size={18} /> Approve
                                </button>
                                <button onClick={() => handleAction(voter.id, VerificationStatus.REJECTED)} className="flex-1 bg-white border border-red-200 text-red-600 py-2 rounded-lg font-medium hover:bg-red-50 flex items-center justify-center gap-2">
                                    <XCircle size={18} /> Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};