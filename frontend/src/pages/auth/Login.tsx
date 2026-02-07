import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  GraduationCap,
  Mail,
  Lock,
  ArrowRight,
  Moon,
  Info,
  ShieldCheck,
  Check
} from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const role = location.state?.role;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await login({ email, password });
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4 relative font-sans text-slate-800">
      {/* Theme Toggle */}
      <button className="absolute top-6 right-6 p-3 bg-white rounded-full shadow-md text-slate-400 hover:text-[#7E2259] hover:bg-slate-50 transition-all duration-300">
        <Moon size={20} />
      </button>

      {/* Main Content */}
      <div className="w-full max-w-4xl flex flex-col items-center z-10">

        {/* Header Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#7E2259] rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-[#7E2259]/20 transform hover:rotate-6 transition-transform duration-300">
            <GraduationCap size={32} color="white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
            {role === 'admin' ? 'Admin Sign In' : role === 'learner' ? 'Student Sign In' : 'Sign In to Your Account'}
          </h1>
          <p className="text-slate-500 font-medium">
            Welcome back to the Learning Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-[450px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 mb-8">
          <form className="space-y-6" onSubmit={handleSubmit}>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-[#7E2259] transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7E2259] focus:ring-4 focus:ring-[#7E2259]/10 transition-all duration-200 sm:text-sm"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-[#7E2259] transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7E2259] focus:ring-4 focus:ring-[#7E2259]/10 transition-all duration-200 sm:text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center">
                <label className="relative flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center transition-all duration-200 ${rememberMe
                    ? 'bg-[#7E2259] border-[#7E2259]'
                    : 'border-slate-300 group-hover:border-[#7E2259]'
                    }`}>
                    <Check size={12} className={`text-white transform transition-transform ${rememberMe ? 'scale-100' : 'scale-0'}`} strokeWidth={3} />
                  </div>
                  <span className="text-sm text-slate-600 font-medium group-hover:text-slate-800 transition-colors select-none">Remember me</span>
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-semibold text-[#7E2259] hover:text-[#601a44] transition-colors">
                  Forgot Password?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[#7E2259] hover:bg-[#601a44] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7E2259] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#7E2259]/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="flex items-center gap-2 uppercase tracking-wide">
                  Sign In <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>

            <div className="text-center pt-2">
              <Link to="/register" state={{ role }} className="text-sm text-slate-600 hover:text-slate-900 font-medium">
                Don't have an account? <span className="text-[#7E2259] font-bold hover:underline">Sign Up</span>
              </Link>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="w-full max-w-[600px] bg-[#FFF5F8] border border-[#FFE4EE] rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#7E2259] flex items-center justify-center mt-0.5">
              <Info size={14} className="text-white" />
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Log in with the <span className="font-semibold text-slate-800">Super User (Admin)</span> account to manage global website settings and course creation.
            </p>
          </div>
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#7E2259] flex items-center justify-center mt-0.5">
              <ShieldCheck size={14} className="text-white" />
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Admins can create internal users and define specific backend management permissions.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-12 text-xs font-semibold text-slate-400 tracking-widest uppercase">
          © 2024 E-Learning Platform Inc.
        </p>

      </div>
    </div>
  );
};

export default Login;