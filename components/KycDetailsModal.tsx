import React from 'react';
import { User, VerificationStatus } from '../types';
import { X, CheckCircle, XCircle, FileText, User as UserIcon } from 'lucide-react';

interface KycDetailsModalProps {
    voter: User;
    isOpen: boolean;
    onClose: () => void;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}

export const KycDetailsModal = ({ voter, isOpen, onClose, onApprove, onReject }: KycDetailsModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-700 animate-slide-up">

                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-slate-800">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {voter.firstName} {voter.lastName}
                            <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full ml-2">ID: {voter.id.slice(0, 8)}...</span>
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">{voter.email}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-full"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">

                    {/* Images Section */}
                    <div>
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Verification Documents</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Biometric Photo */}
                            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                                <div className="text-xs text-slate-400 mb-2 flex items-center gap-2">
                                    <UserIcon size={12} /> BIOMETRIC PHOTO
                                </div>
                                <div className="aspect-[4/3] bg-black rounded-lg overflow-hidden flex items-center justify-center relative group">
                                    {voter.faceUrl ? (
                                        <img
                                            src={voter.faceUrl}
                                            alt="Biometric"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="text-slate-500 text-xs text-center p-4">
                                            No photo captured
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Aadhaar Card */}
                            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                                <div className="text-xs text-slate-400 mb-2 flex items-center gap-2">
                                    <FileText size={12} /> AADHAAR CARD
                                </div>
                                <div className="aspect-[4/3] bg-black rounded-lg overflow-hidden flex items-center justify-center relative group">
                                    {voter.kycDocUrl ? (
                                        voter.kycDocUrl.endsWith('.pdf') ? (
                                            <a href={voter.kycDocUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex flex-col items-center">
                                                <FileText size={32} className="mb-2" />
                                                View PDF
                                            </a>
                                        ) : (
                                            <img
                                                src={voter.kycDocUrl}
                                                alt="Aadhaar"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        )
                                    ) : (
                                        <div className="text-slate-500 text-xs text-center p-4">
                                            Not Uploaded
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Voter ID */}
                            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                                <div className="text-xs text-slate-400 mb-2 flex items-center gap-2">
                                    <FileText size={12} /> VOTER ID (EPIC)
                                </div>
                                <div className="aspect-[4/3] bg-black rounded-lg overflow-hidden flex items-center justify-center relative group">
                                    {voter.epicDocUrl ? (
                                        voter.epicDocUrl.endsWith('.pdf') ? (
                                            <a href={voter.epicDocUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex flex-col items-center">
                                                <FileText size={32} className="mb-2" />
                                                View PDF
                                            </a>
                                        ) : (
                                            <img
                                                src={voter.epicDocUrl}
                                                alt="EPIC"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        )
                                    ) : (
                                        <div className="text-slate-500 text-xs text-center p-4">
                                            Not Uploaded
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-800">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">Email</label>
                                <div className="text-white font-medium break-all">{voter.email}</div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">Verification Status</label>
                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${voter.verificationStatus === VerificationStatus.VERIFIED ? 'bg-green-500/20 text-green-400' :
                                        voter.verificationStatus === VerificationStatus.REJECTED ? 'bg-red-500/20 text-red-400' :
                                            'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                    {voter.verificationStatus}
                                    {voter.manualVerifyRequested && <span className="ml-2 text-purple-400">(Manual Request)</span>}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">Phone</label>
                                <div className="text-white font-medium">{voter.phone || 'N/A'}</div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">Aadhaar No.</label>
                                <div className="text-white font-mono">{voter.aadhaarNumber || voter.idNumber || 'N/A'}</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">Address</label>
                                <div className="text-white font-medium">
                                    {voter.address?.city}, {voter.address?.district}<br />
                                    {voter.address?.state}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">EPIC No.</label>
                                <div className="text-white font-mono">{voter.epicNumber || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-slate-800/50 p-6 border-t border-slate-800 flex justify-end gap-3 sticky bottom-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors font-medium"
                    >
                        Close
                    </button>
                    {!voter.electoralRollVerified && (
                        <div className="text-xs text-orange-400 self-center mr-auto flex items-center gap-1">
                            Wait for electoral roll verification if possible?
                        </div>
                    )}
                    <button
                        onClick={() => onReject(voter.id)}
                        className="px-6 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-lg transition-all font-medium flex items-center gap-2"
                    >
                        <XCircle size={18} /> Reject
                    </button>
                    <button
                        onClick={() => onApprove(voter.id)}
                        className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 rounded-lg transition-all font-medium flex items-center gap-2"
                    >
                        <CheckCircle size={18} /> Approve for Voting
                    </button>
                </div>
            </div>
        </div>
    );
};
