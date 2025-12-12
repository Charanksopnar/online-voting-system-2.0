
import React, { useState, useMemo } from 'react';
import { useRealtime } from '../../contexts/RealtimeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Link } from 'react-router-dom';
import {
    Clock, MapPin, Users, Calendar, Play, Plus,
    ChevronRight, Filter, TrendingUp
} from 'lucide-react';
import { Election, Candidate } from '../../types';

const getCountdown = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diff = start.getTime() - now.getTime();

    if (diff <= 0) return 'Started';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
};

const getLocationDisplay = (e: Election) => {
    if (e.region === 'National') return 'National';
    if (e.region === 'State' && e.regionState) return e.regionState;
    if (e.region === 'District' && e.regionDistrict) return `${e.regionDistrict}, ${e.regionState}`;
    return e.region || 'Unknown';
};

const ElectionCard = ({ election, candidates }: { election: Election; candidates: Candidate[] }) => {
    const electionCandidates = candidates.filter(c => c.electionId === election.id);
    const totalVotes = electionCandidates.reduce((sum, c) => sum + (c.votes || 0), 0);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${election.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            election.status === 'UPCOMING' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                            }`}>
                            {election.status}
                        </span>
                        {election.status === 'ACTIVE' && (
                            <span className="flex items-center gap-1 text-emerald-500 text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Live
                            </span>
                        )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white capitalize">{election.title}</h3>
                </div>
                {/* Only show add candidate button for UPCOMING elections */}
                {election.status === 'UPCOMING' && (
                    <Link
                        to="/AddCandidate"
                        className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition"
                    >
                        <Plus size={18} />
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <MapPin size={14} className="text-primary-500" />
                    <span className="capitalize">{getLocationDisplay(election)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Users size={14} className="text-primary-500" />
                    {electionCandidates.length} Candidates
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Calendar size={14} className="text-primary-500" />
                    {new Date(election.startDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <TrendingUp size={14} className="text-primary-500" />
                    {totalVotes} Votes
                </div>
            </div>

            {election.status === 'UPCOMING' && (
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <Clock size={16} />
                        <span className="text-sm font-medium">Starts in</span>
                    </div>
                    <span className="font-bold text-blue-700 dark:text-blue-300">{getCountdown(election.startDate)}</span>
                </div>
            )}

            {election.status === 'ACTIVE' && electionCandidates.length > 0 && (
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-2">Leading Candidate</div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <img
                                src={electionCandidates.sort((a, b) => (b.votes || 0) - (a.votes || 0))[0]?.photoUrl ||
                                    `https://ui-avatars.com/api/?name=${electionCandidates[0]?.name.replace(' ', '+')}&background=random`}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover"
                            />
                            <div>
                                <div className="font-medium text-slate-800 dark:text-white text-sm capitalize">
                                    {electionCandidates.sort((a, b) => (b.votes || 0) - (a.votes || 0))[0]?.name}
                                </div>
                                <div className="text-xs text-slate-500 capitalize">
                                    {electionCandidates.sort((a, b) => (b.votes || 0) - (a.votes || 0))[0]?.party}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-primary-600">
                                {electionCandidates.sort((a, b) => (b.votes || 0) - (a.votes || 0))[0]?.votes}
                            </div>
                            <div className="text-xs text-slate-500">votes</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const UpcomingElections = () => {
    const { elections, candidates } = useRealtime();
    const [filterRegion, setFilterRegion] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Filter elections
    const filteredElections = useMemo(() => {
        return elections
            .filter(e => {
                if (filterStatus && e.status !== filterStatus) return false;
                if (filterRegion && e.region !== filterRegion) return false;
                return true;
            })
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }, [elections, filterRegion, filterStatus]);

    // Group by status
    const upcomingElections = filteredElections.filter(e => e.status === 'UPCOMING');
    const activeElections = filteredElections.filter(e => e.status === 'ACTIVE');
    const endedElections = filteredElections.filter(e => e.status === 'ENDED');

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-wide flex items-center gap-3">
                        <Calendar className="text-primary-600" size={28} />
                        Elections Overview
                    </h2>
                    <p className="text-sm text-slate-500">Monitor and manage all scheduled elections</p>
                </div>
                <Link to="/AddElection" className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-primary-500/30 transition flex items-center gap-2">
                    <Plus size={18} /> Schedule New
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-6 border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <Filter size={16} />
                    Filters:
                </div>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="input-standard py-2 px-3 text-sm min-w-[130px]"
                >
                    <option value="">All Status</option>
                    <option value="UPCOMING">Upcoming</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ENDED">Ended</option>
                </select>
                <select
                    value={filterRegion}
                    onChange={e => setFilterRegion(e.target.value)}
                    className="input-standard py-2 px-3 text-sm min-w-[130px]"
                >
                    <option value="">All Regions</option>
                    <option value="National">National</option>
                    <option value="State">State</option>
                    <option value="District">District</option>
                </select>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-emerald-100 text-sm font-medium">Active Now</div>
                            <div className="text-4xl font-bold mt-1">{activeElections.length}</div>
                        </div>
                        <Play size={40} className="text-emerald-300" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-blue-100 text-sm font-medium">Upcoming</div>
                            <div className="text-4xl font-bold mt-1">{upcomingElections.length}</div>
                        </div>
                        <Clock size={40} className="text-blue-300" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-slate-300 text-sm font-medium">Completed</div>
                            <div className="text-4xl font-bold mt-1">{endedElections.length}</div>
                        </div>
                        <Calendar size={40} className="text-slate-400" />
                    </div>
                </div>
            </div>

            {/* Active Elections */}
            {activeElections.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Active Elections
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeElections.map(e => <ElectionCard key={e.id} election={e} candidates={candidates} />)}
                    </div>
                </div>
            )}

            {/* Upcoming Elections */}
            {upcomingElections.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Clock size={18} className="text-blue-500" />
                        Upcoming Elections
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {upcomingElections.map(e => <ElectionCard key={e.id} election={e} candidates={candidates} />)}
                    </div>
                </div>
            )}

            {/* Ended Elections */}
            {endedElections.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Calendar size={18} className="text-slate-500" />
                        Past Elections
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {endedElections.slice(0, 6).map(e => <ElectionCard key={e.id} election={e} candidates={candidates} />)}
                    </div>
                </div>
            )}

            {filteredElections.length === 0 && (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400">No Elections Found</h3>
                    <p className="text-slate-500 mt-2">Adjust your filters or schedule a new election.</p>
                </div>
            )}
        </div>
    );
};
