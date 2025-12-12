import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtime } from '../../contexts/RealtimeContext';
import { Shield, MapPin, CheckCircle, Fingerprint, AlertTriangle, Clock, Calendar, Award, AlertCircle, Send } from 'lucide-react';

export const UserDashboard = () => {
    const { user } = useAuth();
    const { elections, candidates, votes, requestManualVerification } = useRealtime();
    const navigate = useNavigate();

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        icon?: React.ReactNode;
        confirmText?: string;
        confirmColor?: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const userVotes = votes.filter(v => v.voterId === user?.id);
    const participationRate = elections.filter(e => e.status !== 'UPCOMING').length > 0
        ? Math.round((userVotes.length / elections.filter(e => e.status !== 'UPCOMING').length) * 100)
        : 0;

    // Filter Logic - Location-based election filtering
    const relevantElections = elections.filter(e => {
        if (e.status === 'ENDED') return false;

        // National elections are visible to everyone
        if (!e.region || e.region === 'National') return true;

        // State elections - show if user's state matches
        if (e.region === 'State' && e.regionState) {
            return user?.address?.state === e.regionState;
        }

        // District elections - show if user's district matches
        if (e.region === 'District' && e.regionDistrict) {
            return user?.address?.state === e.regionState && user?.address?.district === e.regionDistrict;
        }

        return false;
    });

    const endedElections = elections.filter(e => {
        if (e.status !== 'ENDED') return false;

        // National elections are visible to everyone
        if (!e.region || e.region === 'National') return true;

        // State elections - show if user's state matches
        if (e.region === 'State' && e.regionState) {
            return user?.address?.state === e.regionState;
        }

        // District elections - show if user's district matches
        if (e.region === 'District' && e.regionDistrict) {
            return user?.address?.state === e.regionState && user?.address?.district === e.regionDistrict;
        }

        return false;
    });

    // User is eligible to vote if electoral roll is verified
    const isVerified = user?.electoralRollVerified === true;

    // Handlers
    const handleKycClick = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Start Verification?',
            message: 'You are about to start the identity verification process. Please ensure you have your Government ID ready and are in a well-lit area for the face scan.',
            icon: <Fingerprint className="text-yellow-500" size={28} />,
            confirmText: 'Start KYC',
            confirmColor: 'bg-yellow-500 hover:bg-yellow-600',
            onConfirm: () => navigate('/IdVerification')
        });
    };

    const handleVoteClick = (electionId: string, title: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Enter Voting Booth?',
            message: `You are entering the secure voting session for "${title}". Ensure you are alone and ready to cast your vote. Navigating away during the session may flag your vote.`,
            icon: <Shield className="text-primary-600" size={28} />,
            confirmText: 'Enter Booth',
            confirmColor: 'bg-primary-600 hover:bg-primary-700',
            onConfirm: () => navigate(`/Vote/${electionId}`)
        });
    };

    const closeConfirmModal = () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 pb-12 transition-colors duration-200">

            {/* Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 dark:border-gray-700 overflow-hidden transform transition-all scale-100">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-full">
                                    {confirmModal.icon || <AlertTriangle className="text-gray-600" size={24} />}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{confirmModal.title}</h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{confirmModal.message}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 flex gap-3 justify-end border-t dark:border-gray-700">
                            <button
                                onClick={closeConfirmModal}
                                className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    confirmModal.onConfirm();
                                    closeConfirmModal();
                                }}
                                className={`px-5 py-2 rounded-lg text-white font-bold shadow-lg transition ${confirmModal.confirmColor || 'bg-primary-600 hover:bg-primary-700'}`}
                            >
                                {confirmModal.confirmText || 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Gradient Banner */}
            <div className="h-48 bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-700 dark:from-primary-900 dark:via-primary-800 dark:to-indigo-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 dark:bg-white/5 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-end gap-6 mb-10">
                    <div className="relative group">
                        <div className="w-36 h-36 rounded-2xl border-4 border-white dark:border-gray-800 shadow-2xl overflow-hidden bg-gray-200">
                            <img
                                src={user?.faceUrl || user?.photoUrl || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}`}
                                alt="Profile"
                                onError={(e) => {
                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=random`;
                                }}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <Link to="/Edit" className="absolute bottom-2 right-2 bg-white/90 dark:bg-gray-800/90 p-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition text-xs font-bold hover:bg-white text-gray-800 dark:text-gray-200">Edit</Link>
                    </div>
                    <div className="flex-1 pb-2">
                        <h1 className="text-3xl font-bold text-white dark:text-gray-100 mb-1 flex items-center gap-3">
                            {user?.firstName} {user?.lastName}
                            {isVerified && <CheckCircle className="text-green-400 dark:text-green-300" fill="currentColor" size={24} stroke="black" />}
                        </h1>
                        <p className="text-primary-50 dark:text-gray-300 flex items-center gap-2">
                            <MapPin size={16} /> {user?.address?.city}, {user?.address?.state}
                        </p>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                        <div className="text-center px-4 border-r dark:border-gray-700">
                            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{userVotes.length}</div>
                            <div className="text-xs text-gray-500 uppercase font-medium">Votes Cast</div>
                        </div>
                        <div className="text-center px-4">
                            <div className="text-2xl font-bold text-green-500">{participationRate}%</div>
                            <div className="text-xs text-gray-500 uppercase font-medium">Participation</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Digital ID & Electoral Roll Status */}
                    <div className="space-y-6">

                        {/* Digital ID Card */}
                        <div className="perspective-1000">
                            <div className="relative w-full aspect-[1.586] rounded-2xl overflow-hidden shadow-2xl transform transition-transform duration-500 hover:rotate-y-12 hover:rotate-x-12 preserve-3d group bg-gradient-to-br from-gray-900 to-gray-800 text-white border border-gray-700">
                                {/* Background Holographic Effect */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-white/0 pointer-events-none"></div>
                                <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-45 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                                <div className="p-6 h-full flex flex-col justify-between relative z-10">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <Shield size={32} className="text-primary-400" />
                                            <div className="leading-tight">
                                                <div className="text-[10px] uppercase tracking-[0.2em] text-gray-400">SecureVote</div>
                                                <div className="font-bold text-lg">Digital Voter ID</div>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 opacity-80 overflow-hidden rounded-md border border-gray-600">
                                            {user?.faceUrl ? (
                                                <img src={user.faceUrl} alt="Biometric" className="w-full h-full object-cover" />
                                            ) : (
                                                <Fingerprint size={40} className="text-gray-500 m-auto" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-4 items-end">
                                        <div className="flex-1 space-y-1">
                                            <div className="text-[10px] uppercase text-gray-400">Voter Name</div>
                                            <div className="font-mono text-sm tracking-wider">{user?.firstName} {user?.lastName}</div>

                                            <div className="grid grid-cols-2 gap-4 mt-2">
                                                <div>
                                                    <div className="text-[10px] uppercase text-gray-400">DOB</div>
                                                    <div className="font-mono text-xs">{user?.dob}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] uppercase text-gray-400">ID Ref</div>
                                                    <div className="font-mono text-xs text-primary-300">{user?.idNumber}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-20 h-20 bg-white p-1 rounded-lg">
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${user?.id}`}
                                                alt="QR"
                                                className="w-full h-full"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center border-t border-gray-700 pt-3 mt-2">
                                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isVerified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {isVerified ? 'VERIFIED' : 'PENDING VERIFICATION'}
                                        </div>
                                        <div className="text-[10px] text-gray-500">Issued by Election Commission</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Electoral Roll Status Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="p-5">
                                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-4">Electoral Roll Status</h3>

                                {user?.electoralRollVerified ? (
                                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                                        <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-full">
                                            <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-green-800 dark:text-green-300">Verified in Electoral Roll</div>
                                            <div className="text-sm text-green-600 dark:text-green-400">You are eligible to vote in elections</div>
                                        </div>
                                    </div>
                                ) : user?.manualVerifyRequested ? (
                                    <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-full">
                                            <Clock className="text-yellow-600 dark:text-yellow-400" size={24} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-yellow-800 dark:text-yellow-300">Manual Verification Pending</div>
                                            <div className="text-sm text-yellow-600 dark:text-yellow-400">Admin is verifying your details. This may take some time.</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                                            <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-full">
                                                <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-red-800 dark:text-red-300">Not Found in Electoral Roll</div>
                                                <div className="text-sm text-red-600 dark:text-red-400">Your details could not be auto-verified against official voter lists.</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => user?.id && requestManualVerification(user.id)}
                                            className="w-full px-4 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:from-primary-700 hover:to-secondary-700 transition shadow-lg shadow-primary-500/20"
                                        >
                                            <Send size={18} />
                                            Request Manual Verification
                                        </button>
                                        <p className="text-xs text-gray-500 text-center">Takes time - Admin will cross-verify your Aadhaar/EPIC against government records</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Middle/Right: Action Center */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Active Elections */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <h2 className="text-xl font-bold">Action Center</h2>
                                <span className="text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-2 py-1 rounded-full font-bold">
                                    {relevantElections.length} Active
                                </span>
                            </div>

                            <div className="p-6 space-y-4">
                                {relevantElections.length === 0 ? (
                                    <div className="text-center py-10">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                            <Clock size={32} />
                                        </div>
                                        <h3 className="font-bold text-gray-600 dark:text-gray-400">No Elections Currently Active</h3>
                                        <p className="text-sm text-gray-500">Check back later for upcoming polls in your region.</p>
                                    </div>
                                ) : (
                                    relevantElections.map(election => {
                                        const hasVoted = userVotes.some(v => v.electionId === election.id);
                                        return (
                                            <div key={election.id} className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:border-primary-500 dark:hover:border-primary-500">
                                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {election.status === 'ACTIVE' ? (
                                                                <span className="flex items-center gap-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Live
                                                                </span>
                                                            ) : (
                                                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                                                    Upcoming
                                                                </span>
                                                            )}
                                                            <span className="text-xs text-gray-500 font-medium">{election.region}</span>
                                                        </div>
                                                        <h3 className="text-lg font-bold group-hover:text-primary-600 transition-colors">{election.title}</h3>
                                                        <div className="text-sm text-gray-500 mt-1 flex items-center gap-3">
                                                            <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(election.startDate).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        {election.status === 'ACTIVE' ? (
                                                            hasVoted ? (
                                                                <button disabled className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-500 font-bold rounded-lg cursor-default flex items-center gap-2">
                                                                    <Shield size={16} /> Voted
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => {
                                                                        if (isVerified) {
                                                                            handleVoteClick(election.id, election.title);
                                                                        } else {
                                                                            handleKycClick();
                                                                        }
                                                                    }}
                                                                    className={`px-6 py-2.5 font-bold rounded-lg shadow-lg transition transform hover:-translate-y-0.5 flex items-center gap-2 ${isVerified
                                                                        ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:from-primary-700 hover:to-secondary-700'
                                                                        : 'bg-yellow-500 text-white hover:bg-yellow-600'
                                                                        }`}
                                                                >
                                                                    {isVerified ? 'Vote Now' : 'Verify First'}
                                                                </button>
                                                            )
                                                        ) : (
                                                            <button disabled className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-400 font-medium rounded-lg cursor-not-allowed">
                                                                Opens Soon
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Past Results */}
                        {endedElections.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                                    <h2 className="text-xl font-bold">Past Election Results</h2>
                                </div>
                                <div className="p-6 grid gap-4">
                                    {endedElections.map(election => {
                                        const winnerId = candidates
                                            .filter(c => c.electionId === election.id)
                                            .sort((a, b) => b.votes - a.votes)[0]?.id;
                                        const winner = candidates.find(c => c.id === winnerId);

                                        return (
                                            <div key={election.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                                                <div>
                                                    <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">{election.title}</h3>
                                                    <p className="text-xs text-gray-500">Concluded {new Date(election.endDate).toLocaleDateString()}</p>
                                                </div>
                                                {winner ? (
                                                    <div className="text-right">
                                                        <div className="text-xs font-bold text-yellow-600 dark:text-yellow-400 flex items-center justify-end gap-1">
                                                            <Award size={14} /> Winner
                                                        </div>
                                                        <div className="font-bold text-sm text-gray-900 dark:text-white">{winner.name}</div>
                                                        <div className="text-xs text-gray-500">{winner.party}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Calculating...</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
