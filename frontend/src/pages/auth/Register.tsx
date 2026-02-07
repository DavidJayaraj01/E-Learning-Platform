import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  GraduationCap,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Moon,
  ArrowLeft,
  RotateCcw
} from 'lucide-react';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const role = location.state?.role || 'learner';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match'); // Ideally replace with a UI error
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name,
        email,
        password,
        role: role as 'admin' | 'learner' | 'instructor'
      });

      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4 relative font-sans text-slate-800">
      {/* Theme Toggle */}
      <button className="absolute bottom-6 right-6 p-3 bg-white rounded-full shadow-md text-slate-900 border border-slate-200 hover:bg-slate-50 transition-all duration-300">
        <Moon size={20} />
      </button>

      {/* Main Content */}
      <div className="w-full max-w-4xl flex flex-col items-center z-10">

        {/* Header Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#7E2259] rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-[#7E2259]/20 transform hover:-rotate-6 transition-transform duration-300">
            <GraduationCap size={32} color="white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
            Create your account
          </h1>
          <p className="text-slate-500 font-medium">
            Join our e-learning community today
          </p>
        </div>

        {/* Register Card */}
        <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 mb-8">
          <form className="space-y-6" onSubmit={handleSubmit}>

            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700">
                Enter Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400 group-focus-within:text-[#7E2259] transition-colors" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  className="block w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7E2259] focus:ring-4 focus:ring-[#7E2259]/10 transition-all duration-200 sm:text-sm"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Enter Email Id
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-[#7E2259] transition-colors" />
                </div>
                <input
                  id="email"
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
                Enter Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-[#7E2259] transition-colors" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="block w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7E2259] focus:ring-4 focus:ring-[#7E2259]/10 transition-all duration-200 sm:text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#7E2259] transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Min 8 chars, incl. uppercase, lowercase & symbol.
              </p>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700">
                Re-Enter Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <RotateCcw className="h-5 w-5 text-slate-400 group-focus-within:text-[#7E2259] transition-colors" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7E2259] focus:ring-4 focus:ring-[#7E2259]/10 transition-all duration-200 sm:text-sm"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[#7E2259] hover:bg-[#601a44] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7E2259] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#7E2259]/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 tracking-widest uppercase"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Sign Up'
              )}
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="inline-flex items-center text-sm font-semibold text-[#7E2259] hover:text-[#601a44] transition-colors group">
                <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Login
              </Link>
            </div>
          </form>
        </div>

        {/* Footer Text */}
        <p className="text-xs text-slate-500 text-center max-w-sm leading-relaxed">
          By signing up, you agree to our <a href="#" className="underline hover:text-[#7E2259]">Terms of Service</a> and <a href="#" className="underline hover:text-[#7E2259]">Privacy Policy</a>.
        </p>

      </div>
    </div>
  );
};

export default Register;