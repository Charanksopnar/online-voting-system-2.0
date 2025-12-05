
import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Fingerprint, Activity, Lock, Globe, Smartphone, Shield, ArrowRight, Github, Twitter, Linkedin } from 'lucide-react';

export const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors duration-200 font-sans">
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
             <div className="absolute -top-[30%] -right-[10%] w-[700px] h-[700px] rounded-full bg-primary-200/30 dark:bg-primary-900/20 blur-3xl opacity-60"></div>
             <div className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-indigo-200/30 dark:bg-indigo-900/20 blur-3xl opacity-50"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-sm font-semibold mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                </span>
                Next-Gen Democracy Technology
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6 leading-tight">
              Vote with <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-500 dark:from-primary-400 dark:to-indigo-400">
                Confidence
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Experience the future of voting. Secure biometric authentication, military-grade encryption, and real-time transparency powered by AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/Signup" className="px-8 py-4 bg-primary-600 text-white rounded-full font-bold hover:bg-primary-700 shadow-xl shadow-primary-500/20 transform transition hover:-translate-y-1 flex items-center justify-center gap-2">
                Register to Vote <ArrowRight size={18} />
              </Link>
              <Link to="/Login" className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-full font-bold hover:bg-slate-50 dark:hover:bg-slate-700 shadow-md transition">
                Voter Login
              </Link>
            </div>
          </div>

          <div className="lg:w-1/2 relative perspective-1000">
            <div className="relative z-10 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 p-8 transform rotate-y-6 rotate-z-2 hover:rotate-0 transition duration-500">
              <div className="flex items-center justify-between mb-6">
                 <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">National General Election</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Official Ballot • Secure Session</p>
                 </div>
                 <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck size={20} />
                 </div>
              </div>
              
              <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
                          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-600 mr-4"></div>
                          <div className="flex-1">
                              <div className="h-2.5 bg-slate-200 dark:bg-slate-600 rounded w-1/2 mb-2"></div>
                              <div className="h-2 bg-slate-100 dark:bg-slate-600 rounded w-1/4"></div>
                          </div>
                          <div className="h-5 w-5 rounded-full border-2 border-slate-300 dark:border-slate-500"></div>
                      </div>
                  ))}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> System Online
                  </div>
                  <span className="text-slate-400">ID: 8821-XCA</span>
              </div>
            </div>

            <div className="absolute top-4 -right-4 w-full h-full bg-primary-600 rounded-2xl -z-10 opacity-20 transform rotate-6"></div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                  <div>
                      <div className="text-4xl font-bold text-primary-400 mb-2">99.9%</div>
                      <div className="text-slate-400 text-sm">Uptime Reliability</div>
                  </div>
                  <div>
                      <div className="text-4xl font-bold text-primary-400 mb-2">&lt; 2s</div>
                      <div className="text-slate-400 text-sm">Verification Speed</div>
                  </div>
                  <div>
                      <div className="text-4xl font-bold text-primary-400 mb-2">256-bit</div>
                      <div className="text-slate-400 text-sm">AES Encryption</div>
                  </div>
                  <div>
                      <div className="text-4xl font-bold text-primary-400 mb-2">0</div>
                      <div className="text-slate-400 text-sm">Fraud Incidents</div>
                  </div>
              </div>
          </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary-600 dark:text-primary-400 font-bold tracking-wider uppercase text-sm">Technology</span>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">Why Trust SecureVote?</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Fingerprint className="w-8 h-8 text-primary-600 dark:text-primary-400" />}
              title="Biometric DNA"
              description="Advanced liveness detection ensures the person voting is physically present and matches their ID."
            />
            <FeatureCard 
              icon={<Activity className="w-8 h-8 text-primary-600 dark:text-primary-400" />}
              title="Behavioral Analysis"
              description="AI monitors session telemetry for anomalies like coercion patterns or bot activity."
            />
            <FeatureCard 
              icon={<Lock className="w-8 h-8 text-primary-600 dark:text-primary-400" />}
              title="End-to-End Encryption"
              description="Votes are sealed client-side. Only the final tally can be decrypted by the election commission."
            />
            <FeatureCard 
              icon={<Globe className="w-8 h-8 text-primary-600 dark:text-primary-400" />}
              title="Accessible Everywhere"
              description="Optimized for low-bandwidth connections and works on all modern devices."
            />
            <FeatureCard 
              icon={<Shield className="w-8 h-8 text-primary-600 dark:text-primary-400" />}
              title="Double Ledger"
              description="Every transaction is recorded on an immutable ledger for post-election audit."
            />
            <FeatureCard 
              icon={<Smartphone className="w-8 h-8 text-primary-600 dark:text-primary-400" />}
              title="Mobile First"
              description="Designed for the smartphone era with an intuitive touch-first interface."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                  <div className="col-span-2 md:col-span-1">
                      <Link to="/" className="flex items-center gap-2 mb-4">
                        <ShieldCheck size={24} className="text-primary-600 dark:text-primary-400" />
                        <span className="font-bold text-xl text-slate-900 dark:text-white">SecureVote</span>
                      </Link>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                          Empowering democracy with technology you can trust.
                      </p>
                  </div>
                  <div>
                      <h4 className="font-bold text-slate-900 dark:text-white mb-4">Platform</h4>
                      <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                          <li><a href="#" className="hover:text-primary-600">Features</a></li>
                          <li><a href="#" className="hover:text-primary-600">Security</a></li>
                          <li><a href="#" className="hover:text-primary-600">Roadmap</a></li>
                      </ul>
                  </div>
                  <div>
                      <h4 className="font-bold text-slate-900 dark:text-white mb-4">Resources</h4>
                      <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                          <li><a href="#" className="hover:text-primary-600">Documentation</a></li>
                          <li><a href="#" className="hover:text-primary-600">Help Center</a></li>
                          <li><a href="#" className="hover:text-primary-600">Privacy Policy</a></li>
                      </ul>
                  </div>
                  <div>
                      <h4 className="font-bold text-slate-900 dark:text-white mb-4">Connect</h4>
                      <div className="flex gap-4">
                          <a href="#" className="text-slate-400 hover:text-primary-600"><Twitter size={20} /></a>
                          <a href="#" className="text-slate-400 hover:text-primary-600"><Github size={20} /></a>
                          <a href="#" className="text-slate-400 hover:text-primary-600"><Linkedin size={20} /></a>
                      </div>
                  </div>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  © 2024 SecureVote AI. All rights reserved.
              </div>
          </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:shadow-xl transition-all duration-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group">
    <div className="mb-6 p-3 bg-white dark:bg-slate-900 rounded-xl inline-block shadow-sm group-hover:scale-110 transition-transform">{icon}</div>
    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{title}</h3>
    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{description}</p>
  </div>
);

const ShieldCheck = ({ size, className }: { size: number, className?: string }) => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
);
