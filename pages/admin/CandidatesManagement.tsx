
import React, { useState, useMemo } from 'react';
import { useRealtime } from '../../contexts/RealtimeContext';
import { Link } from 'react-router-dom';
import { Trash2, Search, Plus, Edit2, MapPin, Filter } from 'lucide-react';

export const CandidatesManagement = () => {
    const { candidates, deleteCandidate, elections } = useRealtime();
    const [search, setSearch] = useState('');
    const [filterElection, setFilterElection] = useState('');
    const [filterRegion, setFilterRegion] = useState('');

    // Get election info for a candidate
    const getElectionInfo = (electionId?: string) => {
        return elections.find(e => e.id === electionId);
    };

    // Filtered candidates
    const filteredCandidates = useMemo(() => {
        return candidates.filter(c => {
            // Search filter
            const matchesSearch = !search ||
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.party.toLowerCase().includes(search.toLowerCase());

            // Election filter
            const matchesElection = !filterElection || c.electionId === filterElection;

            // Region filter
            const election = getElectionInfo(c.electionId);
            const matchesRegion = !filterRegion || election?.region === filterRegion;

            return matchesSearch && matchesElection && matchesRegion;
        });
    }, [candidates, search, filterElection, filterRegion, elections]);

    const getLocationDisplay = (candidate: typeof candidates[0]) => {
        const election = getElectionInfo(candidate.electionId);
        if (!election) return 'Unknown';
        if (election.region === 'National') return 'National';
        if (candidate.state && candidate.district) return `${candidate.district}, ${candidate.state}`;
        if (candidate.state) return candidate.state;
        return election.region;
    };

    return (
        <div className="min-h-screen">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-wide">Candidates</h2>
                    <p className="text-sm text-slate-500">Manage election candidates and profiles</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <Link to="/AddCandidate" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary-500/30 transition transform hover:-translate-y-0.5">
                        <Plus size={18} /> Add New
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-6 border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by name or party..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="input-standard pl-10 w-full"
                    />
                </div>
                <select
                    value={filterElection}
                    onChange={e => setFilterElection(e.target.value)}
                    className="input-standard py-2.5 px-3 min-w-[180px]"
                >
                    <option value="">All Elections</option>
                    {elections.map(e => (
                        <option key={e.id} value={e.id}>{e.title}</option>
                    ))}
                </select>
                <select
                    value={filterRegion}
                    onChange={e => setFilterRegion(e.target.value)}
                    className="input-standard py-2.5 px-3 min-w-[140px]"
                >
                    <option value="">All Regions</option>
                    <option value="National">National</option>
                    <option value="State">State</option>
                    <option value="District">District</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-300 text-xs uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                                <th className="p-4">Profile</th>
                                <th className="p-4">Symbol</th>
                                <th className="p-4">Details</th>
                                <th className="p-4">Party</th>
                                <th className="p-4">Election</th>
                                <th className="p-4">Location</th>
                                <th className="p-4">Age</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                            {filteredCandidates.map(candidate => {
                                const election = getElectionInfo(candidate.electionId);
                                return (
                                    <tr key={candidate.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                                        <td className="p-4">
                                            <img
                                                src={candidate.photoUrl || `https://ui-avatars.com/api/?name=${candidate.name.replace(' ', '+')}&background=random`}
                                                alt="C"
                                                className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 border border-slate-200 dark:border-slate-600 object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${candidate.name.replace(' ', '+')}&background=random`;
                                                }}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="w-10 h-10 bg-white rounded p-1 border border-slate-200 shadow-sm">
                                                <img
                                                    src={candidate.partySymbolUrl || `https://ui-avatars.com/api/?name=${candidate.party.replace(' ', '+')}&size=40&background=random`}
                                                    alt="Sym"
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${candidate.party.replace(' ', '+')}&size=40&background=random`;
                                                    }}
                                                />
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-white">{candidate.name}</div>
                                            <div className="text-xs text-slate-500 max-w-xs truncate">{candidate.manifesto}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-1 rounded text-xs font-bold">
                                                {candidate.party}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-slate-700 dark:text-slate-300">{election?.title || 'N/A'}</div>
                                            <div className="text-xs text-slate-500">{election?.region} Level</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                                                <MapPin size={12} className="text-primary-500" />
                                                {getLocationDisplay(candidate)}
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400 font-mono">{candidate.age}</td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2">
                                                <button className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 transition">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => deleteCandidate(candidate.id)} className="p-2 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 transition">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {filteredCandidates.length === 0 && (
                                <tr><td colSpan={8} className="p-8 text-center text-slate-500">
                                    {candidates.length === 0 ? 'No candidates registered' : 'No candidates match your filters'}
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 flex justify-between text-xs text-slate-500 font-bold border-t border-slate-200 dark:border-slate-700">
                    <span>Showing: {filteredCandidates.length} of {candidates.length}</span>
                    <span>Total Candidates: {candidates.length}</span>
                </div>
            </div>
        </div>
    );
};
