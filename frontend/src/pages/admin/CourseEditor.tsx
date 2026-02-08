import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Image as ImageIcon,
    MoreVertical,
    Plus,
    X,
    List,
    GraduationCap,
    Bold,
    Italic,
    Underline,
    Link as LinkIcon,
    CheckCircle,
    ListOrdered,
    Moon,
    User,
    Lock,
    Search,
    ChevronDown,
    Circle,
    CheckCircle2,
    DollarSign,
    Shield,
    Menu
} from 'lucide-react';
import InvitationManager from '../../components/admin/InvitationManager';

const CourseEditor: React.FC = () => {
    const navigate = useNavigate();
    const { courseId } = useParams<{ courseId: string }>();
    const [activeTab, setActiveTab] = useState('Options');
    const [title, setTitle] = useState('Basics of Odoo CRM');
    const [tags] = useState(['ERP', 'CRM']);
    const [description, setDescription] = useState('This course covers the functional configuration of Odoo CRM, including lead management, opportunity workflows, pipeline stages, and activity scheduling. It also explains CRM reporting, automation rules, and integration with Sales for end-to-end process handling.');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Options Tab State
    const [accessShowTo, setAccessShowTo] = useState('Signed In');
    const [accessRule, setAccessRule] = useState('On Payment');
    const [price, setPrice] = useState('500');
    const [adminSearch, setAdminSearch] = useState('Mitchell Admin');

    const contents = [
        { id: 1, title: 'Advanced Sales & CRM Automation in Odoo', category: 'VIDEO' },
        { id: 2, title: 'Odoo CRM: Advanced Features & Best Practices', category: 'DOCUMENT' },
        { id: 3, title: 'Quiz', category: 'QUIZ' },
    ];

    return (
        <div className="min-h-screen bg-[#FDFDFF] font-sans flex flex-col">
            {/* Header */}
            <header className="bg-white px-4 sm:px-8 py-3 flex items-center justify-between border-b border-gray-100 sticky top-0 z-50">
                <div className="flex items-center gap-4 lg:gap-12">
                    <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => navigate('/admin/dashboard')}>
                        <div className="bg-[#7E2259] p-1.5 sm:p-2 rounded-lg sm:rounded-xl flex items-center justify-center">
                            <GraduationCap className="text-white" size={20} />
                        </div>
                        <span className="text-lg sm:text-xl font-black text-[#2D2D2D] tracking-tight">
                            Edu<span className="text-slate-800">Platform</span>
                        </span>
                    </div>

                    <nav className="hidden md:flex items-center gap-4 lg:gap-6">
                        {['Courses', 'Reporting', 'Settings'].map((tab) => (
                            <button
                                key={tab}
                                className={`px-4 lg:px-5 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'Courses' ? 'bg-[#FDF2F8] text-[#7E2259]' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                    <button className="hidden sm:block text-slate-400 hover:text-slate-600 transition-colors">
                        <Moon size={20} />
                    </button>
                    <div className="hidden sm:block w-10 h-10 rounded-full bg-[#E8EDF3] border-2 border-white shadow-sm overflow-hidden cursor-pointer">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mitchell" alt="Profile" />
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 text-gray-600"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-b border-gray-100 shadow-lg">
                    <nav className="p-4 space-y-2">
                        {['Courses', 'Reporting', 'Settings'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all ${tab === 'Courses' ? 'bg-[#FDF2F8] text-[#7E2259]' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>
            )}

            {/* Breadcrumb Action Bar */}
            <div className="bg-white border-b border-gray-100 px-4 sm:px-8 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <button className="bg-[#7E2259] text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm font-black flex items-center gap-2 shadow-lg shadow-[#7E2259]/20 hover:bg-[#6D1F4D] transition-all">
                        <Plus size={18} strokeWidth={3} />
                        <span className="hidden sm:inline">New Course</span>
                        <span className="sm:hidden">New</span>
                    </button>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto">
                    <button className="bg-white border border-[#B8D7FF] text-[#0066FF] px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-black hover:bg-blue-50 transition-all flex items-center gap-1 sm:gap-2 whitespace-nowrap">
                        <Shield size={14} className="sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Contact Attendees</span>
                        <span className="sm:hidden">Contact</span>
                    </button>
                    <button className="bg-white border border-[#B8D7FF] text-[#0066FF] px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-black hover:bg-blue-50 transition-all flex items-center gap-1 sm:gap-2 whitespace-nowrap">
                        <User size={14} className="sm:w-4 sm:h-4" />
                        Add Attendees
                    </button>
                </div>
            </div>

            <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex-1">
                <div className="bg-white rounded-2xl lg:rounded-[2rem] border border-gray-100 shadow-[0_8px_50px_rgba(0,0,0,0.02)] overflow-hidden">
                    <div className="p-4 sm:p-8 lg:p-12 space-y-8 lg:space-y-12">
                        {/* Course Info Section */}
                        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 lg:gap-16">
                            <div className="flex-1 w-full space-y-6 lg:space-y-10 order-2 lg:order-1">
                                <div className="space-y-3 sm:space-y-4">
                                    <label className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">Course Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-transparent text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 border-b-2 border-slate-50 focus:border-[#7E2259]/20 outline-none transition-all pb-3 sm:pb-4"
                                    />
                                </div>
                                <div className="space-y-3 sm:space-y-4">
                                    <label className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">Tags</label>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {tags.map((tag, i) => (
                                            <div key={i} className="bg-slate-50 text-slate-500 px-4 py-1.5 rounded-lg text-[11px] font-black border border-slate-100 flex items-center gap-2 group">
                                                {tag}
                                                <X size={12} className="cursor-pointer opacity-40 group-hover:opacity-100" />
                                            </div>
                                        ))}
                                        <input
                                            placeholder="Add tag..."
                                            className="bg-transparent border-none outline-none text-[13px] font-bold text-slate-300 placeholder-slate-200"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Course Image Wrapper */}
                            <div className="flex flex-col items-center gap-4 group order-1 lg:order-2 w-full lg:w-auto">
                                <div className="w-full max-w-[280px] sm:max-w-[320px] aspect-[1.4/1] bg-[#8FB3B0] rounded-2xl relative shadow-2xl shadow-[#8FB3B0]/30 overflow-hidden flex items-center justify-center mx-auto">
                                    <div className="w-24 sm:w-32 h-24 sm:h-32 bg-white rounded-full flex flex-col items-center justify-center text-center p-4">
                                        <GraduationCap className="text-[#8FB3B0]" size={32} />
                                        <p className="text-[8px] font-black text-[#8FB3B0] uppercase mt-2">Course Image</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-slate-400 transition-colors cursor-pointer">COURSE IMAGE</span>
                            </div>
                        </div>

                        {/* Tabs Grid */}
                        <div className="flex overflow-x-auto border-b border-gray-50 -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">
                            {['Content', 'Description', 'Options', 'Quiz'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-5 text-xs sm:text-sm font-black transition-all relative whitespace-nowrap ${activeTab === tab
                                        ? 'bg-[#7E2259] text-white rounded-t-xl sm:rounded-t-2xl shadow-[0_-10px_30px_rgba(126,34,89,0.1)]'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Tab Contents */}
                        <div className="pt-2 min-h-[400px] sm:min-h-[500px]">
                            {activeTab === 'Options' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {/* Access Card */}
                                    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 p-5 sm:p-8 lg:p-10 space-y-6 sm:space-y-10 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-[#FDF2F8] p-3 rounded-xl">
                                                <Lock className="text-[#7E2259]" size={20} />
                                            </div>
                                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Access course rights</h3>
                                        </div>

                                        <div className="space-y-8">
                                            <div className="space-y-3">
                                                <label className="text-sm font-bold text-slate-500 ml-1">Show course to:</label>
                                                <div className="relative">
                                                    <select
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 text-slate-700 font-bold outline-none appearance-none focus:border-[#7E2259]/20 transition-all"
                                                        value={accessShowTo}
                                                        onChange={(e) => setAccessShowTo(e.target.value)}
                                                    >
                                                        <option>Signed In</option>
                                                        <option>Everyone</option>
                                                        <option>Specific Group</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                                </div>
                                                <p className="text-[11px] font-medium text-slate-400 ml-1 leading-relaxed">Define who can access your courses and their content.</p>
                                            </div>

                                            <div className="space-y-6">
                                                <label className="text-sm font-bold text-slate-500 ml-1">Access rules:</label>
                                                <div className="space-y-4">
                                                    {[
                                                        { id: 'Open', label: 'Open' },
                                                        { id: 'On Invitation', label: 'On Invitation' },
                                                        { id: 'On Payment', label: 'On Payment' }
                                                    ].map((rule) => (
                                                        <label key={rule.id} className="flex items-center gap-4 cursor-pointer group w-fit">
                                                            <div className="relative flex items-center justify-center">
                                                                <input
                                                                    type="radio"
                                                                    className="sr-only"
                                                                    name="access"
                                                                    checked={accessRule === rule.id}
                                                                    onChange={() => setAccessRule(rule.id)}
                                                                />
                                                                {accessRule === rule.id ? (
                                                                    <CheckCircle2 className="text-[#7E2259]" size={22} />
                                                                ) : (
                                                                    <Circle className="text-slate-200 group-hover:text-slate-300 transition-colors" size={22} />
                                                                )}
                                                            </div>
                                                            <span className={`text-[15px] font-bold ${accessRule === rule.id ? 'text-slate-800' : 'text-slate-400'}`}>{rule.label}</span>
                                                        </label>
                                                    ))}
                                                </div>

                                                {accessRule === 'On Invitation' && courseId && (
                                                    <div className="ml-9 mt-4">
                                                        <InvitationManager courseId={parseInt(courseId)} />
                                                    </div>
                                                )}

                                                {accessRule === 'On Payment' && (
                                                    <div className="ml-9 space-y-4 animate-in slide-in-from-left-4 duration-300">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-sm font-bold text-slate-400">Price:</span>
                                                            <div className="flex-1 max-w-[200px] relative">
                                                                <input
                                                                    type="text"
                                                                    value={price}
                                                                    onChange={(e) => setPrice(e.target.value)}
                                                                    className="w-full bg-slate-50/50 border border-slate-100 rounded-xl pl-10 pr-6 py-3 text-slate-700 font-extrabold outline-none focus:border-[#7E2259]/20"
                                                                />
                                                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                                            </div>
                                                        </div>
                                                        <p className="text-[11px] font-bold text-slate-300 italic">User must pay to access the course.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Responsible Card */}
                                    <div className="flex flex-col gap-8">
                                        <div className="bg-white rounded-3xl border border-slate-100 p-10 space-y-10 shadow-sm flex-1">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-[#F0F7FF] p-3 rounded-xl">
                                                    <User className="text-[#0066FF]" size={20} />
                                                </div>
                                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Responsible</h3>
                                            </div>

                                            <div className="space-y-8">
                                                <div className="space-y-3">
                                                    <label className="text-sm font-bold text-slate-500 ml-1">Course Admin:</label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 text-slate-700 font-bold outline-none focus:border-[#0066FF]/20 transition-all"
                                                            value={adminSearch}
                                                            onChange={(e) => setAdminSearch(e.target.value)}
                                                        />
                                                        <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                                    </div>
                                                    <p className="text-[11px] font-medium text-slate-400 ml-1">Decide who'll be the responsible of the course.</p>
                                                </div>

                                                <div className="bg-[#F8F9FB] rounded-2xl p-6 flex items-center gap-5 border border-slate-100">
                                                    <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-[#7E2259] shadow-sm overflow-hidden border border-slate-50">
                                                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="font-black text-slate-800">Mitchell Admin</p>
                                                        <p className="text-xs font-bold text-slate-400">admin@example.com</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <button className="w-full bg-[#111827] text-white py-5 rounded-2xl font-black shadow-2xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                                            <Shield size={20} />
                                            Save Configuration
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Description' && (
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    <div className="flex items-center gap-8 pb-3 border-b border-gray-50">
                                        <div className="flex items-center gap-6">
                                            <button className="text-gray-900 font-black"><Bold size={18} /></button>
                                            <button className="text-gray-900 italic"><Italic size={18} /></button>
                                            <button className="text-gray-900 underline decoration-2"><Underline size={18} /></button>
                                        </div>
                                        <div className="w-px h-6 bg-gray-100" />
                                        <div className="flex items-center gap-6">
                                            <button className="text-gray-900"><List size={18} /></button>
                                            <button className="text-gray-900"><ListOrdered size={18} /></button>
                                        </div>
                                        <div className="w-px h-6 bg-gray-100" />
                                        <div className="flex items-center gap-6">
                                            <button className="text-gray-900"><LinkIcon size={18} /></button>
                                            <button className="text-gray-900"><ImageIcon size={18} /></button>
                                        </div>
                                    </div>
                                    <textarea
                                        className="w-full min-h-[400px] bg-transparent text-xl font-bold text-[#22C55E] outline-none border-none resize-none leading-relaxed"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                    <div className="flex items-center justify-between pt-6 border-t border-gray-50 text-[11px] font-bold text-gray-300">
                                        <div className="flex items-center gap-4">
                                            <span>Last saved: 2 minutes ago</span>
                                            <span>Characters: {description.length}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[#22C55E]">
                                            <CheckCircle size={14} />
                                            <span>All changes saved</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Content' && (
                                <div className="animate-in fade-in duration-500">
                                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-[#FDFDFF] border-b border-gray-100">
                                                <tr>
                                                    <th className="px-10 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Content title</th>
                                                    <th className="px-10 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                                                    <th className="px-10 py-5 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {contents.map((item) => (
                                                    <tr
                                                        key={item.id}
                                                        className="group hover:bg-gray-50/50 cursor-pointer"
                                                        onClick={() => navigate('/admin/course/content/edit')}
                                                    >
                                                        <td className="px-10 py-6 text-sm font-bold text-gray-700 italic">{item.title}</td>
                                                        <td className="px-10 py-6">
                                                            <span className="bg-[#F0F7FF] text-[#0066FF] px-4 py-1.5 rounded-md text-[10px] font-black tracking-widest uppercase">{item.category}</span>
                                                        </td>
                                                        <td className="px-10 py-6 text-right">
                                                            <button className="text-gray-300 hover:text-gray-500"><MoreVertical size={18} /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex justify-center pt-10">
                                        <button className="bg-[#7E2259] text-white px-12 py-4 rounded-xl font-black flex items-center gap-4 shadow-2xl shadow-[#7E2259]/20 hover:scale-105 transition-all">
                                            <Plus size={24} />
                                            Add content
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Quiz' && (
                                <div className="py-20 flex flex-col items-center justify-center text-center">
                                    <div className="w-20 h-20 bg-[#F8F1F6] rounded-3xl flex items-center justify-center mb-10 relative shadow-inner">
                                        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 transform -rotate-6">
                                            <div className="w-8 h-8 flex items-center justify-center border-2 border-[#7E2259] rounded-lg">
                                                <span className="text-[#7E2259] font-black text-sm">?</span>
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 bg-[#7E2259] w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                            <Plus size={14} className="text-white" />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate('/admin/course/quiz/new')}
                                        className="bg-[#7E2259] text-white px-12 py-4 rounded-xl font-black flex items-center gap-4 shadow-2xl shadow-[#7E2259]/30 hover:scale-105 transition-all mb-8 text-lg"
                                    >
                                        <Plus size={24} />
                                        Add Quiz
                                    </button>
                                    <p className="text-sm font-bold text-gray-400 max-w-sm leading-relaxed opacity-60">To add the quiz, click on 'Add Quiz' button to open the page and start adding questions.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Global Footer */}
            <footer className="bg-white border-t border-gray-100 px-10 py-8">
                <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-sm font-bold text-slate-400">© 2024 LearnSphere. All rights reserved.</p>
                    <div className="flex items-center gap-8 text-sm font-bold text-slate-400">
                        <a href="#" className="hover:text-[#7E2259] transition-colors">Documentation</a>
                        <a href="#" className="hover:text-[#7E2259] transition-colors">Support</a>
                        <a href="#" className="hover:text-[#7E2259] transition-colors">API Reference</a>
                    </div>
                </div>
            </footer>

            {/* Modal Utility */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsUploadModalOpen(false)} />
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden">
                        <div className="p-10 space-y-8">
                            <h3 className="text-xl font-bold text-gray-900">Upload Content</h3>
                            <div className="aspect-video border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-4 text-gray-300">
                                <Plus size={48} strokeWidth={1} />
                                <span className="text-sm font-bold">Select File</span>
                            </div>
                            <button className="w-full bg-[#7E2259] text-white py-4 rounded-xl font-black shadow-lg">Confirm Upload</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseEditor;
