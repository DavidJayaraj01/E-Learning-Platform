import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Search,
    Moon,
    GraduationCap,
    PlayCircle,
    FileText,
    HelpCircle,
    CheckCircle,
    List,
    Clock,
    ChevronLeft,
    Star,
    PenSquare,
    User,
    BookOpen,
    RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { coursesApi, lessonsApi, quizzesApi } from '../../services/api';
import type { Course, Lesson, Quiz } from '../../types/api';
import { toast } from 'sonner';

const CourseOverview: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { courseId } = useParams<{ courseId: string }>();
    
    const [course, setCourse] = useState<Course | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'content' | 'reviews'>('content');
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const loadCourseData = async () => {
            if (!courseId) return;
            
            try {
                setIsLoading(true);
                const [courseData, courseLessons, courseQuizzes] = await Promise.all([
                    coursesApi.get(parseInt(courseId)),
                    lessonsApi.getByCourse(parseInt(courseId)),
                    quizzesApi.getByCourse(parseInt(courseId))
                ]);
                
                setCourse(courseData);
                setLessons(courseLessons);
                setQuizzes(courseQuizzes);
                
                // Debug logging to check what content is loaded
                console.log('Course content loaded:', {
                    course: courseData?.title,
                    lessons: courseLessons?.length || 0,
                    quizzes: courseQuizzes?.length || 0,
                    lessonTitles: courseLessons?.map(l => l.title) || [],
                    quizTitles: courseQuizzes?.map(q => q.title) || []
                });
            } catch (error) {
                console.error('Failed to load course data:', error);
                toast.error('Failed to load course data');
            } finally {
                setIsLoading(false);
            }
        };

        loadCourseData();

        // Auto-refresh data when window gains focus (when user switches back to tab)
        const handleFocus = () => {
            loadCourseData();
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [courseId]);

    const refreshCourseData = async () => {
        if (!courseId) return;
        
        try {
            const [courseData, courseLessons, courseQuizzes] = await Promise.all([
                coursesApi.get(parseInt(courseId)),
                lessonsApi.getByCourse(parseInt(courseId)),
                quizzesApi.getByCourse(parseInt(courseId))
            ]);
            
            setCourse(courseData);
            setLessons(courseLessons);
            setQuizzes(courseQuizzes);
            
            // Debug logging for refresh
            console.log('Course content refreshed:', {
                course: courseData?.title,
                lessons: courseLessons?.length || 0,
                quizzes: courseQuizzes?.length || 0,
                lessonTitles: courseLessons?.map(l => l.title) || [],
                quizTitles: courseQuizzes?.map(q => q.title) || []
            });
            
            toast.success('Course content updated!');
        } catch (error) {
            console.error('Failed to refresh course data:', error);
            toast.error('Failed to refresh course data');
        }
    };

    const handleLessonClick = (lessonId: number) => {
        navigate(`/student/course/${courseId}/lesson/${lessonId}`);
    };

    const handleQuizClick = (quizId: number) => {
        navigate(`/student/course/${courseId}/quiz/${quizId}`);
    };

    const getContentIcon = (type: string) => {
        switch (type) {
            case 'VIDEO':
                return <PlayCircle className="w-5 h-5 text-blue-600" />;
            case 'DOCUMENT':
                return <FileText className="w-5 h-5 text-green-600" />;
            case 'IMAGE':
                return <FileText className="w-5 h-5 text-purple-600" />;
            default:
                return <BookOpen className="w-5 h-5 text-gray-600" />;
        }
    };

    // Combine lessons and quizzes into a single content array and sort by order
    const getAllContentItems = () => {
        const allItems = [
            ...lessons.map(lesson => ({
                ...lesson,
                type: 'lesson',
                contentType: lesson.type,
                duration: lesson.estimated_duration || 10,
                orderIndex: lesson.order_index || 0
            })),
            ...quizzes.map(quiz => ({
                ...quiz,
                type: 'quiz',
                contentType: 'QUIZ',
                duration: quiz.time_limit || 15,
                orderIndex: quiz.order_index || 1000 // Put quizzes after lessons by default
            }))
        ];

        // Sort by order index, then by creation date
        return allItems.sort((a, b) => {
            if (a.orderIndex !== b.orderIndex) {
                return a.orderIndex - b.orderIndex;
            }
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
    };

    const filteredContent = getAllContentItems().filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Course not found</h3>
                    <button 
                        onClick={() => navigate('/student/courses')}
                        className="text-purple-600 hover:text-purple-700"
                    >
                        Back to courses
                    </button>
                </div>
            </div>
        );
    }

    // Helper to get initials (reused from Dashboard)
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const displayName = user?.name || "Alex Johnson"; // Fallback to UI mockup name if no user

    const getIconForType = (type: string) => {
        switch (type) {
            case 'Video': return <PlayCircle size={14} className="mr-1" />;
            case 'Reading': return <FileText size={14} className="mr-1" />;
            case 'Quiz': return <HelpCircle size={14} className="mr-1" />;
            default: return <FileText size={14} className="mr-1" />;
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-800 pb-12">
            {/* Header (Consistent with Dashboard) */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/student/dashboard')}>
                        <div className="bg-[#7E2259] p-1.5 rounded-lg transition-transform hover:scale-105">
                            <GraduationCap className="text-white w-6 h-6" />
                        </div>
                        <span className="text-xl font-bold text-[#7E2259] tracking-tight">EduPlatform</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="text-slate-400 hover:text-[#7E2259] transition-colors p-2 rounded-full hover:bg-slate-50">
                            <Moon size={20} />
                        </button>
                        <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-900 leading-tight">{displayName}</p>
                                <p className="text-xs text-slate-500">Student ID: #{user?.id || '29401'}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-[#7E2259]/10 border border-[#7E2259]/20 flex items-center justify-center text-[#7E2259] font-bold text-sm shadow-sm cursor-pointer hover:bg-[#7E2259]/20 transition-colors">
                                {getInitials(displayName)}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

                {/* Breadcrumb / Back */}
                <button
                    onClick={() => navigate('/student/dashboard')}
                    className="flex items-center text-slate-500 hover:text-[#7E2259] transition-colors mb-6 text-sm font-medium"
                >
                    <ChevronLeft size={16} className="mr-1" />
                    Back to Dashboard
                </button>

                {/* Hero Section */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-8 relative overflow-hidden">
                    {/* Cover Background */}
                    <div className="h-48 md:h-64 rounded-2xl bg-[#9F85C5] overflow-hidden relative mb-20 md:mb-0">
                        {/* Abstract Cover Art Mockup */}
                        <div className="absolute inset-0 flex items-center justify-center text-slate-800/20 font-bold text-6xl tracking-widest select-none bg-gradient-to-r from-[#9F85C5] to-[#7f69a5]">
                            <div className="w-full h-full opacity-30 flex items-center justify-center">
                                COVER
                            </div>
                            {/* Decorative text from image */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center mix-blend-overlay">
                                <p className="text-2xl font-serif italic mb-2">Sor home work</p>
                                <p className="text-xs tracking-widest uppercase">Lorem ipsum dolor sit amet</p>
                            </div>
                        </div>
                    </div>

                    {/* Floating Course Info Card & Content - Flex Layout */}
                    <div className="flex flex-col md:flex-row gap-6 relative px-4">

                        {/* Thumbnail - Overlapping cover */}
                        <div className="md:-mt-12 z-10 flex-shrink-0 mx-auto md:mx-0">
                            <div className="w-32 h-32 md:w-40 md:h-40 bg-slate-50 rounded-2xl shadow-lg border-4 border-white flex items-center justify-center">
                                {/* Folder Icon Graphic Placeholder */}
                                <div className="relative w-20 h-16 bg-teal-400 rounded-lg shadow-sm">
                                    <div className="absolute -top-2 left-0 w-8 h-4 bg-teal-300 rounded-t-md"></div>
                                    <div className="absolute inset-0 bg-gradient-to-br from-teal-300 to-teal-500 rounded-lg flex items-center justify-center">
                                        <div className="w-8 h-8 rounded-full border-2 border-white/50"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Course Title & Desc */}
                        <div className="flex-grow pt-2 md:pt-4 text-center md:text-left">
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{course.title}</h1>
                            <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
                                {course.description}
                            </p>
                        </div>

                        {/* Progress Card (Right Side) */}
                        <div className="min-w-[280px] bg-white rounded-xl md:-mt-8 z-10 border border-slate-100 shadow-lg p-5 flex flex-col justify-center">
                            <div className="flex justify-between items-center text-sm font-bold text-slate-700 mb-2">
                                <span>0% Completed</span>
                                <span className="text-slate-400 font-normal text-xs">Keep going!</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-slate-100 rounded-full h-2.5 mb-6">
                                <div
                                    className="bg-[#7E2259] h-2.5 rounded-full transition-all duration-1000"
                                    style={{ width: '0%' }}
                                ></div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-100">
                                <div>
                                    <div className="text-xl font-bold text-slate-900">{lessons.length + quizzes.length}</div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Content</div>
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-green-600">0</div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Done</div>
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-slate-400">{lessons.length + quizzes.length}</div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">To Do</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs & Search */}
                <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-2 rounded-xl border border-slate-100 shadow-sm mb-6">
                    <div className="flex items-center gap-1 w-full sm:w-auto p-1 bg-slate-50/50 rounded-lg">
                        <button
                            onClick={() => setActiveTab('content')}
                            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'content'
                                ? 'bg-[#7E2259] text-white shadow-md shadow-[#7E2259]/20'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-white'
                                }`}
                        >
                            Course Content
                        </button>
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'reviews'
                                ? 'bg-[#7E2259] text-white shadow-md shadow-[#7E2259]/20'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-white'
                                }`}
                        >
                            Ratings and Reviews
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={refreshCourseData}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-[#7E2259] rounded-lg text-sm font-medium transition-colors border border-slate-200"
                            title="Refresh course content"
                        >
                            <RefreshCw size={16} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        
                        <div className="relative w-full sm:w-72">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#7E2259] focus:border-[#7E2259] transition-all"
                                placeholder="Search course content..."
                            />
                        </div>
                    </div>
                </div>

                {/* Content Section - All Course Content */}
                {activeTab === 'content' && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                            <List className="text-[#7E2259]" size={20} />
                            <h3 className="text-lg font-bold text-slate-900">{filteredContent.length} Items</h3>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {filteredContent.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    <BookOpen className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                                    <h3 className="text-lg font-medium text-slate-700 mb-2">No content available</h3>
                                    <p className="text-sm">This course doesn't have any lessons or quizzes yet.</p>
                                </div>
                            ) : (
                                filteredContent.map((item, index) => (
                                    <div
                                        key={`${item.type}-${item.id}`}
                                        onClick={() => item.type === 'lesson' ? handleLessonClick(item.id) : handleQuizClick(item.id)}
                                        className="p-5 hover:bg-slate-50 transition-colors group cursor-pointer flex items-center gap-4"
                                    >
                                        {/* Item Number */}
                                        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-slate-400 font-bold text-sm">
                                            {index + 1}
                                        </div>

                                        {/* Main Info */}
                                        <div className="flex-grow">
                                            <h4 className="text-base font-bold mb-1 text-slate-700">
                                                {item.title}
                                            </h4>
                                            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                                                <div className="flex items-center">
                                                    <Clock size={12} className="mr-1" />
                                                    {item.duration} min
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full mr-2"></span>
                                                    {item.type === 'lesson' ? (
                                                        getContentIcon(item.contentType)
                                                    ) : (
                                                        <HelpCircle className="w-5 h-5 text-orange-600 mr-1" />
                                                    )}
                                                    {item.type === 'lesson' ? item.contentType : 'Quiz'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Icon */}
                                        <div className="flex-shrink-0 ml-4">
                                            <div className="w-8 h-8 rounded-full border-2 border-slate-200 group-hover:border-[#7E2259] transition-colors"></div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div className="space-y-6">
                        {/* Rating Header */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="text-5xl font-extrabold text-slate-900">4.5</div>
                                <div className="flex flex-col">
                                    <div className="flex gap-1 mb-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star key={star} size={20} className={`${star <= 4.5 ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}`} />
                                        ))}
                                    </div>
                                    <span className="text-sm text-slate-500 font-medium">Course Rating</span>
                                </div>
                            </div>

                            <button className="flex items-center gap-2 bg-[#7E2259] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#601a44] transition-colors shadow-lg shadow-[#7E2259]/20">
                                <PenSquare size={18} />
                                Add Review
                            </button>
                        </div>

                        {/* Reviews List */}
                        <div className="space-y-4">
                            {COURSE_DATA.reviews.map((review) => (
                                <div key={review.id} className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            {review.avatar ? (
                                                <img src={review.avatar} alt={review.user} className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <User size={20} />
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-slate-900">{review.user}</h4>
                                                    {review.isCurrentUser && (
                                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">You</span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-slate-400">{review.date}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-50 text-slate-600 text-sm leading-relaxed mb-4">
                                        "{review.content}"
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="text-center pt-4">
                            <button className="text-[#7E2259] text-sm font-bold flex items-center justify-center gap-1 mx-auto hover:underline">
                                View all reviews <ChevronLeft className="rotate-[-90deg]" size={14} />
                            </button>
                        </div>
                    </div>
                )}

            </main>

            {/* Footer */}
            <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center border-t border-slate-200 mt-8">
                <p className="text-sm text-slate-400">
                    © 2024 EduPlatform Inc. All rights reserved.
                </p>
            </footer>
        </div>
    );
};

export default CourseOverview;
