
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle, Fingerprint, Activity, Lock, Globe, Smartphone, Shield,
  ArrowRight, Github, Twitter, Linkedin, Mail, User, MessageSquare,
  ChevronDown, ChevronUp, Cpu, Languages, WifiOff, Mic, Glasses,
  Eye, Users, BarChart3, FileCheck, Zap, Clock
} from 'lucide-react';

// Custom ShieldCheck Icon
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

// Background images for hero slider
const heroBackgrounds = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
];

export const Home = () => {
  const [currentBg, setCurrentBg] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % heroBackgrounds.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors duration-200 font-sans">

      {/* Hero Section with Background Slider */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 transition-all duration-1000 ease-in-out"
          style={{ background: heroBackgrounds[currentBg] }}>
        </div>

        {/* Overlay with glassmorphism */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          {/* Large Logo */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <img
                src="/evote logo.png"
                alt="eVote Logo"
                className="w-40 h-40 md:w-56 md:h-56 object-contain drop-shadow-2xl animate-pulse"
                style={{ animationDuration: '3s' }}
              />
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl -z-10"></div>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white mb-6 tracking-tight drop-shadow-lg">
            SecureVote <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">AI</span>
          </h1>

          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
            Experience the future of democracy. Secure, transparent, and accessible voting powered by AI and biometric authentication.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/Signup" className="px-10 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-opacity-90 shadow-2xl transform transition hover:scale-105 hover:-translate-y-1 flex items-center justify-center gap-2">
              Register to Vote <ArrowRight size={20} />
            </Link>
            <Link to="/Login" className="px-10 py-4 bg-white/10 backdrop-blur-md text-white border-2 border-white/30 rounded-full font-bold text-lg hover:bg-white/20 shadow-xl transition flex items-center justify-center gap-2">
              Voter Login
            </Link>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown size={32} className="text-white/70" />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <div>
              <span className="text-primary-600 dark:text-primary-400 font-bold tracking-wider uppercase text-sm">About Us</span>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mt-3 mb-6">
                Welcome to the Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-500">Democracy</span>
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                SecureVote AI is a revolutionary online voting platform designed to make elections more secure, transparent, and accessible. Our cutting-edge technology combines biometric verification, AI-powered fraud detection, and end-to-end encryption to ensure every vote counts.
              </p>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                Built with the vision of empowering citizens worldwide, our platform enables verified voters to cast their ballots from anywhere, eliminating barriers while maintaining the highest security standards.
              </p>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Verified Security</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">100K+ Voters</span>
                </div>
              </div>
            </div>

            {/* Image/Illustration */}
            <div className="relative">
              <div className="bg-gradient-to-br from-primary-500 to-indigo-600 rounded-3xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 transform -rotate-3 hover:rotate-0 transition-transform duration-500 shadow-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                      <ShieldCheck size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-slate-900 dark:text-white">Secure Voting</h3>
                      <p className="text-slate-500 dark:text-slate-400">Military-grade encryption</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="text-slate-600 dark:text-slate-300">Biometric Verification</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="text-slate-600 dark:text-slate-300">Real-time Fraud Detection</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="text-slate-600 dark:text-slate-300">Instant Vote Confirmation</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-400 rounded-full opacity-20 blur-xl"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary-500 rounded-full opacity-20 blur-xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary-600 dark:text-primary-400 font-bold tracking-wider uppercase text-sm">Features</span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mt-3 mb-4">
              Why Choose SecureVote?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Our platform is built with cutting-edge technology to ensure your vote is secure, private, and counted.
            </p>
          </div>

          <div className="w-full space-y-6">
            <FeatureCard
              title="Maximum Security"
              description="256-bit AES encryption and multi-layer security protocols protect every vote from tampering."
            />
            <FeatureCard
              title="Universal Accessibility"
              description="Vote from anywhere in the world with our mobile-first, accessible platform for all abilities."
            />
            <FeatureCard
              title="Full Transparency"
              description="Immutable audit trails and real-time monitoring ensure complete election transparency."
            />
            <FeatureCard
              title="Real-time Results"
              description="Watch live vote counts and analytics as results come in with our dynamic dashboard."
            />
            <FeatureCard
              title="Biometric Auth"
              description="Advanced face recognition and liveness detection verify voter identity with 99.9% accuracy."
            />
            <FeatureCard
              title="Mobile First"
              description="Intuitive touch-first design optimized for smartphones and tablets for voting on-the-go."
            />
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary-600 dark:text-primary-400 font-bold tracking-wider uppercase text-sm">Our Team</span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mt-3 mb-4">
              Meet the Innovators
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              A dedicated team of experts committed to revolutionizing democratic participation.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <TeamCard
              name="Ravi M"
              role="Lead Developer & Architect"
              image="/teams/Ravi M.jpg"
              socials={{ github: "#", linkedin: "#", twitter: "#" }}
            />
            <TeamCard
              name="Charan"
              role="Backend Engineer"
              image="/teams/Charan.jpg"
              socials={{ github: "#", linkedin: "#", twitter: "#" }}
            />
            <TeamCard
              name="Harshitha K M"
              role="UI/UX Designer"
              image="/teams/Harshitha K M.jpg"
              socials={{ github: "#", linkedin: "#", twitter: "#" }}
            />
            <TeamCard
              name="Soundarya"
              role="Security Analyst"
              image="/teams/Soundarya.jpg"
              socials={{ github: "#", linkedin: "#", twitter: "#" }}
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary-600 dark:text-primary-400 font-bold tracking-wider uppercase text-sm">FAQ</span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mt-3 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Everything you need to know about SecureVote AI
            </p>
          </div>

          <div className="space-y-4">
            <FAQItem
              question="How does SecureVote verify my identity?"
              answer="SecureVote uses a multi-layer verification process including document verification (Aadhar/Voter ID), face recognition with liveness detection, and OTP verification. Your biometric data is encrypted and securely matched against your registered profile to ensure only you can cast your vote."
            />
            <FAQItem
              question="Is my vote anonymous and secure?"
              answer="Absolutely! Once verified, your vote is separated from your identity using cryptographic techniques. All votes are encrypted with 256-bit AES encryption and stored securely. Even system administrators cannot link a vote to a voter."
            />
            <FAQItem
              question="Can I vote from my mobile phone?"
              answer="Yes! SecureVote is designed mobile-first. You can register, verify your identity, and cast your vote entirely from your smartphone. Our platform works on all modern browsers and is optimized for both Android and iOS devices."
            />
            <FAQItem
              question="What happens if there's a technical issue while voting?"
              answer="Our system saves your progress at every step. If you face any technical issues, you can resume from where you left off. Your vote is only finalized when you see the confirmation screen, and you'll receive a unique receipt number for your records."
            />
            <FAQItem
              question="How can I verify my vote was counted correctly?"
              answer="After voting, you receive a unique encrypted vote receipt. You can use this receipt to verify your vote was included in the final tally without revealing your choice. Our transparent audit system allows independent verification of all election results."
            />
          </div>
        </div>
      </section>

      {/* Upcoming Features Section */}
      <section className="py-24 bg-gradient-to-br from-primary-600 via-indigo-600 to-purple-700 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="text-white/70 font-bold tracking-wider uppercase text-sm">Coming Soon</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-4">
              Upcoming Features
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              We're constantly innovating to bring you the most advanced voting experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <UpcomingCard
              icon={<Cpu className="w-7 h-7" />}
              title="Blockchain Integration"
              description="Immutable vote records on distributed ledger for ultimate transparency."
            />
            <UpcomingCard
              icon={<Activity className="w-7 h-7" />}
              title="AI Fraud Detection"
              description="Advanced machine learning to detect and prevent voting anomalies in real-time."
            />
            <UpcomingCard
              icon={<Languages className="w-7 h-7" />}
              title="Multi-language Support"
              description="Vote in your preferred language with support for 20+ regional languages."
            />
            <UpcomingCard
              icon={<WifiOff className="w-7 h-7" />}
              title="Offline Mode"
              description="Cast your vote even without internet, sync when connected."
            />
            <UpcomingCard
              icon={<Mic className="w-7 h-7" />}
              title="Voice Commands"
              description="Accessibility feature for hands-free voting using voice recognition."
            />
            <UpcomingCard
              icon={<Glasses className="w-7 h-7" />}
              title="AR Voting Guide"
              description="Augmented reality assistance for first-time voters and accessibility."
            />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-primary-600 dark:text-primary-400 font-bold tracking-wider uppercase text-sm">Contact</span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mt-3 mb-4">
              Get in Touch
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Have questions? We'd love to hear from you.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100 dark:border-slate-800">
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    <User className="w-4 h-4 inline mr-2" />Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />Email
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-2" />Message
                </label>
                <textarea
                  rows={4}
                  placeholder="How can we help you?"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold rounded-xl hover:from-primary-700 hover:to-indigo-700 shadow-lg shadow-primary-500/25 transform transition hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                Send Message <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-3 mb-4">
                <img src="/evote logo.png" alt="eVote" className="w-10 h-10 object-contain" />
                <span className="font-bold text-xl">SecureVote AI</span>
              </Link>
              <p className="text-slate-400 text-sm leading-relaxed">
                Empowering democracy with technology you can trust. Secure, transparent, and accessible voting for everyone.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-primary-400 transition">Features</a></li>
                <li><a href="#" className="hover:text-primary-400 transition">Security</a></li>
                <li><a href="#" className="hover:text-primary-400 transition">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-primary-400 transition">Documentation</a></li>
                <li><a href="#" className="hover:text-primary-400 transition">Help Center</a></li>
                <li><a href="#" className="hover:text-primary-400 transition">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Connect</h4>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition">
                  <Twitter size={18} />
                </a>
                <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition">
                  <Github size={18} />
                </a>
                <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition">
                  <Linkedin size={18} />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
            © 2024 SecureVote AI. All rights reserved. Made with ❤️ for democracy.
          </div>
        </div>
      </footer>
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ title, description }: {
  title: string,
  description: string
}) => (
  <div className="w-full py-4">
    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{description}</p>
  </div>
);

// Team Card Component
const TeamCard = ({ name, role, image, socials }: {
  name: string,
  role: string,
  image: string,
  socials: { github: string, linkedin: string, twitter: string }
}) => (
  <div className="group relative">
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 dark:border-slate-700 hover:-translate-y-2">
      {/* Profile Image */}
      <div className="relative w-32 h-32 mx-auto mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-indigo-500 rounded-full opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300"></div>
        <img
          src={image}
          alt={name}
          className="relative w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-xl"
        />
      </div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{name}</h3>
      <p className="text-primary-600 dark:text-primary-400 font-medium mb-4">{role}</p>

      {/* Social Links */}
      <div className="flex justify-center gap-3">
        <a href={socials.github} className="w-9 h-9 bg-slate-100 dark:bg-slate-700 hover:bg-primary-500 dark:hover:bg-primary-500 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-white transition">
          <Github size={16} />
        </a>
        <a href={socials.linkedin} className="w-9 h-9 bg-slate-100 dark:bg-slate-700 hover:bg-primary-500 dark:hover:bg-primary-500 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-white transition">
          <Linkedin size={16} />
        </a>
        <a href={socials.twitter} className="w-9 h-9 bg-slate-100 dark:bg-slate-700 hover:bg-primary-500 dark:hover:bg-primary-500 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-white transition">
          <Twitter size={16} />
        </a>
      </div>
    </div>
  </div>
);

// FAQ Accordion Component
const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between text-left"
      >
        <span className="font-semibold text-slate-900 dark:text-white pr-4">{question}</span>
        <div className={`flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
        <p className="px-6 pb-5 text-slate-600 dark:text-slate-300 leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
};

// Upcoming Feature Card Component
const UpcomingCard = ({ icon, title, description }: {
  icon: React.ReactNode,
  title: string,
  description: string
}) => (
  <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:-translate-y-1">
    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-white">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-white/70 text-sm leading-relaxed">{description}</p>
  </div>
);
