import React, { useState, useMemo } from 'react';
import { useRealtime } from '../../contexts/RealtimeContext';
import { INDIAN_STATES_DISTRICTS } from '../../data/indianStatesDistricts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Filter, UserCheck, Vote, Map, BarChart3, PieChart as PieIcon } from 'lucide-react';

export const AdminVisualizations = () => {
    const { voters, votes, elections } = useRealtime();
    const [filterState, setFilterState] = useState('');
    const [filterDistrict, setFilterDistrict] = useState('');
    const [chartType, setChartType] = useState<'BAR' | 'PIE' | 'LINE'>('BAR');
    const [metric, setMetric] = useState<'VOTERS_BY_STATE' | 'VOTE_STATUS' | 'VOTE_TREND'>('VOTERS_BY_STATE');

    const districtsForFilter = useMemo(() => {
        return filterState ? INDIAN_STATES_DISTRICTS[filterState] || [] : [];
    }, [filterState]);

    const handleStateFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilterState(e.target.value);
        setFilterDistrict('');
    };

    // Filter Data Logic
    const filteredVoters = useMemo(() => {
        return voters.filter(v => {
            if (v.role === 'ADMIN') return false;
            const matchesState = filterState ? v.address?.state === filterState : true;
            const matchesDistrict = filterDistrict ? v.address?.district === filterDistrict : true;
            return matchesState && matchesDistrict;
        });
    }, [voters, filterState, filterDistrict]);

    // Derived Data for Charts
    const chartData = useMemo(() => {
        if (metric === 'VOTERS_BY_STATE') {
            const counts: Record<string, number> = {};
            filteredVoters.forEach(v => {
                const key = filterState ? (v.address?.district || 'Unknown') : (v.address?.state || 'Unknown');
                counts[key] = (counts[key] || 0) + 1;
            });
            return Object.entries(counts)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value) // Sort desc
                .slice(0, 15); // Top 15
        }

        if (metric === 'VOTE_STATUS') {
            const stats = { Verified: 0, Pending: 0, Rejected: 0, Blocked: 0 };
            filteredVoters.forEach(v => {
                if (v.isBlocked) stats.Blocked++;
                else if (v.verificationStatus === 'VERIFIED') stats.Verified++;
                else if (v.verificationStatus === 'INVALID' || v.verificationStatus === 'REJECTED') stats.Rejected++;
                else stats.Pending++;
            });
            return [
                { name: 'Verified', value: stats.Verified, color: '#10B981' },
                { name: 'Pending', value: stats.Pending, color: '#F59E0B' },
                { name: 'Rejected', value: stats.Rejected, color: '#EF4444' },
                { name: 'Blocked', value: stats.Blocked, color: '#6B7280' },
            ].filter(d => d.value > 0);
        }

        if (metric === 'VOTE_TREND') {
            // Mock trend data or real if timestamps available
            // Grouping votes by time/date (using simplistic hour/day logic)
            const last7Days = [...Array(7)].map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return d.toISOString().split('T')[0];
            });

            return last7Days.map(date => ({
                name: date,
                votes: Math.floor(Math.random() * 50) + 10 // Placeholder for real vote timestamp data
            }));
        }

        return [];
    }, [filteredVoters, metric, filterState]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    return (
        <div className="min-h-screen space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <BarChart3 className="text-primary-600" /> Data Visualizations
                    </h2>
                    <p className="text-slate-500 text-sm">Analyze voter demographics and election trends</p>
                </div>

                {/* Filters Toolbar */}
                <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-slate-500 text-sm font-bold border-r pr-3 border-slate-200 dark:border-slate-700">
                        <Filter size={16} /> Filters
                    </div>

                    <select
                        value={filterState}
                        onChange={handleStateFilterChange}
                        className="input-select text-sm py-1.5"
                    >
                        <option value="">All States</option>
                        {Object.keys(INDIAN_STATES_DISTRICTS).map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>

                    <select
                        value={filterDistrict}
                        onChange={e => setFilterDistrict(e.target.value)}
                        disabled={!filterState}
                        className="input-select text-sm py-1.5 disabled:opacity-50"
                    >
                        <option value="">All Districts</option>
                        {districtsForFilter.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>

                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                    <select
                        value={metric}
                        onChange={(e: any) => setMetric(e.target.value)}
                        className="input-select text-sm py-1.5 font-medium text-primary-600 bg-primary-50 dark:bg-primary-900/20 border-primary-100"
                    >
                        <option value="VOTERS_BY_STATE">Voters per Region</option>
                        <option value="VOTE_STATUS">Demographic Status</option>
                        <option value="VOTE_TREND">Voting Trend</option>
                    </select>
                </div>
            </div>

            {/* Main Chart Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Primary Large Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 min-h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                            {metric === 'VOTERS_BY_STATE' && (filterState ? `Voters in ${filterState}` : 'Voters by State')}
                            {metric === 'VOTE_STATUS' && 'Voter Status Distribution'}
                            {metric === 'VOTE_TREND' && 'Voting Traffic (Last 7 Days)'}
                        </h3>
                        {/* Chart Type Toggles */}
                        {metric !== 'VOTE_TREND' && (
                            <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                                <button onClick={() => setChartType('BAR')} className={`p-1.5 rounded ${chartType === 'BAR' ? 'bg-white dark:bg-slate-600 shadow text-primary-600' : 'text-slate-500'}`}><BarChart3 size={16} /></button>
                                <button onClick={() => setChartType('PIE')} className={`p-1.5 rounded ${chartType === 'PIE' ? 'bg-white dark:bg-slate-600 shadow text-primary-600' : 'text-slate-500'}`}><PieIcon size={16} /></button>
                            </div>
                        )}
                    </div>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            {metric === 'VOTE_TREND' ? (
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Line type="monotone" dataKey="votes" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            ) : chartType === 'BAR' ? (
                                <BarChart data={chartData} layout={metric === 'VOTERS_BY_STATE' ? 'vertical' : 'horizontal'}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={metric !== 'VOTERS_BY_STATE'} vertical={metric === 'VOTERS_BY_STATE'} stroke="#e2e8f0" opacity={0.5} />
                                    {metric === 'VOTERS_BY_STATE' ? (
                                        <>
                                            <XAxis type="number" stroke="#94a3b8" fontSize={12} hide />
                                            <YAxis type="category" dataKey="name" width={100} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                        </>
                                    ) : (
                                        <>
                                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                                        </>
                                    )}
                                    <Tooltip cursor={{ fill: '#f1f5f9', opacity: 0.5 }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            ) : (
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Summary Cards Side Panel */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center gap-3 mb-2 opacity-90 text-sm font-medium uppercase tracking-wide">
                            <UserCheck size={18} /> Total Voters
                        </div>
                        <div className="text-4xl font-bold mb-1">{filteredVoters.length}</div>
                        <div className="text-white/80 text-sm flex items-center gap-1">
                            {filterState ? `in ${filterState}` : 'Across India'}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold text-slate-800 dark:text-white mb-4 text-sm uppercase text-opacity-70">Key Metrics</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 text-green-600 rounded-lg"><UserCheck size={16} /></div>
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Verified</span>
                                </div>
                                <span className="font-bold text-slate-800 dark:text-white">
                                    {filteredVoters.filter(v => v.verificationStatus === 'VERIFIED').length}
                                </span>
                            </div>

                            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Map size={16} /></div>
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Districts</span>
                                </div>
                                <span className="font-bold text-slate-800 dark:text-white">
                                    {new Set(filteredVoters.map(v => v.address?.district).filter(Boolean)).size}
                                </span>
                            </div>

                            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Vote size={16} /></div>
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Votes</span>
                                </div>
                                <span className="font-bold text-slate-800 dark:text-white">
                                    {votes.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
