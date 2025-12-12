import React from 'react';
import { useRealtime } from '../../contexts/RealtimeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { CheckCircle, XCircle, FileText, Eye } from 'lucide-react';
import { VerificationStatus, User } from '../../types';
import { KycDetailsModal } from '../../components/KycDetailsModal';

export const KycReview = () => {
    const { voters, updateVoterStatus } = useRealtime();
    const { addNotification } = useNotification();
    const [selectedVoter, setSelectedVoter] = React.useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    const pendingVoters = voters.filter(v =>
        v.verificationStatus === VerificationStatus.PENDING || v.manualVerifyRequested
    );

    const handleAction = (id: string, status: VerificationStatus) => {
        updateVoterStatus(id, status);
        addNotification(status === VerificationStatus.VERIFIED ? 'SUCCESS' : 'INFO',
            status === VerificationStatus.VERIFIED ? 'Voter Approved' : 'Voter Rejected',
            `KYC status updated for user.`);
        setIsModalOpen(false);
    };

    const handleViewDetails = (voter: User) => {
        setSelectedVoter(voter);
        setIsModalOpen(true);
    };

    return (
        <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen transition-colors duration-200">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KYC Review Queue</h1>
                <p className="text-gray-500 dark:text-gray-400">Review identity documents and approve voter eligibility.</p>
            </div>

            {pendingVoters.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                    <CheckCircle className="mx-auto h-16 w-16 text-green-200 dark:text-green-900 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">All caught up!</h3>
                    <p className="text-gray-500 dark:text-gray-400">No pending verification requests.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {pendingVoters.map((voter) => (
                        <div key={voter.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-200 dark:bg-slate-600 rounded-full flex items-center justify-center font-bold text-gray-600 dark:text-gray-200">
                                        {voter.firstName[0]}{voter.lastName[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white capitalize">{voter.firstName} {voter.lastName}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{voter.email}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${voter.verificationStatus === VerificationStatus.PENDING
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-blue-100 text-blue-800'
                                        }`}>
                                        {voter.verificationStatus === VerificationStatus.PENDING ? 'Pending' : 'Status: ' + voter.verificationStatus}
                                    </span>
                                    {voter.manualVerifyRequested && (
                                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-semibold">
                                            Manual Request
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg mb-6 text-sm space-y-2 text-gray-700 dark:text-gray-300">
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
                                <button onClick={() => handleViewDetails(voter)} className="flex-1 bg-blue-50 dark:bg-slate-700/50 text-blue-600 dark:text-blue-400 py-2 rounded-lg font-medium hover:bg-blue-100 dark:hover:bg-slate-700 flex items-center justify-center gap-2">
                                    <Eye size={18} /> View Details
                                </button>
                                <button onClick={() => handleAction(voter.id, VerificationStatus.VERIFIED)} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2">
                                    <CheckCircle size={18} /> Approve
                                </button>
                                <button onClick={() => handleAction(voter.id, VerificationStatus.REJECTED)} className="flex-1 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 py-2 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center justify-center gap-2">
                                    <XCircle size={18} /> Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedVoter && (
                <KycDetailsModal
                    voter={selectedVoter}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onApprove={(id) => handleAction(id, VerificationStatus.VERIFIED)}
                    onReject={(id) => handleAction(id, VerificationStatus.REJECTED)}
                />
            )}
        </div>
    );
};