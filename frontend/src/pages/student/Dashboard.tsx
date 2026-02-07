import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Search,
  Moon,
  GraduationCap,
  Info,
  Star,
  LogOut
} from 'lucide-react';

// Mock Data for Courses matching the UI
const COURSES = [
  {
    id: 1,
    title: "Basics of Odoo CRM",
    description: "Master the fundamentals of CRM and learn how to manage customer relationships effectively using Odoo's powerful tools.",
    tags: ["SALES", "ERP"],
    imageColor: "bg-[#1E3A8A]", // Dark Blue
    imageText: "DATA ANALYTICS",
    imageSub: "COURELNEATNUCER", // Keeping the text from the image for fidelity
    buttonText: "Join Course",
    buttonStyle: "primary",
    price: null
  },
  {
    id: 2,
    title: "Digital Marketing Mastery",
    description: "Learn advanced SEO, SEM, and social media strategies to grow your brand and reach a wider audience.",
    tags: ["MARKETING", "STRATEGY"],
    imageColor: "bg-[#ADD8E6]", // Light Blue
    imageText: "MARKETING COURSE",
    imageSub: "GUIDEBOOK WORK",
    buttonText: "Continue",
    buttonStyle: "primary",
    price: null
  },
  {
    id: 3,
    title: "Advance course ...",
    description: "Take your Odoo skills to the next level with custom development and advanced configuration techniques.",
    tags: ["ADVANCED", "ADMIN"],
    imageColor: "bg-[#0EA5E9]", // Cyan
    imageText: "Nailural",
    imageSub: "SAIS & CEVORS",
    buttonText: "Buy Course",
    buttonStyle: "outline",
    price: "INR 500"
  }
];

// Mock Data for Badges matching the UI
const BADGES = [
  { name: "Newbie", points: 20, active: true },
  { name: "Explorer", points: 40, active: false },
  { name: "Achiever", points: 60, active: false },
  { name: "Specialist", points: 80, active: false },
  { name: "Expert", points: 100, active: false },
  { name: "Master", points: 120, active: false },
];

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Determine user display values (fallback to mockup data if needed/requested, but using real user for function)
  const displayName = user?.name || "Alex Johnson";
  const displayId = user?.id ? user.id.toString() : "29401";

  // Mock progress calculation
  const currentPoints = user?.total_points || 20; // Default to 20 to match UI
  const maxPoints = 120; // Based on 'Master' badge
  const progressPercentage = Math.min((currentPoints / maxPoints) * 100, 100);

  // Circle circumference: 2 * pi * r. r=88 => ~552.9
  const circleCircumference = 552.9;
  const strokeDashoffset = circleCircumference - (circleCircumference * (progressPercentage / 100));

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-800">
      {/* Header / Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-[#7E2259] p-1.5 rounded-lg transition-transform hover:scale-105">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-[#7E2259] tracking-tight">EduPlatform</span>
          </div>

          <div className="flex items-center gap-6">
            <button className="text-slate-400 hover:text-[#7E2259] transition-colors p-2 rounded-full hover:bg-slate-50">
              <Moon size={20} />
            </button>

            {/* User Profile Section */}
            <button
              onClick={logout}
              className="text-slate-400 hover:text-[#7E2259] transition-colors p-2 rounded-full hover:bg-slate-50"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-tight">{displayName}</p>
                <p className="text-xs text-slate-500">Student ID: #{displayId}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#7E2259]/10 border border-[#7E2259]/20 flex items-center justify-center text-[#7E2259] font-bold text-sm shadow-sm">
                {getInitials(displayName)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Top Controls: Title & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold text-slate-900">My Courses</h1>

          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7E2259] focus:ring-1 focus:ring-[#7E2259] transition-all shadow-sm hover:border-slate-300"
              placeholder="Search course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Courses Grid */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
            {COURSES.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())).map((course) => (
              <div key={course.id} className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group">

                {/* Visual Header Mockup */}
                <div className={`h-40 ${course.imageColor} relative p-6 flex flex-col items-center justify-center text-center text-white overflow-hidden`}>
                  {/* Subtle decorative background effect */}
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-300"></div>

                  <h3 className="text-2xl font-bold tracking-wider mb-1 uppercase drop-shadow-md relative z-10">{course.imageText}</h3>
                  <p className="text-[10px] tracking-[0.2em] opacity-80 uppercase relative z-10">{course.imageSub}</p>

                  {/* Decorative Elements */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-white/30 rounded-full"></div>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-[#7E2259] transition-colors">
                      {course.title}
                    </h3>
                    {course.price && <span className="text-[#7E2259] font-bold text-sm whitespace-nowrap ml-2">{course.price}</span>}
                  </div>

                  <p className="text-sm text-slate-500 mb-4 line-clamp-3 flex-grow leading-relaxed">
                    {course.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {course.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-1 bg-slate-50 text-slate-600 text-[10px] font-bold tracking-wider rounded-md uppercase border border-slate-100">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => navigate(`/student/course/${course.id}`)}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 ${course.buttonStyle === 'primary'
                      ? 'bg-[#7E2259] text-white hover:bg-[#601a44] shadow-md shadow-[#7E2259]/20 hover:shadow-[#7E2259]/30'
                      : 'bg-white text-[#7E2259] border-2 border-[#7E2259] hover:bg-[#7E2259] hover:text-white'
                      }`}>
                    {course.buttonText}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Profile Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 sticky top-24">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6">
                My Profile
              </h2>

              {/* Progress Circle Visual */}
              <div className="flex flex-col items-center mb-10 relative">
                <div className="relative w-48 h-48 flex items-center justify-center transform hover:scale-105 transition-transform duration-500 group">
                  {/* Background Circle */}
                  <svg className="w-full h-full transform -rotate-90 drop-shadow-sm">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="#F1F5F9"
                      strokeWidth="12"
                      fill="transparent"
                      strokeLinecap="round" // Smooth ends
                    />
                    {/* Progress Circle */}
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="#7E2259"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={circleCircumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>

                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">Total</span>
                    <span className="text-5xl font-extrabold text-slate-900 group-hover:text-[#7E2259] transition-colors">{currentPoints}</span>
                    <span className="text-sm font-medium text-slate-500 mt-1">Points</span>
                  </div>
                </div>

                <div className="mt-[-20px] bg-[#FDF2F8] text-[#7E2259] px-6 py-1.5 rounded-full text-sm font-bold shadow-sm z-10 border border-[#FBCFE8]">
                  Newbie
                </div>
              </div>

              {/* Badges List */}
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase">Badges</h3>
                  <Info size={14} className="text-slate-300 cursor-help hover:text-[#7E2259] transition-colors" />
                </div>

                <div className="space-y-3">
                  {BADGES.map((badge, idx) => (
                    <div
                      key={badge.name}
                      style={{ animationDelay: `${idx * 100}ms` }}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all ${badge.active
                        ? 'bg-[#FDF2F8] border border-[#FBCFE8] shadow-sm transform hover:scale-[1.02]'
                        : 'hover:bg-slate-50 border border-transparent hover:border-slate-100'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-full ${badge.active ? 'bg-[#7E2259] text-white' : 'bg-slate-200 text-slate-400'
                          }`}>
                          <Star size={14} fill={badge.active ? "currentColor" : "none"} />
                        </div>
                        <span className={`text-sm font-semibold ${badge.active ? 'text-[#7E2259]' : 'text-slate-500'
                          }`}>
                          {badge.name}
                        </span>
                      </div>
                      <span className={`text-xs font-medium ${badge.active ? 'text-[#7E2259]' : 'text-slate-400'
                        }`}>
                        {badge.points} Points
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center border-t border-slate-200 mt-8">
        <p className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
          © 2024 EduPlatform Inc. All rights reserved. Professional e-learning for everyone.
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;