import React, { useState, useMemo } from 'react';
import { INDIAN_STATES_DISTRICTS } from '../../data/indianStatesDistricts';
import { useRealtime } from '../../contexts/RealtimeContext';
import { Search, Ban, Unlock, Trash2, Eye, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { VerificationStatus } from '../../types';

export const VotersManagement = () => {
    const { voters, blockVoter, unblockVoter, deleteVoter, updateVoterStatus, officialVoters, crossVerifyElectoralRoll } = useRealtime();

    const [filterState, setFilterState] = useState('');
    const [filterDistrict, setFilterDistrict] = useState('');
    const [search, setSearch] = useState('');
    const [selectedVoter, setSelectedVoter] = useState<any>(null);

    const filtered = useMemo(() => {
        return voters.filter(v => {
            const matchesSearch =
                v.firstName.toLowerCase().includes(search.toLowerCase()) ||
                v.email.toLowerCase().includes(search.toLowerCase()) ||
                v.phone?.includes(search) ||
                v.idNumber?.includes(search);

            const matchesState = filterState ? v.address?.state === filterState : true;
            const matchesDistrict = filterDistrict ? v.address?.district === filterDistrict : true;
            const isNotAdmin = v.role !== 'ADMIN';

            return matchesSearch && matchesState && matchesDistrict && isNotAdmin;
        });
    }, [voters, search, filterState, filterDistrict]);

    const districtsForFilter = useMemo(() => {
        return filterState ? INDIAN_STATES_DISTRICTS[filterState] || [] : [];
    }, [filterState]);

    const handleStateFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilterState(e.target.value);
        setFilterDistrict('');
    };

    // Find matching official voter for cross-verification
    const getMatchingOfficialVoter = (voter: any) => {
        return officialVoters.find(o =>
            (voter.aadhaarNumber && o.aadhaarNumber === voter.aadhaarNumber) ||
            (voter.epicNumber && o.epicNumber === voter.epicNumber)
        );
    };

    const handleCrossVerify = async (voterId: string, officialVoterId: string) => {
        await crossVerifyElectoralRoll(voterId, officialVoterId);
    };

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-wide">Voters Registry</h2>
                    <p className="text-sm text-slate-500">Manage registered voters and verification status</p>
                </div>
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    {/* State Filter */}
                    <select
                        value={filterState}
                        onChange={handleStateFilterChange}
                        className="input-standard py-2.5 px-3 min-w-[150px] text-sm"
                    >
                        <option value="">All States</option>
                        {Object.keys(INDIAN_STATES_DISTRICTS).map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>

                    {/* District Filter */}
                    <select
                        value={filterDistrict}
                        onChange={e => setFilterDistrict(e.target.value)}
                        disabled={!filterState}
                        className="input-standard py-2.5 px-3 min-w-[150px] text-sm disabled:opacity-50"
                    >
                        <option value="">All Districts</option>
                        {districtsForFilter.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>

                    <div className="relative flex-1 md:w-64">
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            type="text"
                            placeholder="Search voters..."
                            className="input-standard pl-10 w-full"
                        />
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-300 text-xs uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                                <th className="p-4">Photo</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Contact</th>
                                <th className="p-4">Address</th>
                                <th className="p-4">Voter ID</th>
                                <th className="p-4">Electoral Roll</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                            {filtered.map(voter => (
                                <tr key={voter.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                                    <td className="p-4">
                                        <img src={voter.faceUrl || voter.photoUrl} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 object-cover shadow-sm" alt="V" />
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800 dark:text-white">{voter.firstName} {voter.lastName}</div>
                                        <div className="text-xs text-slate-500">{voter.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-slate-700 dark:text-slate-300">{voter.phone}</div>
                                        <div className="text-xs text-slate-500">Age: {voter.age}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm font-medium text-slate-800 dark:text-white">{voter.address?.state || 'N/A'}</div>
                                        <div className="text-xs text-slate-500">{voter.address?.district}</div>
                                    </td>
                                    <td className="p-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                                        <span className="bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded block mb-1">Aadhaar: {voter.aadhaarNumber || voter.idNumber || 'N/A'}</span>
                                        {voter.epicNumber && <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded block">EPIC: {voter.epicNumber}</span>}
                                    </td>
                                    <td className="p-4">
                                        {(() => {
                                            const matchingOfficial = getMatchingOfficialVoter(voter);
                                            if (voter.electoralRollVerified) {
                                                return (
                                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">
                                                        <CheckCircle size={10} /> VERIFIED
                                                    </span>
                                                );
                                            } else if (voter.manualVerifyRequested) {
                                                return (
                                                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">
                                                        <Clock size={10} /> PENDING
                                                    </span>
                                                );
                                            } else if (matchingOfficial) {
                                                return (
                                                    <button
                                                        onClick={() => handleCrossVerify(voter.id, matchingOfficial.id)}
                                                        className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-[10px] font-bold flex items-center gap-1 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition"
                                                    >
                                                        <CheckCircle size={10} /> Cross-Verify
                                                    </button>
                                                );
                                            } else {
                                                return (
                                                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">
                                                        <AlertCircle size={10} /> NOT FOUND
                                                    </span>
                                                );
                                            }
                                        })()}
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => voter.isBlocked ? unblockVoter(voter.id) : blockVoter(voter.id, 'Admin Action')}
                                            className={`px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 w-fit transition-colors ${voter.isBlocked
                                                    ? 'border-red-200 bg-red-50 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                                                    : 'border-green-200 bg-green-50 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                                                }`}
                                        >
                                            {voter.isBlocked ? <><Ban size={10} /> BLOCKED</> : <><Unlock size={10} /> ACTIVE</>}
                                        </button>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => setSelectedVoter(voter)} className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition">
                                                <Eye size={16} />
                                            </button>
                                            <button onClick={() => deleteVoter(voter.id)} className="p-2 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={8} className="p-8 text-center text-slate-500">No voters found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 flex justify-end text-xs text-slate-500 font-bold border-t border-slate-200 dark:border-slate-700">
                    Total Records: {filtered.length}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedVoter && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
                        <div className="bg-slate-900 text-white p-6 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold">{selectedVoter.firstName} {selectedVoter.lastName}</h3>
                                <p className="text-slate-400 text-sm">{selectedVoter.id}</p>
                            </div>
                            <button onClick={() => setSelectedVoter(null)} className="text-slate-400 hover:text-white"><Eye size={20} /></button>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Biometric Photo</label>
                                <img src={selectedVoter.faceUrl || selectedVoter.photoUrl} alt="Face" className="w-full h-40 object-cover rounded-lg mt-2 border border-slate-200 dark:border-slate-700" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Aadhaar Card</label>
                                {selectedVoter.kycDocUrl ? (
                                    <a href={selectedVoter.kycDocUrl} target="_blank" rel="noreferrer">
                                        <img src={selectedVoter.kycDocUrl} alt="Aadhaar" className="w-full h-40 object-cover rounded-lg mt-2 border border-slate-200 dark:border-slate-700 hover:opacity-80 transition" />
                                    </a>
                                ) : <div className="h-40 bg-slate-100 rounded-lg mt-2 flex items-center justify-center text-xs text-slate-400">Not Uploaded</div>}
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Voter ID (EPIC)</label>
                                {selectedVoter.epicDocUrl ? (
                                    <a href={selectedVoter.epicDocUrl} target="_blank" rel="noreferrer">
                                        <img src={selectedVoter.epicDocUrl} alt="EPIC" className="w-full h-40 object-cover rounded-lg mt-2 border border-slate-200 dark:border-slate-700 hover:opacity-80 transition" />
                                    </a>
                                ) : <div className="h-40 bg-slate-100 rounded-lg mt-2 flex items-center justify-center text-xs text-slate-400">Not Uploaded</div>}
                            </div>

                            <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                <div><span className="text-slate-500 text-xs block">Email</span> <span className="text-slate-800 dark:text-white text-sm font-medium">{selectedVoter.email}</span></div>
                                <div><span className="text-slate-500 text-xs block">Phone</span> <span className="text-slate-800 dark:text-white text-sm font-medium">{selectedVoter.phone}</span></div>
                                <div><span className="text-slate-500 text-xs block">Address</span> <span className="text-slate-800 dark:text-white text-sm font-medium">{selectedVoter.address?.city}, {selectedVoter.address?.state}</span></div>
                                <div><span className="text-slate-500 text-xs block">Verification</span> <span className="text-slate-800 dark:text-white text-sm font-medium">{selectedVoter.verificationStatus}</span></div>
                                <div><span className="text-slate-500 text-xs block">Aadhaar No.</span> <span className="text-slate-800 dark:text-white text-sm font-medium">{selectedVoter.aadhaarNumber || selectedVoter.idNumber || '-'}</span></div>
                                <div><span className="text-slate-500 text-xs block">EPIC No.</span> <span className="text-slate-800 dark:text-white text-sm font-medium">{selectedVoter.epicNumber || '-'}</span></div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
                            <button
                                onClick={async () => {
                                    await updateVoterStatus(selectedVoter.id, VerificationStatus.VERIFIED);
                                    setSelectedVoter(null);
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                Approve for Voting
                            </button>
                            <button onClick={() => setSelectedVoter(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};