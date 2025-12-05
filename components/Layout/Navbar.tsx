
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { UserRole } from '../../types';
import { ShieldCheck, LogOut, User, Menu, Sun, Moon } from 'lucide-react';

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path
    ? 'text-primary-600 dark:text-primary-400 font-bold'
    : 'text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400';

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-800 sticky top-0 z-40 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
              <div className="bg-primary-50 dark:bg-primary-900/20 p-1.5 rounded-lg group-hover:scale-105 transition-transform">
                <ShieldCheck className="h-7 w-7 text-primary-600 dark:text-primary-400" />
              </div>
              <span className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight">
                Secure<span className="text-primary-600 dark:text-primary-400">Vote</span>
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {!user && (
                <>
                  <Link to="/" className={isActive('/')}>Home</Link>
                  <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">Features</a>
                  <a href="#about" className="text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">About</a>
                </>
              )}
              {user && user.role === UserRole.VOTER && (
                <>
                  <Link to="/User" className={isActive('/User')}>Dashboard</Link>
                  <Link to="/notifications" className={isActive('/notifications')}>Notifications</Link>
                </>
              )}
              {user && user.role === UserRole.ADMIN && (
                <>
                  <Link to="/Admin" className={isActive('/Admin')}>Overview</Link>
                  <Link to="/Voters" className={isActive('/Voters')}>Voters</Link>
                  <Link to="/candidate" className={isActive('/candidate')}>Candidates</Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {!user ? (
              <div className="hidden md:flex items-center space-x-4">
                <Link to="/Login" className="text-gray-700 dark:text-gray-200 hover:text-primary-600 font-medium transition-colors">Log in</Link>
                <Link to="/Signup" className="bg-primary-600 text-white px-5 py-2 rounded-full font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-500/30">
                  Register Now
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/Edit" className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 overflow-hidden">
                    {(user.faceUrl || user.photoUrl) ? (
                      <img
                        src={user.faceUrl || user.photoUrl}
                        alt={user.firstName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <User className={`h-4 w-4 ${(user.faceUrl || user.photoUrl) ? 'hidden' : ''}`} />
                  </div>
                  <span className="hidden sm:inline font-medium">{user.firstName}</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-800 p-4 space-y-2 shadow-lg animate-fade-in-down">
          {!user && (
            <>
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="block py-2 text-gray-600 dark:text-gray-300 hover:text-primary-600">Home</Link>
              <Link to="/Login" onClick={() => setIsMenuOpen(false)} className="block py-2 text-gray-600 dark:text-gray-300 hover:text-primary-600">Log in</Link>
              <Link to="/Signup" onClick={() => setIsMenuOpen(false)} className="block py-2 text-primary-600 dark:text-primary-400 font-bold">Register Now</Link>
              <Link to="/AdminLogin" onClick={() => setIsMenuOpen(false)} className="block py-2 text-xs text-gray-400 uppercase tracking-widest">Admin Access</Link>
            </>
          )}
          {user && (
            <>
              <Link to={user.role === 'ADMIN' ? '/Admin' : '/User'} onClick={() => setIsMenuOpen(false)} className="block py-2 text-gray-600 dark:text-gray-300 font-medium">Dashboard</Link>
              <button onClick={handleSignOut} className="block w-full text-left py-2 text-red-600 dark:text-red-400">Sign Out</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};
