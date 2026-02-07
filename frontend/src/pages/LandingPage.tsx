import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    GraduationCap,
    ArrowRight,
    Clock,
    Award,
    CheckCircle,
    Users,
    Building,
    Menu,
    X
} from 'lucide-react';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [authAction, setAuthAction] = useState<'login' | 'register'>('login');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleAuthClick = (action: 'login' | 'register') => {
        setAuthAction(action);
        setIsRoleModalOpen(true);
    };

    const handleRoleSelect = (role: 'learner' | 'admin') => {
        setIsRoleModalOpen(false);
        const path = authAction === 'login' ? '/login' : '/register';
        // Pass role in state so Login/Register pages can use it
        navigate(path, { state: { role } });
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-800">

            {/* Role Selection Modal */}
            {isRoleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full transform scale-100 transition-all">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-slate-900">Choose your role</h3>
                            <button
                                onClick={() => setIsRoleModalOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <p className="text-slate-500 mb-8">
                            Please select how you want to continue to LearnSphere.
                        </p>

                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => handleRoleSelect('learner')}
                                className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-[#7E2259] hover:bg-[#FDF2F8] group transition-all duration-200"
                            >
                                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-[#7E2259] transition-colors">
                                    <GraduationCap className="text-slate-500 group-hover:text-white transition-colors" size={24} />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-slate-900 group-hover:text-[#7E2259]">Student / Learner</div>
                                    <div className="text-xs text-slate-500">Access courses and track progress</div>
                                </div>
                                <ArrowRight className="ml-auto text-slate-300 group-hover:text-[#7E2259]" size={20} />
                            </button>

                            <button
                                onClick={() => handleRoleSelect('admin')}
                                className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-[#7E2259] hover:bg-[#FDF2F8] group transition-all duration-200"
                            >
                                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-[#7E2259] transition-colors">
                                    <Building className="text-slate-500 group-hover:text-white transition-colors" size={24} />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-slate-900 group-hover:text-[#7E2259]">Administrator</div>
                                    <div className="text-xs text-slate-500">Manage users and content</div>
                                </div>
                                <ArrowRight className="ml-auto text-slate-300 group-hover:text-[#7E2259]" size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-[#7E2259] p-2 rounded-lg">
                            <GraduationCap className="text-white w-6 h-6" />
                        </div>
                        <span className="text-xl font-bold text-[#7E2259] tracking-tight">Odoo Academy</span>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        <a href="#" className="text-sm font-semibold text-slate-600 hover:text-[#7E2259] transition-colors">Courses</a>
                        <a href="#" className="text-sm font-semibold text-slate-600 hover:text-[#7E2259] transition-colors">Pricing</a>
                        <a href="#" className="text-sm font-semibold text-slate-600 hover:text-[#7E2259] transition-colors">About</a>
                    </nav>

                    <div className="hidden md:flex items-center gap-4">
                        <button
                            onClick={() => handleAuthClick('login')}
                            className="text-sm font-bold text-slate-900 hover:text-[#7E2259] px-4 py-2"
                        >
                            Login
                        </button>
                        <button
                            onClick={() => handleAuthClick('register')}
                            className="bg-[#7E2259] text-white text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-[#601a44] transition-colors shadow-lg shadow-[#7E2259]/20"
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 text-slate-600"
                        >
                            <Menu size={24} />
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-slate-100 bg-white p-4 space-y-4 shadow-xl absolute w-full">
                        <a href="#" className="block text-sm font-semibold text-slate-600">Courses</a>
                        <a href="#" className="block text-sm font-semibold text-slate-600">Pricing</a>
                        <a href="#" className="block text-sm font-semibold text-slate-600">About</a>
                        <hr className="border-slate-100" />
                        <button
                            onClick={() => handleAuthClick('login')}
                            className="block w-full text-left text-sm font-bold text-slate-900 py-2"
                        >
                            Login
                        </button>
                        <button
                            onClick={() => handleAuthClick('register')}
                            className="block w-full bg-[#7E2259] text-white text-center text-sm font-bold px-6 py-2.5 rounded-lg"
                        >
                            Sign Up
                        </button>
                    </div>
                )}
            </header>

            {/* Hero Section */}
            <section className="bg-[#FAFAFA] pt-12 pb-20 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <div className="lg:w-1/2 space-y-8">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#7E2259] leading-tight">
                                Master Your Future with Odoo Expert Courses
                            </h1>
                            <p className="text-lg text-slate-500 leading-relaxed max-w-lg">
                                Join thousands of professionals mastering Odoo through guided, expert-led paths. Learn the world's most popular open-source ERP system.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <button className="bg-[#7E2259] text-white font-bold px-8 py-4 rounded-xl shadow-xl shadow-[#7E2259]/20 hover:bg-[#601a44] transition-all hover:-translate-y-1">
                                    Get Started
                                </button>
                                <button className="bg-white text-[#7E2259] border-2 border-slate-200 font-bold px-8 py-4 rounded-xl hover:border-[#7E2259] transition-all">
                                    Browse Catalog
                                </button>
                            </div>
                        </div>

                        <div className="lg:w-1/2 relative">
                            {/* Hero Visual Mockup */}
                            <div className="relative bg-[#BDC6CC] rounded-3xl p-4 overflow-hidden shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                                <div className="aspect-[4/3] flex items-center justify-center bg-slate-200 rounded-2xl overflow-hidden relative">
                                    {/* Abstract representation of person with tablet */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-300 to-slate-100 flex items-center justify-center">
                                        <Users size={120} className="text-slate-400 opacity-20" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Choose Section */}
            <section className="bg-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-16">
                        <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Why Choose Our Platform?</h2>
                        <p className="text-slate-500 max-w-2xl">
                            We provide the tools and expertise you need to excel in the Odoo ecosystem with high-quality content.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-[#FAFAFA] p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300">
                            <div className="w-12 h-12 bg-[#7E2259]/10 rounded-xl flex items-center justify-center mb-6">
                                <Clock className="text-[#7E2259]" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Self-Paced Learning</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Study on your own schedule with lifetime access to materials and downloadable resources.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-[#FAFAFA] p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300">
                            <div className="w-12 h-12 bg-[#7E2259]/10 rounded-xl flex items-center justify-center mb-6">
                                <Award className="text-[#7E2259]" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Expert Instructors</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Learn from Odoo-certified professionals with over 10 years of real-world implementation experience.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-[#FAFAFA] p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300">
                            <div className="w-12 h-12 bg-[#7E2259]/10 rounded-xl flex items-center justify-center mb-6">
                                <CheckCircle className="text-[#7E2259]" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Earn Certificates</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Get recognized for your new skills with industry-standard certification upon course completion.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Popular Courses */}
            <section className="bg-[#FAFAFA] py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Popular Courses</h2>
                            <p className="text-slate-500">Join 50,000+ students in our top-rated modules</p>
                        </div>
                        <a href="#" className="hidden sm:flex items-center text-[#7E2259] font-bold text-sm hover:underline">
                            View all courses <ArrowRight size={16} className="ml-2" />
                        </a>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Course Card 1 */}
                        <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
                            <div className="h-48 bg-[#0F172A] relative flex items-center justify-center p-6 text-center text-white overflow-hidden">
                                <div className="absolute inset-0 bg-blue-900/20"></div>
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold uppercase tracking-wider mb-2">CRM Course</h3>
                                    <div className="flex justify-center gap-4 mt-2">
                                        <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center"><Building size={14} /></div>
                                        <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center"><Users size={14} /></div>
                                    </div>
                                </div>
                                <span className="absolute top-4 left-4 bg-white text-slate-900 text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-sm">Business</span>
                            </div>
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Basics of Odoo CRM</h3>
                                <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                                    Introductory course for sales teams to master lead generation and customer pipelines.
                                </p>
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-[#7E2259] font-bold">$49.99</span>
                                    <button className="bg-[#7E2259] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#601a44] transition-colors">
                                        View Course
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Course Card 2 */}
                        <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
                            <div className="h-48 bg-[#A7F3D0] relative flex items-center justify-center p-6 text-center overflow-hidden">
                                <div className="text-emerald-900 relative z-10">
                                    <h3 className="text-xl font-bold uppercase tracking-wider mb-4">Logistics</h3>
                                    <div className="w-20 h-1 bg-emerald-900/20 mx-auto rounded-full"></div>
                                </div>
                                <span className="absolute top-4 left-4 bg-white text-slate-900 text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-sm">Logistics</span>
                            </div>
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Advanced Inventory</h3>
                                <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                                    Deep dive into supply chain logic, multi-warehouse routing, and barcoding automation.
                                </p>
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-[#7E2259] font-bold">$89.99</span>
                                    <button className="bg-[#7E2259] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#601a44] transition-colors">
                                        View Course
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Course Card 3 */}
                        <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
                            <div className="h-48 bg-[#E0F2FE] relative flex items-center justify-center p-6 text-center overflow-hidden">
                                <div className="text-sky-900 relative z-10">
                                    <h3 className="text-xl font-bold uppercase tracking-wider mb-2">Accounting Course</h3>
                                    <p className="text-xs opacity-70">A PREMIUM TICKET</p>
                                </div>
                                <span className="absolute top-4 left-4 bg-white text-slate-900 text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-sm">Finance</span>
                            </div>
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Accounting with Odoo</h3>
                                <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                                    Master financial workflows, automated bank reconciliation, and localized tax reports.
                                </p>
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-[#7E2259] font-bold">$74.99</span>
                                    <button className="bg-[#7E2259] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#601a44] transition-colors">
                                        View Course
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto bg-[#7E2259] rounded-[2rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
                    <div className="relative z-10 space-y-6">
                        <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
                            Ready to accelerate your <br /> Odoo career?
                        </h2>
                        <p className="text-white/80 text-lg max-w-2xl mx-auto">
                            Join our community of professionals and start your learning journey today with a 7-day free trial.
                        </p>
                        <button className="bg-white text-[#7E2259] font-bold px-8 py-4 rounded-xl shadow-lg hover:bg-slate-50 transition-all hover:-translate-y-1 mt-4">
                            Start Free Trial
                        </button>
                    </div>

                    {/* Decorative circles */}
                    <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white pt-20 pb-10 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="bg-[#7E2259] p-1.5 rounded-lg">
                                    <GraduationCap className="text-white w-4 h-4" />
                                </div>
                                <span className="text-lg font-bold text-[#7E2259]">Odoo Academy</span>
                            </div>
                            <p className="text-slate-500 text-sm leading-relaxed mb-6">
                                Empowering the next generation of Odoo experts through high-quality, accessible education.
                            </p>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-[#7E2259] hover:text-white transition-colors cursor-pointer">
                                    <Users size={16} />
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-[#7E2259] hover:text-white transition-colors cursor-pointer">
                                    <Building size={16} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-slate-900 mb-4">Quick Links</h4>
                            <ul className="space-y-3 text-sm text-slate-500">
                                <li><a href="#" className="hover:text-[#7E2259]">All Courses</a></li>
                                <li><a href="#" className="hover:text-[#7E2259]">Learning Paths</a></li>
                                <li><a href="#" className="hover:text-[#7E2259]">Certifications</a></li>
                                <li><a href="#" className="hover:text-[#7E2259]">Instructors</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-slate-900 mb-4">Support</h4>
                            <ul className="space-y-3 text-sm text-slate-500">
                                <li><a href="#" className="hover:text-[#7E2259]">Help Center</a></li>
                                <li><a href="#" className="hover:text-[#7E2259]">Community Forum</a></li>
                                <li><a href="#" className="hover:text-[#7E2259]">Contact Support</a></li>
                                <li><a href="#" className="hover:text-[#7E2259]">Pricing FAQ</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-slate-900 mb-4">Contact Info</h4>
                            <ul className="space-y-3 text-sm text-slate-500">
                                <li className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#7E2259]"></div>
                                    hello@odooacademy.com
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#7E2259] mt-1.5 flex-shrink-0"></div>
                                    <span>123 Tech Square, San Francisco</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-xs text-slate-400">
                            © 2024 Odoo Academy. All rights reserved.
                        </p>
                        <div className="flex gap-6 text-xs text-slate-400">
                            <a href="#" className="hover:text-slate-600">Privacy Policy</a>
                            <a href="#" className="hover:text-slate-600">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
