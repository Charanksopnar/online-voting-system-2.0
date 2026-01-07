
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Shield, ArrowRight, Mail } from 'lucide-react';

export const Login = ({ adminMode = false }: { adminMode?: boolean }) => {
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const role = adminMode ? UserRole.ADMIN : UserRole.VOTER;
        setLoading(true);
        try {
            await signIn(email, password, role);
            navigate(adminMode ? '/Admin' : '/User');
        } catch (err: any) {
            setError('Login failed. Please check credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white dark:bg-slate-900 font-sans transition-colors duration-200">

            {/* Left Side: Art/Info (Hidden on Mobile) */}
            <div className={`hidden lg:flex lg:w-1/2 relative overflow-hidden ${adminMode ? 'bg-slate-900' : 'bg-primary-900'}`}>
                {/* Modern gradient background instead of external image */}
                <div className={`absolute inset-0 bg-gradient-to-br ${adminMode
                    ? 'from-slate-900 via-slate-800 to-slate-950'
                    : 'from-primary-900 via-primary-800 to-primary-950'
                    }`}></div>

                {/* Animated gradient overlay */}
                <div className="absolute inset-0 opacity-30">
                    <div className={`absolute inset-0 bg-gradient-to-tr ${adminMode
                        ? 'from-blue-500/20 via-transparent to-purple-500/20'
                        : 'from-primary-500/20 via-transparent to-primary-300/20'
                        } animate-pulse`} style={{ animationDuration: '4s' }}></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center px-16 text-white h-full">
                    <div className="mb-8">
                        <div className="bg-white/10 p-3 rounded-2xl w-fit backdrop-blur-md border border-white/20 shadow-xl">
                            {adminMode ? <Shield size={40} className="text-slate-300" /> : <Lock size={40} className="text-primary-300" />}
                        </div>
                    </div>
                    <h2 className="text-5xl font-bold mb-6 leading-tight">
                        {adminMode ? 'Secure Administration' : 'Democracy at your fingertips'}
                    </h2>
                    <p className="text-lg text-slate-300 max-w-md leading-relaxed">
                        {adminMode
                            ? 'Monitor elections, manage voters, and ensure the integrity of the process with our advanced dashboard.'
                            : 'Access your voter profile, verify your identity, and cast your vote securely from anywhere in the world.'
                        }
                    </p>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 bg-white dark:bg-slate-900">
                <div className="max-w-md w-full mx-auto">
                    <div className="mb-10">
                        <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
                            {adminMode ? 'Admin Portal' : 'Welcome Back'}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            Please enter your details to sign in.
                        </p>
                        {adminMode && (
                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                                <span className="font-bold">Note:</span> Use an email containing "admin" to access this portal.
                            </div>
                        )}
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="input-standard"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Password</label>
                                <input
                                    type="password"
                                    required
                                    className="input-standard"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-primary-500/30 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    Sign In <ArrowRight size={18} className="ml-2" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center space-y-4">
                        {adminMode ? (
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Not an admin? <Link to="/Login" className="font-bold text-primary-600 hover:text-primary-500">Voter Login</Link>
                            </p>
                        ) : (
                            <>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Don't have an account? <Link to="/Signup" className="font-bold text-primary-600 hover:text-primary-500">Create Account</Link>
                                </p>
                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <Link to="/AdminLogin" className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 uppercase tracking-widest">
                                        Admin Access
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
