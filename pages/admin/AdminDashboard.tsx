
import React, { useMemo } from 'react';
import { useRealtime } from '../../contexts/RealtimeContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Users, UserCheck, Vote } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const AdminDashboard = () => {
  const { candidates, votes, voters, elections } = useRealtime();
  const { theme } = useTheme();

  // 1. KPIs
  // Determine relevant election (Active > Ended (latest) > None)
  const targetElection = useMemo(() => {
    const active = elections.find(e => e.status === 'ACTIVE');
    if (active) return active;

    // Sort ended elections by date descending
    const ended = elections
      .filter(e => e.status === 'ENDED')
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

    return ended[0] || null;
  }, [elections]);

  const filteredVotes = useMemo(() => {
    if (!targetElection) return [];
    return votes.filter(v => v.electionId === targetElection.id);
  }, [votes, targetElection]);

  const totalVoters = voters.length;
  const totalCandidates = candidates.length;
  const totalVotesCast = votes.length;
  const votesCastCount = targetElection ? filteredVotes.length : 0;

  const [showVotePercentage, setShowVotePercentage] = React.useState(false);

  // 2. Election Results
  const partyResults = useMemo(() => {
    const counts: Record<string, number> = {};
    candidates.forEach(c => {
      counts[c.party] = (counts[c.party] || 0) + c.votes;
    });
    return Object.keys(counts).map(party => ({
      name: party,
      votes: counts[party]
    }));
  }, [candidates]);

  // 3. Demographics
  const ageData = useMemo(() => [
    { name: '18-25', value: voters.filter(v => (v.age || 0) >= 18 && (v.age || 0) <= 25).length },
    { name: '26-35', value: voters.filter(v => (v.age || 0) > 25 && (v.age || 0) <= 35).length },
    { name: '36-50', value: voters.filter(v => (v.age || 0) > 35 && (v.age || 0) <= 50).length },
    { name: '50+', value: voters.filter(v => (v.age || 0) > 50).length },
  ], [voters]);

  const stateData = useMemo(() => {
    const counts: Record<string, number> = {};
    voters.forEach(v => {
      const state = v.address?.state || 'Unknown';
      counts[state] = (counts[state] || 0) + 1;
    });
    return Object.keys(counts).slice(0, 5).map(state => ({ name: state, value: counts[state] }));
  }, [voters]);

  const leaders = [...candidates].sort((a, b) => b.votes - a.votes).slice(0, 4);
  const upcomingElections = [...elections].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).slice(0, 3);

  const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'];
  const CHART_TEXT = theme === 'dark' ? '#94a3b8' : '#64748b';
  const CHART_BG = theme === 'dark' ? '#1e293b' : '#ffffff';

  return (
    <div className="space-y-6">

      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-wide">Admin Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome Administrator</p>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Total Voters"
          value={totalVoters}
          icon={<Users size={24} className="text-indigo-600 dark:text-indigo-400" />}
          color="bg-white dark:bg-slate-800 border-l-4 border-indigo-500"
        />
        <KPICard
          title="Total Candidates"
          value={totalCandidates}
          icon={<UserCheck size={24} className="text-emerald-600 dark:text-emerald-400" />}
          color="bg-white dark:bg-slate-800 border-l-4 border-emerald-500"
        />
        <div onDoubleClick={() => setShowVotePercentage(p => !p)} className="cursor-pointer select-none">
          <KPICard
            title={`Votes Cast ${targetElection ? `(${targetElection.status === 'ACTIVE' ? 'Live' : 'Last Ended'})` : ''}`}
            value={
              showVotePercentage
                ? `${totalVoters > 0 ? ((votesCastCount / totalVoters) * 100).toFixed(1) : 0}%`
                : `${votesCastCount} / ${totalVoters}`
            }
            icon={<Vote size={24} className="text-amber-600 dark:text-amber-400" />}
            color="bg-white dark:bg-slate-800 border-l-4 border-amber-500"
          />
        </div>
      </div>

      {/* Row 2: Election Results & Leaders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-slate-800 dark:text-white font-bold">Election Results</h3>
            {targetElection && targetElection.status === 'ACTIVE' && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">Live</span>
              </span>
            )}
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={partyResults}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: CHART_TEXT, fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: CHART_TEXT, fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: theme === 'dark' ? '#334155' : '#f1f5f9', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: CHART_BG, border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: theme === 'dark' ? '#fff' : '#1e293b' }}
                />
                <Bar
                  dataKey="votes"
                  fill="#6366f1"
                  barSize={40}
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={500}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leaders List */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-slate-800 dark:text-white font-bold mb-4">Current Leaders</h3>
          <div className="space-y-5">
            {leaders.map((candidate) => (
              <div key={candidate.id} className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block text-slate-700 dark:text-slate-200 capitalize">
                      {candidate.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-primary-600 dark:text-primary-400">
                      {candidate.votes} Votes
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-slate-100 dark:bg-slate-700">
                  <div style={{ width: `${(candidate.votes / (totalVotesCast || 1)) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500"></div>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 text-right">{candidate.party}</div>
              </div>
            ))}
            {leaders.length === 0 && <p className="text-slate-500 text-sm italic">No data available</p>}
          </div>
        </div>
      </div>

      {/* Row 3: Demographics & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Age Pie */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-slate-800 dark:text-white font-bold mb-4">Voters By Age</h3>
          <div className="h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: CHART_BG, borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: theme === 'dark' ? '#fff' : '#1e293b' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-800 dark:text-white">{totalVoters}</span>
            </div>
          </div>
          <div className="flex justify-center gap-4 text-xs text-slate-500 mt-2">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> 18-25</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-500"></span> 26+</span>
          </div>
        </div>

        {/* State Pie */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-slate-800 dark:text-white font-bold mb-4">Voters StateWise</h3>
          <div className="h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stateData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[COLORS.length - 1 - (index % COLORS.length)]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: CHART_BG, borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: theme === 'dark' ? '#fff' : '#1e293b' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center text-xs text-slate-500 mt-2">{stateData.length > 0 ? stateData[0].name : 'Undefined'}</div>
        </div>

        {/* Upcoming Elections */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-slate-800 dark:text-white font-bold mb-4">Upcoming Elections</h3>
          <div className="space-y-4">
            {upcomingElections.map(e => (
              <div key={e.id} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border-l-4 border-indigo-500">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{e.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">{new Date(e.startDate).toLocaleString()}</p>
              </div>
            ))}
            {upcomingElections.length === 0 && <p className="text-slate-500 text-sm">No upcoming elections.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon, color }: any) => (
  <div className={`${color} p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-32`}>
    <div className="flex justify-between items-start">
      {icon}
      <span className="text-3xl font-bold text-slate-800 dark:text-white">{value}</span>
    </div>
    <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</div>
  </div>
);
