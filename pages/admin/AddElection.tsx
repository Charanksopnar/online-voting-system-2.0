
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRealtime } from '../../contexts/RealtimeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Play, Clock, StopCircle, RefreshCw, Trash2, Plus } from 'lucide-react';

export const AddElection = () => {
  const { addElection, elections, stopElection } = useRealtime();
  const { addNotification } = useNotification();
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ title: '', start: '', end: '', region: 'National' });

  const handleStop = (id: string) => {
      stopElection(id);
      addNotification('INFO', 'Stopped', 'Election stopped manually.');
  };

  const handleCreate = (e: React.FormEvent) => {
      e.preventDefault();
      addElection({
          id: Date.now().toString(),
          title: form.title,
          startDate: form.start,
          endDate: form.end,
          status: 'UPCOMING',
          region: form.region,
          description: '',
          candidates: []
      });
      setShowAddForm(false);
      addNotification('SUCCESS', 'Created', 'Election Scheduled');
  };

  return (
    <div className="min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-wide">Election Management</h2>
            <p className="text-sm text-slate-500">Schedule and monitor voting sessions</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-primary-500/30 transition flex items-center gap-2">
            {showAddForm ? 'Cancel' : <><Plus size={18}/> Schedule New</>}
        </button>
      </div>

      {showAddForm && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl mb-8 shadow-md">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 border-b pb-2 dark:border-slate-700">New Election Details</h3>
              <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Election Title</label>
                      <input required className="input-standard" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} placeholder="e.g. 2025 National General Assembly" />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Region Level</label>
                      <select className="input-standard" value={form.region} onChange={e=>setForm({...form, region: e.target.value})}>
                          <option value="National">National</option>
                          <option value="State">State</option>
                          <option value="District">District</option>
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                      <input required type="datetime-local" className="input-standard" value={form.start} onChange={e=>setForm({...form, start: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                      <input required type="datetime-local" className="input-standard" value={form.end} onChange={e=>setForm({...form, end: e.target.value})} />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                      <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition">CONFIRM SCHEDULE</button>
                  </div>
              </form>
          </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-300 text-xs uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-4">Election Name</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Timeline</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                {elections.map(ele => (
                    <tr key={ele.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                        <td className="p-4">
                            <div className="font-bold text-slate-800 dark:text-white">{ele.title}</div>
                            <div className="text-xs text-slate-500">{ele.region} Level</div>
                        </td>
                        <td className="p-4">
                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-600 w-fit">
                                <Clock size={14}/>
                                <span className="font-mono text-xs">{new Date(ele.startDate).toLocaleDateString()}</span>
                            </div>
                        </td>
                        <td className="p-4">
                            {ele.status === 'ACTIVE' && <div className="text-emerald-500 text-xs font-bold flex items-center gap-1"><Play size={12} fill="currentColor"/> IN PROGRESS</div>}
                            {ele.status === 'UPCOMING' && <div className="text-blue-500 text-xs font-bold flex items-center gap-1"><Clock size={12}/> SCHEDULED</div>}
                            {ele.status === 'ENDED' && <div className="text-slate-500 text-xs font-bold flex items-center gap-1"><StopCircle size={12}/> FINISHED</div>}
                        </td>
                        <td className="p-4">
                            <span className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                                ele.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                                ele.status === 'UPCOMING' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                            }`}>
                                {ele.status}
                            </span>
                        </td>
                        <td className="p-4">
                            <div className="flex gap-2">
                                {ele.status === 'ACTIVE' && (
                                    <button onClick={() => handleStop(ele.id)} className="bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded text-white text-xs font-bold shadow-sm">STOP</button>
                                )}
                                <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"><RefreshCw size={16}/></button>
                            </div>
                        </td>
                    </tr>
                ))}
                {elections.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No elections found.</td></tr>}
            </tbody>
        </table>
      </div>
    </div>
  );
};
