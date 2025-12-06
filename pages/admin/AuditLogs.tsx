
import React, { useState, useMemo } from 'react';
import { useRealtime } from '../../contexts/RealtimeContext';
import {
    Activity, Search, Filter, Calendar, User, Vote,
    UserCheck, Shield, AlertTriangle, Settings, Clock,
    ChevronDown
} from 'lucide-react';

// Simulated audit logs - in a real app these would come from the database
interface AuditLog {
    id: string;
    timestamp: string;
    action: string;
    category: 'VOTE' | 'USER' | 'ADMIN' | 'SYSTEM' | 'SECURITY';
    actor: string;
    details: string;
    ipAddress?: string;
}

export const AuditLogs = () => {
    const { votes, voters, elections, fraudAlerts, candidates } = useRealtime();
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [dateRange, setDateRange] = useState('all');

    // Generate audit logs from system data
    const auditLogs = useMemo((): AuditLog[] => {
        const logs: AuditLog[] = [];

        // Add vote logs
        votes.forEach(vote => {
            const voter = voters.find(v => v.id === vote.voterId);
            const election = elections.find(e => e.id === vote.electionId);
            const candidate = candidates.find(c => c.id === vote.candidateId);
            logs.push({
                id: `vote-${vote.id}`,
                timestamp: vote.timestamp,
                action: 'Vote Cast',
                category: 'VOTE',
                actor: voter ? `${voter.firstName} ${voter.lastName}` : 'Unknown Voter',
                details: `Voted for ${candidate?.name || 'Unknown'} in "${election?.title || 'Unknown Election'}"`,
            });
        });

        // Add fraud alerts as security logs
        fraudAlerts.forEach(alert => {
            const voter = voters.find(v => v.id === alert.voterId);
            logs.push({
                id: `fraud-${alert.id}`,
                timestamp: alert.timestamp,
                action: 'Security Alert',
                category: 'SECURITY',
                actor: voter ? `${voter.firstName} ${voter.lastName}` : 'System',
                details: `${alert.reason}: ${alert.details}`,
            });
        });

        // Add user registration logs
        voters.filter(v => v.created_at).forEach(voter => {
            logs.push({
                id: `reg-${voter.id}`,
                timestamp: voter.created_at!,
                action: 'User Registration',
                category: 'USER',
                actor: `${voter.firstName} ${voter.lastName}`,
                details: `Registered from ${voter.address?.state || 'Unknown'}, ${voter.address?.district || 'Unknown'}`,
            });
        });

        // Add verification status changes (simulated based on current status)
        voters.filter(v => v.verificationStatus === 'VERIFIED').forEach(voter => {
            logs.push({
                id: `verify-${voter.id}`,
                timestamp: voter.created_at || new Date().toISOString(),
                action: 'KYC Approved',
                category: 'ADMIN',
                actor: 'Admin',
                details: `Approved verification for ${voter.firstName} ${voter.lastName}`,
            });
        });

        // Add election creation logs
        elections.forEach(election => {
            logs.push({
                id: `election-${election.id}`,
                timestamp: new Date(election.startDate).toISOString(),
                action: 'Election Created',
                category: 'ADMIN',
                actor: 'Admin',
                details: `Created "${election.title}" (${election.region})`,
            });
        });

        // Sort by timestamp descending
        return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [votes, voters, elections, fraudAlerts, candidates]);

    // Filter logs
    const filteredLogs = useMemo(() => {
        return auditLogs.filter(log => {
            // Search filter
            if (search) {
                const searchLower = search.toLowerCase();
                if (!log.action.toLowerCase().includes(searchLower) &&
                    !log.actor.toLowerCase().includes(searchLower) &&
                    !log.details.toLowerCase().includes(searchLower)) {
                    return false;
                }
            }

            // Category filter
            if (filterCategory && log.category !== filterCategory) {
                return false;
            }

            // Date range filter
            if (dateRange !== 'all') {
                const logDate = new Date(log.timestamp);
                const now = new Date();
                if (dateRange === 'today') {
                    if (logDate.toDateString() !== now.toDateString()) return false;
                } else if (dateRange === 'week') {
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    if (logDate < weekAgo) return false;
                } else if (dateRange === 'month') {
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    if (logDate < monthAgo) return false;
                }
            }

            return true;
        });
    }, [auditLogs, search, filterCategory, dateRange]);

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'VOTE': return <Vote size={16} className="text-primary-500" />;
            case 'USER': return <User size={16} className="text-blue-500" />;
            case 'ADMIN': return <Settings size={16} className="text-purple-500" />;
            case 'SYSTEM': return <Activity size={16} className="text-slate-500" />;
            case 'SECURITY': return <AlertTriangle size={16} className="text-red-500" />;
            default: return <Activity size={16} />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'VOTE': return 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300';
            case 'USER': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'ADMIN': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
            case 'SYSTEM': return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
            case 'SECURITY': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-wide flex items-center gap-3">
                        <Activity className="text-primary-600" size={28} />
                        Audit Logs
                    </h2>
                    <p className="text-sm text-slate-500">Track all system activities and user actions</p>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <Clock size={16} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{filteredLogs.length} entries</span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
                    <Vote className="mx-auto text-primary-500 mb-2" size={24} />
                    <div className="text-2xl font-bold text-slate-800 dark:text-white">{auditLogs.filter(l => l.category === 'VOTE').length}</div>
                    <div className="text-xs text-slate-500 uppercase font-medium">Votes</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
                    <User className="mx-auto text-blue-500 mb-2" size={24} />
                    <div className="text-2xl font-bold text-slate-800 dark:text-white">{auditLogs.filter(l => l.category === 'USER').length}</div>
                    <div className="text-xs text-slate-500 uppercase font-medium">Users</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
                    <Settings className="mx-auto text-purple-500 mb-2" size={24} />
                    <div className="text-2xl font-bold text-slate-800 dark:text-white">{auditLogs.filter(l => l.category === 'ADMIN').length}</div>
                    <div className="text-xs text-slate-500 uppercase font-medium">Admin</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
                    <AlertTriangle className="mx-auto text-red-500 mb-2" size={24} />
                    <div className="text-2xl font-bold text-slate-800 dark:text-white">{auditLogs.filter(l => l.category === 'SECURITY').length}</div>
                    <div className="text-xs text-slate-500 uppercase font-medium">Security</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
                    <Activity className="mx-auto text-slate-500 mb-2" size={24} />
                    <div className="text-2xl font-bold text-slate-800 dark:text-white">{auditLogs.length}</div>
                    <div className="text-xs text-slate-500 uppercase font-medium">Total</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-6 border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="input-standard pl-10 w-full"
                    />
                </div>
                <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className="input-standard py-2.5 px-3 min-w-[140px]"
                >
                    <option value="">All Categories</option>
                    <option value="VOTE">Votes</option>
                    <option value="USER">Users</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SECURITY">Security</option>
                </select>
                <select
                    value={dateRange}
                    onChange={e => setDateRange(e.target.value)}
                    className="input-standard py-2.5 px-3 min-w-[130px]"
                >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                </select>
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-300 text-xs uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                                <th className="p-4">Timestamp</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Action</th>
                                <th className="p-4">Actor</th>
                                <th className="p-4">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                            {filteredLogs.slice(0, 50).map(log => (
                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                                    <td className="p-4">
                                        <div className="font-mono text-xs text-slate-600 dark:text-slate-400">
                                            {new Date(log.timestamp).toLocaleDateString()}
                                        </div>
                                        <div className="font-mono text-xs text-slate-400">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold ${getCategoryColor(log.category)}`}>
                                            {getCategoryIcon(log.category)}
                                            {log.category}
                                        </span>
                                    </td>
                                    <td className="p-4 font-medium text-slate-800 dark:text-white">{log.action}</td>
                                    <td className="p-4 text-slate-600 dark:text-slate-400">{log.actor}</td>
                                    <td className="p-4 text-slate-500 max-w-md truncate">{log.details}</td>
                                </tr>
                            ))}
                            {filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-500">
                                        <Activity size={48} className="mx-auto mb-4 text-slate-300" />
                                        <p className="font-medium">No audit logs found</p>
                                        <p className="text-sm mt-1">Adjust your filters to see more results</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 flex justify-between items-center text-xs text-slate-500 font-bold border-t border-slate-200 dark:border-slate-700">
                    <span>Showing {Math.min(50, filteredLogs.length)} of {filteredLogs.length} entries</span>
                    {filteredLogs.length > 50 && (
                        <span className="text-primary-600">Scroll for more or refine filters</span>
                    )}
                </div>
            </div>
        </div>
    );
};
