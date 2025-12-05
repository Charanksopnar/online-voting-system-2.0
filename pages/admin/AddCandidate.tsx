
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRealtime } from '../../contexts/RealtimeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { supabase } from '../../supabase';
import { Upload, Save, ArrowLeft } from 'lucide-react';

export const AddCandidate = () => {
    const { addCandidate, elections } = useRealtime();
    const { addNotification } = useNotification();
    const navigate = useNavigate();

    const activeElections = elections.filter(e => e.status !== 'ENDED');

    const [form, setForm] = useState({ name: '', party: '', age: '', bio: '', electionId: '' });
    const [candidateImg, setCandidateImg] = useState<File | null>(null);
    const [partyImg, setPartyImg] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

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
        if (!partyImg) return addNotification('ERROR', 'Required', 'Upload Party Symbol');

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
                votes: 0
            });

            addNotification('SUCCESS', 'Success', 'Candidate Created');
            navigate('/candidate');
        } catch (err: any) {
            addNotification('ERROR', 'Error', err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen">
            <div className="mb-8 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition">
                    <ArrowLeft className="text-slate-600 dark:text-slate-400" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-wide">Create Candidate</h2>
                    <p className="text-sm text-slate-500">Add a new contestant to an election</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 rounded-2xl shadow-sm max-w-4xl">
                <form onSubmit={handleSubmit} className="space-y-8">

                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Election</label>
                        <select
                            className="input-standard"
                            value={form.electionId}
                            onChange={e => setForm({ ...form, electionId: e.target.value })}
                        >
                            <option value="">-- Select Active Election --</option>
                            {activeElections.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Candidate Name</label>
                            <input className="input-standard" placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
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

                    <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
                        <button type="submit" disabled={loading} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary-500/30 transition flex items-center gap-2">
                            <Save size={18} /> {loading ? 'SAVING...' : 'CREATE CANDIDATE'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
