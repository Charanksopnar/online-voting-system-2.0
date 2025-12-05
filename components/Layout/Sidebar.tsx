
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, UserCheck, Vote, PlusCircle, 
  Calendar, Bell, AlertTriangle, Map, FileText, Activity 
} from 'lucide-react';

export const Sidebar = () => {
  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/Admin' },
    { icon: <Users size={20} />, label: 'Manage Voters', path: '/Voters' },
    { icon: <UserCheck size={20} />, label: 'Candidates Info', path: '/candidate' },
    
    { type: 'divider', label: 'Pages' },
    { icon: <PlusCircle size={20} />, label: 'Add New Candidate', path: '/AddCandidate' },
    { icon: <PlusCircle size={20} />, label: 'Add New Election', path: '/AddElection' },
    { icon: <Calendar size={20} />, label: 'Calendar', path: '/calendar' },
    { icon: <Vote size={20} />, label: 'Upcoming Election', path: '/upcoming' },
    { icon: <Bell size={20} />, label: 'Notifications', path: '/admin/notifications' },
    { icon: <AlertTriangle size={20} />, label: 'Invalid Votes', path: '/invalidVotes' },

    { type: 'divider', label: 'Admin Config' },
    { icon: <Map size={20} />, label: 'Region Election', path: '/admin/region-election' },
    { icon: <FileText size={20} />, label: 'KYC Review', path: '/admin/kyc-review' },
    { icon: <Activity size={20} />, label: 'Audit Logs', path: '/admin/logs' },
  ];

  return (
    <div className="w-64 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col fixed left-0 top-0 overflow-y-auto z-50 transition-colors duration-200 shadow-sm">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/30">
          A
        </div>
        <span className="text-slate-800 dark:text-white font-bold text-xl tracking-wider">ADMINIS</span>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item, idx) => {
          if (item.type === 'divider') {
            return (
              <div key={idx} className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {item.label}
              </div>
            );
          }
          return (
            <NavLink
              key={idx}
              to={item.path || '#'}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}
              `}
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">SecureVote Admin v1.2</p>
        </div>
      </div>
    </div>
  );
};
