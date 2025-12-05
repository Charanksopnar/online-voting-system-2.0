
import React from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Search, Bell, Sun, Moon, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm transition-colors duration-200">
          {/* Search */}
          <div className="relative w-96 hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search data..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder-slate-400"
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary-600 transition"
            >
              {theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}
            </button>
            <button className="text-slate-500 dark:text-slate-400 hover:text-primary-600 transition relative">
              <Bell size={20}/>
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
            
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 dark:text-white">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Administrator</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold cursor-pointer hover:ring-4 hover:ring-primary-500/20 transition shadow-lg shadow-primary-500/20">
                {user?.firstName?.[0]}
              </div>
              <button onClick={handleSignOut} className="ml-2 text-slate-400 hover:text-red-500 transition">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
