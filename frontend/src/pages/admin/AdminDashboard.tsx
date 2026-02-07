import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { coursesApi } from '../../services/api';
import {
    Search,
    LayoutGrid,
    Plus,
    X,
    Share2,
    LogOut,
    LayoutDashboard,
    List,
    Edit3,
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Courses');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newCourseName, setNewCourseName] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    // Fetch courses from API
    const { data: courses = [], isLoading } = useQuery({
        queryKey: ['admin-courses'],
        queryFn: () => coursesApi.list({ published_only: false }),
    });

    // Format duration from seconds to MM:SS
    const formatDuration = (seconds?: number) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleCreateCourse = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Creating course:', newCourseName);
        setIsCreateModalOpen(false);
        setNewCourseName('');
        navigate('/admin/course/create');
    };

    return (
        <div className="min-h-screen bg-[#FDFDFF] font-sans">
            {/* Header */}
            <header className="bg-white px-8 py-3 flex items-center justify-between border-b border-gray-100 sticky top-0 z-50">
                <div className="flex items-center gap-10">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/admin/dashboard')}>
                        <div className="bg-[#7E2259] p-1.5 rounded-lg">
                            <LayoutDashboard className="text-white w-5 h-5" />
                        </div>
                        <span className="text-xl font-bold text-[#2D2D2D]">Admin<span className="text-slate-400">Panel</span></span>
                    </div>

                    <nav className="flex items-center gap-2">
                        {['Courses', 'Reporting', 'Settings'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => {
                                    if (tab === 'Reporting') {
                                        navigate('/admin/reporting');
                                    } else if (tab === 'Settings') {
                                        navigate('/admin/settings');
                                    } else {
                                        setActiveTab(tab);
                                    }
                                }}
                                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab
                                    ? 'bg-[#7E2259] text-white shadow-lg shadow-[#7E2259]/20'
                                    : 'text-gray-500 hover:text-[#7E2259]'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-gray-900 leading-none">{user?.name || 'Admin User'}</p>
                                <p className="text-[10px] text-gray-500 font-medium">Administrator</p>
                            </div>
                            <img
                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
                                alt="Admin"
                                className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                            />
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Logout"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-8 py-10 relative">
                {/* Search and Toggle */}
                <div className="flex items-center justify-between mb-8 gap-4">
                    <div className="relative flex-1 max-w-lg">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search the course..."
                            className="w-full bg-white border-none rounded-xl pl-12 pr-4 py-3.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7E2259]/10 transition-all text-gray-600"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-0 bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-3 transition-colors ${viewMode === 'grid' ? 'bg-[#7E2259] text-white' : 'text-gray-400 hover:text-[#7E2259] hover:bg-gray-50'}`}
                        >
                            <LayoutGrid size={22} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-3 transition-colors ${viewMode === 'list' ? 'bg-[#7E2259] text-white' : 'text-gray-400 hover:text-[#7E2259] hover:bg-gray-50'}`}
                        >
                            <List size={22} />
                        </button>
                    </div>
                </div>

                {/* Course List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-[#7E2259] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : courses.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] p-20 text-center shadow-sm border border-gray-100">
                        <p className="text-gray-400 text-lg">No courses found. Create your first course to get started!</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())).map((course) => (
                            <div key={course.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group cursor-pointer" onClick={() => navigate(`/admin/courses/${course.id}/edit`)}>
                                <div className="aspect-video bg-gradient-to-br from-[#7E2259]/10 to-[#7E2259]/5 rounded-xl mb-4 flex items-center justify-center">
                                    {course.image_url ? (
                                        <img src={course.image_url} alt={course.title} className="w-full h-full object-cover rounded-xl" />
                                    ) : (
                                        <LayoutDashboard className="w-12 h-12 text-[#7E2259]/30" />
                                    )}
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-[#7E2259] transition-colors line-clamp-2">{course.title}</h3>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {course.published ? (
                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Published</span>
                                    ) : (
                                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">Draft</span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between text-sm text-gray-500">
                                    <span>{(course as any).enrolled_count || (course as any).enrollments_count || 0} enrolled</span>
                                    <span>{(course as any).lessons_count || course.total_lessons || 0} lessons</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {courses.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())).map((course) => (
                            <div key={course.id} className="bg-white rounded-[2.5rem] p-10 shadow-[0_4px_20px_-3px_rgba(0,0,0,0.03),0_10px_25px_-2px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col md:flex-row items-center justify-between relative group hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.08)] transition-all">
                                <div className="flex-1 w-full">
                                    <h3 className="text-2xl font-black text-[#2D2D2D] mb-6">{course.title}</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {course.category && (
                                            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#F8F1F6] text-[#7E2259] rounded-full text-xs font-black uppercase tracking-wider transition-colors hover:bg-[#F3E6F0] cursor-default">
                                                {course.category}
                                            </span>
                                        )}
                                        {course.difficulty && (
                                            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#F8F1F6] text-[#7E2259] rounded-full text-xs font-black uppercase tracking-wider transition-colors hover:bg-[#F3E6F0] cursor-default">
                                                {course.difficulty}
                                            </span>
                                        )}
                                        {course.published && (
                                            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#E7F7EF] text-[#22C55E] rounded-full text-xs font-black uppercase tracking-wider transition-colors cursor-default">
                                                PUBLISHED
                                            </span>
                                        )}
                                        {!course.published && (
                                            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FEF3E2] text-[#F59E0B] rounded-full text-xs font-black uppercase tracking-wider transition-colors cursor-default">
                                                DRAFT
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-12 lg:gap-24 px-8 md:px-16 w-full md:w-auto my-10 md:my-0">
                                    <div className="text-center group/stat">
                                        <div className="text-4xl font-black text-[#2D2D2D]">{course.enrolled_count || 0}</div>
                                        <div className="text-[11px] font-black text-[#B0BCC7] uppercase tracking-[0.2em] mt-2 group-hover/stat:text-[#7E2259] transition-colors">Enrolled</div>
                                    </div>
                                    <div className="text-center group/stat border-x border-gray-100 px-12 lg:px-24">
                                        <div className="text-4xl font-black text-[#2D2D2D]">{course.lessons_count || 0}</div>
                                        <div className="text-[11px] font-black text-[#B0BCC7] uppercase tracking-[0.2em] mt-2 group-hover/stat:text-[#7E2259] transition-colors">Lessons</div>
                                    </div>
                                    <div className="text-center group/stat">
                                        <div className="text-4xl font-black text-[#2D2D2D]">{formatDuration(course.estimated_duration)}</div>
                                        <div className="text-[11px] font-black text-[#B0BCC7] uppercase tracking-[0.2em] mt-2 group-hover/stat:text-[#7E2259] transition-colors">Duration</div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center md:items-end gap-4 min-w-[160px] w-full md:w-auto">
                                    <div className="relative w-full flex justify-end items-center gap-3">
                                        <button className="p-3.5 text-gray-400 hover:text-[#7E2259] bg-white border border-gray-100 rounded-[1rem] transition-all hover:shadow-md">
                                            <Share2 size={20} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
                                        className="w-full bg-[#7E2259] text-white px-10 py-4 rounded-[1.25rem] font-black flex items-center justify-center gap-3 hover:bg-[#6D1F4D] active:scale-95 transition-all shadow-xl shadow-[#7E2259]/20 group/btn"
                                    >
                                        <Edit3 size={20} className="group-hover/btn:rotate-12 transition-transform" />
                                        Edit
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* FAB */}
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="fixed bottom-12 right-12 w-20 h-20 bg-[#7E2259] text-white rounded-full shadow-[0_15px_35px_-5px_rgba(126,34,89,0.4)] flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-40 group"
                    title="Add Course"
                >
                    <Plus size={40} strokeWidth={3} className="group-hover:rotate-180 transition-transform duration-500" />
                </button>

                {/* Create Course Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <div
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                            onClick={() => setIsCreateModalOpen(false)}
                        />
                        <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl relative z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
                            {/* Modal Header */}
                            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Create Course</h2>
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleCreateCourse} className="p-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label htmlFor="courseName" className="text-sm font-semibold text-gray-500">
                                            Course Name
                                        </label>
                                        <input
                                            id="courseName"
                                            type="text"
                                            autoFocus
                                            placeholder="Provide a name.. (Eg: Basics of Odoo CRM)"
                                            className="w-full bg-white border-2 border-primary-500/20 rounded-lg px-4 py-4 text-lg text-gray-700 outline-none focus:border-[#7E2259] transition-all"
                                            value={newCourseName}
                                            onChange={(e) => setNewCourseName(e.target.value)}
                                            required
                                        />
                                        <p className="text-sm text-gray-400 italic">
                                            Tip: Use a clear and concise title for your new course to help students find it easily.
                                        </p>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="mt-12 flex items-center justify-end gap-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-[#7E2259] text-white px-8 py-3.5 rounded-lg font-bold hover:bg-[#6D1F4D] transition-all shadow-lg shadow-[#7E2259]/20"
                                    >
                                        Create Course
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
