
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRealtime } from '../../contexts/RealtimeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { INDIAN_STATES_DISTRICTS } from '../../data/indianStatesDistricts';
import { supabase } from '../../supabase';
import { Upload, Save, ArrowLeft, MapPin, Info, UserPlus, Users, Search } from 'lucide-react';

export const AddCandidate = () => {
    const { addCandidate, elections, candidates, updateCandidate } = useRealtime();
    const { addNotification } = useNotification();
    const navigate = useNavigate();

    // Only allow adding candidates to UPCOMING elections
    const activeElections = elections.filter(e => e.status === 'UPCOMING');

    const [mode, setMode] = useState<'create' | 'existing'>('create');
    const [selectedExistingCandidates, setSelectedExistingCandidates] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [form, setForm] = useState({
        name: '',
        party: '',
        age: '',
        bio: '',
        electionId: '',
        state: '',
        district: ''
    });
    const [candidateImg, setCandidateImg] = useState<File | null>(null);
    const [partyImg, setPartyImg] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    // Get selected election details
    const selectedElection = useMemo(() => {
        return elections.find(e => e.id === form.electionId);
    }, [form.electionId, elections]);

    // Determine if we need to show location fields
    const showLocationFields = selectedElection && selectedElection.region !== 'National';
    const requireDistrict = selectedElection?.region === 'District';

    // Get districts for selected state
    const districtsForState = useMemo(() => {
        return form.state ? INDIAN_STATES_DISTRICTS[form.state] || [] : [];
    }, [form.state]);

    // Filter existing candidates - exclude those already in the selected election
    const availableCandidates = useMemo(() => {
        if (!form.electionId) return [];

        return candidates.filter(c => {
            // Exclude candidates already in this election
            if (c.electionId === form.electionId) return false;

            // Filter by search term
            if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !c.party.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }

            // For regional elections, match location
            if (selectedElection?.region === 'State' && c.state !== selectedElection.regionState) {
                return false;
            }
            if (selectedElection?.region === 'District' &&
                (c.state !== selectedElection.regionState || c.district !== selectedElection.regionDistrict)) {
                return false;
            }

            return true;
        });
    }, [candidates, form.electionId, searchTerm, selectedElection]);

    // Auto-populate state/district from election when election is selected
    const handleElectionChange = (electionId: string) => {
        const election = elections.find(e => e.id === electionId);
        setForm({
            ...form,
            electionId,
            state: election?.regionState || '',
            district: election?.regionDistrict || ''
        });
        setSelectedExistingCandidates([]);
    };

    const handleUpload = async (file: File, bucket: string) => {
        const fileName = `${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase()}`;
        const { data, error } = await supabase.storage.from(bucket).upload(fileName, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.electionId) return addNotification('ERROR', 'Required', 'Select an election');

        if (mode === 'create') {
            if (!partyImg) return addNotification('ERROR', 'Required', 'Upload Party Symbol');

            // Validate location for non-national elections
            if (showLocationFields && !form.state) {
                return addNotification('ERROR', 'Required', 'Select a state');
            }
            if (requireDistrict && !form.district) {
                return addNotification('ERROR', 'Required', 'Select a district');
            }

            setLoading(true);
            try {
                let partyUrl = '';
                if (partyImg) partyUrl = await handleUpload(partyImg, 'uploads');

                let candidatePhotoUrl = '';
                if (candidateImg) candidatePhotoUrl = await handleUpload(candidateImg, 'uploads');

                addCandidate({
                    id: Date.now().toString(),
                    name: form.name,
                    party: form.party,
                    age: parseInt(form.age),
                    manifesto: form.bio,
                    partySymbolUrl: partyUrl,
                    photoUrl: candidatePhotoUrl,
                    electionId: form.electionId,
                    votes: 0,
                    state: form.state || undefined,
                    district: form.district || undefined
                });

                addNotification('SUCCESS', 'Success', 'Candidate Created');
                navigate('/candidate');
            } catch (err: any) {
                addNotification('ERROR', 'Error', err.message);
            } finally {
                setLoading(false);
            }
        } else {
            // Add existing candidates to election
            if (selectedExistingCandidates.length === 0) {
                return addNotification('ERROR', 'Required', 'Select at least one candidate');
            }

            setLoading(true);
            try {
                // Update all selected candidates
                await Promise.all(
                    selectedExistingCandidates.map(candidateId =>
                        updateCandidate(candidateId, {
                            electionId: form.electionId
                        })
                    )
                );
                addNotification('SUCCESS', 'Success', `${selectedExistingCandidates.length} candidate(s) added to election`);
                navigate('/candidate');
            } catch (err: any) {
                addNotification('ERROR', 'Error', err.message);
            } finally {
                setLoading(false);
            }
        }
    };

    const toggleCandidateSelection = (candidateId: string) => {
        if (selectedExistingCandidates.includes(candidateId)) {
            setSelectedExistingCandidates(prev => prev.filter(id => id !== candidateId));
        } else {
            setSelectedExistingCandidates(prev => [...prev, candidateId]);
        }
    };

    return (
        <div className="min-h-screen">
            <div className="mb-8 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition">
                    <ArrowLeft className="text-slate-600 dark:text-slate-400" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                        {mode === 'create' ? 'Create Candidate' : 'Add Existing Candidate'}
                    </h2>
                    <p className="text-sm text-slate-500">
                        {mode === 'create' ? 'Add a new contestant to an election' : 'Select existing candidates to add to an election'}
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 rounded-2xl shadow-sm max-w-4xl">
                {/* Mode Toggle */}
                <div className="mb-6 flex gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <button
                        type="button"
                        onClick={() => setMode('create')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium transition ${mode === 'create'
                                ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-400 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                    >
                        <UserPlus size={18} />
                        Create New
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('existing')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium transition ${mode === 'existing'
                                ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-400 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                    >
                        <Users size={18} />
                        Add Existing
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Election Selection */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Election</label>
                        <select
                            className="input-standard"
                            value={form.electionId}
                            onChange={e => handleElectionChange(e.target.value)}
                        >
                            <option value="">-- Select Upcoming Election --</option>
                            {activeElections.map(e => (
                                <option key={e.id} value={e.id}>
                                    {e.title} ({e.region}{e.regionState ? ` - ${e.regionState}` : ''}{e.regionDistrict ? `, ${e.regionDistrict}` : ''})
                                </option>
                            ))}
                        </select>

                        {/* Show election location info */}
                        {selectedElection && (
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                                    <MapPin size={16} />
                                    <span className="font-medium">
                                        {selectedElection.region === 'National' && 'This is a National election - candidate will be visible to all voters'}
                                        {selectedElection.region === 'State' && `This is a State election for ${selectedElection.regionState} - candidate will be visible to voters from this state`}
                                        {selectedElection.region === 'District' && `This is a District election for ${selectedElection.regionDistrict}, ${selectedElection.regionState} - candidate will be visible to voters from this district`}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {mode === 'create' ? (
                        <>
                            {/* Candidate Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Candidate Name</label>
                                    <input className="input-standard capitalize" placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value.replace(/\b\w/g, c => c.toUpperCase()) })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Candidate Age</label>
                                    <input type="number" className="input-standard" placeholder="Age" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Party Affiliation</label>
                                    <input className="input-standard" placeholder="Party Name" value={form.party} onChange={e => setForm({ ...form, party: e.target.value })} />
                                </div>
                            </div>

                            {/* Location Fields - Only show for non-national elections */}
                            {showLocationFields && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-xl border border-amber-200 dark:border-amber-800">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Info size={18} className="text-amber-600" />
                                        <h4 className="font-bold text-amber-800 dark:text-amber-300">Candidate Location Assignment</h4>
                                    </div>
                                    <p className="text-sm text-amber-700 dark:text-amber-400 mb-4">
                                        This candidate will only be shown to voters from the selected location.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">State *</label>
                                            <select
                                                className="input-standard"
                                                value={form.state}
                                                onChange={e => setForm({ ...form, state: e.target.value, district: '' })}
                                            >
                                                <option value="">-- Select State --</option>
                                                {Object.keys(INDIAN_STATES_DISTRICTS).map(state => (
                                                    <option key={state} value={state}>{state}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {requireDistrict && (
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">District *</label>
                                                <select
                                                    className="input-standard"
                                                    value={form.district}
                                                    onChange={e => setForm({ ...form, district: e.target.value })}
                                                    disabled={!form.state}
                                                >
                                                    <option value="">-- Select District --</option>
                                                    {districtsForState.map(d => (
                                                        <option key={d} value={d}>{d}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bio / Manifesto</label>
                                <textarea rows={3} className="input-standard" placeholder="Short description..." value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-pointer relative">
                                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => setCandidateImg(e.target.files?.[0] || null)} />
                                    <Upload className="mx-auto text-slate-400 mb-2" />
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Upload Photo</p>
                                    {candidateImg && <p className="text-xs text-primary-600 mt-1">{candidateImg.name}</p>}
                                </div>
                                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-pointer relative">
                                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => setPartyImg(e.target.files?.[0] || null)} />
                                    <Upload className="mx-auto text-slate-400 mb-2" />
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Upload Party Symbol</p>
                                    {partyImg && <p className="text-xs text-primary-600 mt-1">{partyImg.name}</p>}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Existing Candidates Selection */}
                            {form.electionId && (
                                <div className="space-y-4">
                                    {/* Search */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            className="input-standard pl-10"
                                            placeholder="Search candidates by name or party..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    {/* Selection Counter */}
                                    {selectedExistingCandidates.length > 0 && (
                                        <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                                            <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                                                {selectedExistingCandidates.length} candidate(s) selected
                                            </p>
                                        </div>
                                    )}

                                    {/* Candidates List */}
                                    <div className="max-h-96 overflow-y-auto space-y-3">
                                        {availableCandidates.length === 0 ? (
                                            <div className="text-center py-12 text-slate-500">
                                                <Users size={48} className="mx-auto mb-3 text-slate-300" />
                                                <p className="font-medium">No available candidates found</p>
                                                <p className="text-sm mt-1">
                                                    {searchTerm ? 'Try a different search term' : 'All candidates are already in this election or create a new one'}
                                                </p>
                                            </div>
                                        ) : (
                                            availableCandidates.map(candidate => {
                                                const isSelected = selectedExistingCandidates.includes(candidate.id);
                                                return (
                                                    <div
                                                        key={candidate.id}
                                                        onClick={() => toggleCandidateSelection(candidate.id)}
                                                        className={`p-4 rounded-xl border-2 cursor-pointer transition relative ${isSelected
                                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                                : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <img
                                                                src={candidate.photoUrl || `https://ui-avatars.com/api/?name=${candidate.name.replace(' ', '+')}&background=random`}
                                                                alt={candidate.name}
                                                                className="w-16 h-16 rounded-full object-cover"
                                                            />
                                                            <div className="flex-1">
                                                                <h4 className="font-bold text-slate-800 dark:text-white capitalize">{candidate.name}</h4>
                                                                <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">{candidate.party}</p>
                                                                {candidate.age && <p className="text-xs text-slate-500">Age: {candidate.age}</p>}
                                                                {(candidate.state || candidate.district) && (
                                                                    <p className="text-xs text-slate-500 mt-1 capitalize">
                                                                        {candidate.district && `${candidate.district}, `}{candidate.state}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <img
                                                                    src={candidate.partySymbolUrl}
                                                                    alt="Party Symbol"
                                                                    className="w-12 h-12 object-contain"
                                                                />
                                                            </div>
                                                        </div>
                                                        {isSelected && (
                                                            <div className="absolute top-2 right-2 bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                                                ✓
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}

                            {!form.electionId && (
                                <div className="text-center py-12 text-slate-500">
                                    <Info size={48} className="mx-auto mb-3 text-slate-300" />
                                    <p className="font-medium">Select an election first</p>
                                    <p className="text-sm mt-1">Choose an election to see available candidates</p>
                                </div>
                            )}
                        </>
                    )}

                    <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
                        <button type="submit" disabled={loading} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary-500/30 transition flex items-center gap-2">
                            <Save size={18} /> {loading ? 'SAVING...' : mode === 'create' ? 'CREATE CANDIDATE' : `ADD ${selectedExistingCandidates.length > 0 ? selectedExistingCandidates.length : ''} TO ELECTION`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
