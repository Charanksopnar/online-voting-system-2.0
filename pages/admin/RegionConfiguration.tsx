import React, { useState } from 'react';
import { useRealtime } from '../../contexts/RealtimeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Map, Plus, Save } from 'lucide-react';

export const RegionConfiguration = () => {
    const { regions, addRegion } = useRealtime();
    const { addNotification } = useNotification();
    const [newRegion, setNewRegion] = useState({ name: '', type: 'DISTRICT', parentId: '' });

    const states = regions.filter(r => r.type === 'STATE');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRegion.name) return;
        addRegion({
            id: Date.now().toString(),
            name: newRegion.name,
            type: newRegion.type as any,
            parentRegionId: newRegion.parentId,
            voterCount: 0
        });
        setNewRegion({ name: '', type: 'DISTRICT', parentId: '' });
        addNotification('SUCCESS', 'Region Added', 'New geographic region configured.');
    };

    return (
        <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen transition-colors duration-200">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Region Configuration</h1>
                <p className="text-gray-500 dark:text-gray-400">Manage electoral districts and constituencies.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 h-fit">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><Plus size={18} /> Add New Region</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Region Name</label>
                            <input className="w-full p-2 border dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white" value={newRegion.name} onChange={e => setNewRegion({ ...newRegion, name: e.target.value })} placeholder="e.g. North Zone" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                            <select className="w-full p-2 border dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white" value={newRegion.type} onChange={e => setNewRegion({ ...newRegion, type: e.target.value })}>
                                <option value="STATE">State</option>
                                <option value="DISTRICT">District</option>
                                <option value="CONSTITUENCY">Constituency</option>
                            </select>
                        </div>
                        {newRegion.type !== 'STATE' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parent Region (State)</label>
                                <select className="w-full p-2 border dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white" value={newRegion.parentId} onChange={e => setNewRegion({ ...newRegion, parentId: e.target.value })}>
                                    <option value="">Select State</option>
                                    {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        )}
                        <button type="submit" className="w-full bg-primary-600 text-white py-2 rounded-lg font-medium hover:bg-primary-700 flex justify-center items-center gap-2">
                            <Save size={16} /> Save Region
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50 font-medium text-gray-700 dark:text-gray-200">configured Regions</div>
                    <div className="p-4">
                        {regions.length === 0 ? <p className="text-gray-500">No regions configured.</p> : (
                            <div className="space-y-4">
                                {regions.map(region => (
                                    <div key={region.id} className="flex items-center justify-between p-3 border dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 rounded text-blue-600"><Map size={20} /></div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white">{region.name}</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{region.type} • ID: {region.id}</p>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            {region.parentRegionId ? `Parent: ${regions.find(r => r.id === region.parentRegionId)?.name || 'Unknown'}` : 'Top Level'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};