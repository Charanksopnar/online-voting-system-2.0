import React, { useState, useMemo } from 'react';
import { useRealtime } from '../../contexts/RealtimeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Link } from 'react-router-dom';
import { Trash2, Search, Plus, Edit2, MapPin, X, Save, Upload } from 'lucide-react';
import { Candidate } from '../../types';
import { supabase } from '../../supabase';

export const CandidatesManagement = () => {
    const { candidates, deleteCandidate, updateCandidate, elections } = useRealtime();
    const { addNotification } = useNotification();
    const [search, setSearch] = useState('');
    const [filterElection, setFilterElection] = useState('');
    const [filterRegion, setFilterRegion] = useState('');

    // Edit modal state
    const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
    const [editForm, setEditForm] = useState({
        name: '',
        party: '',
        age: '',
        manifesto: ''
    });
    const [candidateImg, setCandidateImg] = useState<File | null>(null);
    const [partyImg, setPartyImg] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

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

    // Edit handlers
    const openEditModal = (candidate: Candidate) => {
        setEditingCandidate(candidate);
        setEditForm({
            name: candidate.name,
            party: candidate.party,
            age: candidate.age?.toString() || '',
            manifesto: candidate.manifesto || ''
        });
        setCandidateImg(null);
        setPartyImg(null);
    };

    const closeEditModal = () => {
        setEditingCandidate(null);
        setEditForm({ name: '', party: '', age: '', manifesto: '' });
        setCandidateImg(null);
        setPartyImg(null);
    };

    const handleUpload = async (file: File, bucket: string) => {
        const fileName = `${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase()}`;
        const { data, error } = await supabase.storage.from(bucket).upload(fileName, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return publicUrl;
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCandidate) return;

        if (!editForm.name.trim()) {
            addNotification('ERROR', 'Validation', 'Name is required');
            return;
        }

        setSaving(true);
        try {
            let photoUrl = editingCandidate.photoUrl;
            if (candidateImg) {
                photoUrl = await handleUpload(candidateImg, 'uploads');
            }

            let partySymbolUrl = editingCandidate.partySymbolUrl;
            if (partyImg) {
                partySymbolUrl = await handleUpload(partyImg, 'uploads');
            }

            await updateCandidate(editingCandidate.id, {
                name: editForm.name.trim(),
                party: editForm.party.trim(),
                age: editForm.age ? parseInt(editForm.age) : undefined,
                manifesto: editForm.manifesto.trim(),
                photoUrl,
                partySymbolUrl
            });
            closeEditModal();
        } catch (err: any) {
            console.error(err);
            addNotification('ERROR', 'Update Failed', err.message || 'Error updating candidate');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen">

            {/* Edit Modal */}
            {editingCandidate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Edit Candidate</h3>
                            <button onClick={closeEditModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-5 space-y-6">

                            {/* Image Uploads in Edit */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center gap-3 bg-slate-50 dark:bg-slate-900/50">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Profile Photo</span>
                                    <div className="relative group">
                                        <img
                                            src={candidateImg ? URL.createObjectURL(candidateImg) : (editingCandidate.photoUrl || `https://ui-avatars.com/api/?name=${editForm.name}&background=random`)}
                                            alt="Candidate"
                                            className="w-20 h-20 rounded-full object-cover border-2 border-white dark:border-slate-600 shadow-md"
                                        />
                                        <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                                            <Upload size={16} className="text-white" />
                                            <input type="file" className="hidden" accept="image/*" onChange={e => setCandidateImg(e.target.files?.[0] || null)} />
                                        </label>
                                    </div>
                                    <span className="text-xs text-slate-400">{candidateImg ? 'New image selected' : 'Click to change'}</span>
                                </div>

                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center gap-3 bg-slate-50 dark:bg-slate-900/50">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Party Symbol</span>
                                    <div className="relative group">
                                        <div className="w-20 h-20 bg-white rounded-lg p-2 border border-slate-200 shadow-sm flex items-center justify-center">
                                            <img
                                                src={partyImg ? URL.createObjectURL(partyImg) : (editingCandidate.partySymbolUrl || `https://ui-avatars.com/api/?name=${editForm.party}&background=random`)}
                                                alt="Party"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <label className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                                            <Upload size={16} className="text-white" />
                                            <input type="file" className="hidden" accept="image/*" onChange={e => setPartyImg(e.target.files?.[0] || null)} />
                                        </label>
                                    </div>
                                    <span className="text-xs text-slate-400">{partyImg ? 'New image selected' : 'Click to change'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="input-standard w-full"
                                        placeholder="Candidate Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Party</label>
                                    <input
                                        type="text"
                                        value={editForm.party}
                                        onChange={e => setEditForm(prev => ({ ...prev, party: e.target.value }))}
                                        className="input-standard w-full"
                                        placeholder="Party Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Age</label>
                                    <input
                                        type="number"
                                        value={editForm.age}
                                        onChange={e => setEditForm(prev => ({ ...prev, age: e.target.value }))}
                                        className="input-standard w-full"
                                        placeholder="Age"
                                        min="18"
                                        max="120"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Manifesto / Bio</label>
                                <textarea
                                    value={editForm.manifesto}
                                    onChange={e => setEditForm(prev => ({ ...prev, manifesto: e.target.value }))}
                                    className="input-standard w-full h-24 resize-none"
                                    placeholder="Brief description or manifesto..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                                >
                                    <Save size={16} />
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
                                            <div className="font-bold text-slate-800 dark:text-white capitalize">{candidate.name}</div>
                                            <div className="text-xs text-slate-500 max-w-xs truncate">{candidate.manifesto}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-1 rounded text-xs font-bold capitalize">
                                                {candidate.party}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-slate-700 dark:text-slate-300">{election?.title || 'N/A'}</div>
                                            <div className="text-xs text-slate-500">{election?.region} Level</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 capitalize">
                                                <MapPin size={12} className="text-primary-500" />
                                                {getLocationDisplay(candidate)}
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400 font-mono">{candidate.age}</td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(candidate)}
                                                    className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 transition"
                                                >
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
