import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft,
    PlayCircle,
    Maximize,
    ChevronRight,
    CheckCircle,
    Menu,
    Download,
    Moon,
    FileText,
    SkipForward,
    Check,
    ClipboardList,
    Timer,
    RotateCcw,
    PartyPopper,
    X
} from 'lucide-react';
import { lessonsApi, quizzesApi } from '../../services/api';
import type { Lesson, Quiz } from '../../types/api';

// Content item interface for unified display
interface ContentItem {
    id: number;
    title: string;
    type: 'LESSON' | 'QUIZ';
    duration: string;
    description?: string;
    content?: string;
    isCompleted: boolean;
    data?: Lesson | Quiz;
}

const LessonView: React.FC = () => {
    const navigate = useNavigate();
    const { courseId, lessonId, quizId } = useParams();
    
    // Determine content type and ID based on URL
    const activeContentId = lessonId ? parseInt(lessonId) : (quizId ? parseInt(quizId) : 0);
    const activeContentType: 'LESSON' | 'QUIZ' = lessonId ? 'LESSON' : 'QUIZ';
    
    const [currentActiveContentId, setCurrentActiveContentId] = useState<number>(activeContentId);
    const [currentActiveContentType, setCurrentActiveContentType] = useState<'LESSON' | 'QUIZ'>(activeContentType);
    const [quizStarted, setQuizStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: number}>({});
    const [showCompletionModal, setShowCompletionModal] = useState(false);

    // Fetch lessons for the course
    const { data: lessons = [] } = useQuery({
        queryKey: ['lessons', courseId],
        queryFn: () => lessonsApi.getByCourse(parseInt(courseId!)),
        enabled: !!courseId,
    });

    // Fetch quizzes for the course  
    const { data: quizzes = [] } = useQuery({
        queryKey: ['quizzes', courseId],
        queryFn: () => quizzesApi.getByCourse(parseInt(courseId!)),
        enabled: !!courseId,
    });

    // Fetch active lesson content
    const { data: activeLesson } = useQuery({
        queryKey: ['lesson', currentActiveContentId],
        queryFn: () => lessonsApi.getWithContent(currentActiveContentId),
        enabled: currentActiveContentType === 'LESSON' && currentActiveContentId > 0,
    });

    // Fetch active quiz content
    const { data: activeQuiz } = useQuery({
        queryKey: ['quiz', currentActiveContentId],
        queryFn: () => quizzesApi.get(currentActiveContentId),
        enabled: currentActiveContentType === 'QUIZ' && currentActiveContentId > 0,
    });

    // Combine lessons and quizzes into unified content items
    const contentItems: ContentItem[] = [
        ...lessons.map((lesson): ContentItem => ({
            id: lesson.id,
            title: lesson.title,
            type: 'LESSON',
            duration: `${lesson.estimated_duration || 10} min`,
            description: lesson.description || '',
            content: lesson.content,
            isCompleted: false, // TODO: Get actual progress
            data: lesson
        })),
        ...quizzes.map((quiz): ContentItem => ({
            id: quiz.id,
            title: quiz.title,
            type: 'QUIZ',
            duration: `${quiz.time_limit || 20} min`,
            description: quiz.description || '',
            isCompleted: false, // TODO: Get actual progress
            data: quiz
        }))
    ].sort((a, b) => a.id - b.id);

    // Set first item as active if none is selected
    useEffect(() => {
        if (contentItems.length > 0 && currentActiveContentId === 0) {
            const firstItem = contentItems[0];
            setCurrentActiveContentId(firstItem.id);
            setCurrentActiveContentType(firstItem.type);
        }
    }, [contentItems, currentActiveContentId]);

    const activeContentItem = contentItems.find(item => item.id === currentActiveContentId && item.type === currentActiveContentType);
    const activeData = currentActiveContentType === 'LESSON' ? activeLesson : activeQuiz;

    return (
        <div className="flex h-screen bg-[#F8F9FA] font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-80 bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0 z-20">
                <div className="p-6">
                    <button
                        onClick={() => navigate(`/student/course/${courseId}`)}
                        className="flex items-center gap-2 text-white bg-[#7E2259] hover:bg-[#601a44] px-4 py-2 rounded-lg text-sm font-bold transition-colors mb-6 shadow-sm w-fit"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>

                    <h2 className="text-xl font-bold text-slate-900 mb-2 leading-tight">
                        Basics of Odoo CRM
                    </h2>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between text-xs font-bold text-[#EA580C] mb-2">
                            <span>0% Completed</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div className="bg-[#EA580C] h-1.5 rounded-full w-0"></div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 my-2"></div>
                </div>

                {/* Content List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="px-4 pb-4 space-y-2">
                        {contentItems.map((item) => (
                            <div
                                key={`${item.type}-${item.id}`}
                                onClick={() => {
                                    setCurrentActiveContentId(item.id);
                                    setCurrentActiveContentType(item.type);
                                    setQuizStarted(false);
                                    setCurrentQuestionIndex(0);
                                    setSelectedAnswers({});
                                    // Update URL
                                    if (item.type === 'LESSON') {
                                        navigate(`/student/course/${courseId}/lesson/${item.id}`, { replace: true });
                                    } else {
                                        navigate(`/student/course/${courseId}/quiz/${item.id}`, { replace: true });
                                    }
                                }}
                                className={`p-4 rounded-xl cursor-pointer transition-all border ${item.id === currentActiveContentId && item.type === currentActiveContentType
                                    ? 'bg-[#FDF2F8] border-[#7E2259]/20'
                                    : 'bg-transparent border-transparent hover:bg-slate-50'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex-shrink-0">
                                        {item.isCompleted ? (
                                            <div className="w-5 h-5 bg-[#3B82F6] rounded-full flex items-center justify-center text-white">
                                                <CheckCircle size={14} className="text-white" />
                                            </div>
                                        ) : item.id === currentActiveContentId && item.type === currentActiveContentType ? (
                                            <div className="w-5 h-5 bg-[#3B82F6] rounded-full border-2 border-[#3B82F6]"></div>
                                        ) : (
                                            <div className="w-5 h-5 rounded-full border-2 border-[#3B82F6] bg-white"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`text-sm font-bold mb-1 leading-snug ${item.id === currentActiveContentId && item.type === currentActiveContentType ? 'text-slate-900' : 'text-slate-700'}`}>
                                            {item.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                            <span className="capitalize font-medium text-[#3B82F6]">
                                                {item.type === 'LESSON' ? '📖' : '❓'} {item.type.toLowerCase()}
                                            </span>
                                            <span>•</span>
                                            <span>{item.duration}</span>
                                        </div>
                                        {item.description && (
                                            <p className="text-[10px] font-medium text-[#16A34A] leading-tight">
                                                <span className="inline-block mr-1">📎</span>
                                                {item.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full relative overflow-y-auto bg-[#F8F9FA]">
                {/* Top Header Bar */}
                <header className="px-8 py-4 flex items-center justify-between border-b border-white/50 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <Menu size={20} className="text-slate-500" />
                        </button>
                        <p className="text-[#EA580C] text-sm italic hidden md:block">
                            [Description of the content should be visible here, which is set in background for the user]
                        </p>
                    </div>
                    <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <Moon size={20} />
                    </button>
                </header>

                <div className="max-w-5xl mx-auto w-full p-8">
                    {currentActiveContentType === 'QUIZ' ? (
                        /* Quiz View */
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-slate-100 min-h-[600px] flex flex-col justify-center">
                            {!quizStarted ? (
                                /* Quiz Start View */
                                <div className="max-w-md mx-auto w-full text-center">
                                    <div className="w-20 h-20 bg-[#FDF2F8] rounded-full flex items-center justify-center mx-auto mb-6">
                                        <ClipboardList size={32} className="text-[#7E2259]" />
                                    </div>

                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                        {activeContentItem?.title || 'Quiz'}
                                    </h2>

                                    <p className="text-slate-500 mb-10 leading-relaxed">
                                        {activeContentItem?.description || 'Test your knowledge before moving to the next section.'}
                                    </p>

                                    <div className="space-y-4 mb-10 text-left bg-slate-50 p-6 rounded-2xl">
                                        <div className="flex items-center gap-3 text-sm text-slate-600">
                                            <ClipboardList size={18} className="text-[#3B82F6]" />
                                            <span className="font-semibold text-[#3B82F6]">Total Questions:</span>
                                            <span className="ml-auto font-bold text-slate-900">{(activeQuiz as any)?.questions?.length || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-600">
                                            <RotateCcw size={18} className="text-[#3B82F6]" />
                                            <span className="font-semibold text-[#3B82F6]">Multiple Attempts</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-600">
                                            <Timer size={18} className="text-slate-400" />
                                            <span className="font-semibold text-slate-500">
                                                {activeQuiz?.time_limit ? `${activeQuiz.time_limit} minutes` : 'No Time Limit'}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setQuizStarted(true)}
                                        className="w-full bg-[#7E2259] text-white py-4 rounded-xl font-bold hover:bg-[#601a44] transition-all shadow-lg shadow-[#7E2259]/20"
                                        disabled={!(activeQuiz as any)?.questions?.length}
                                    >
                                        {(activeQuiz as any)?.questions?.length ? 'Start Quiz' : 'Loading...'}
                                    </button>
                                </div>
                            ) : (
                                /* Question View */
                                <div className="max-w-3xl mx-auto w-full animate-fade-in">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-medium text-slate-500">
                                                Question {currentQuestionIndex + 1} of {(activeQuiz as any)?.questions?.length}
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            {/* Not using the steps progress bar from previous design to match new screenshot cleaner look, or simplifying it */}
                                            <div className="flex items-center gap-2">
                                                <Moon size={20} className="text-slate-400" />
                                                <div className="w-8 h-8 rounded-full bg-[#7E2259] text-white flex items-center justify-center text-xs font-bold">JD</div>
                                            </div>
                                        </div>
                                    </div>

                                    <h2 className="text-2xl font-bold text-slate-900 mb-8 leading-snug">
                                        {(activeQuiz as any)?.questions?.[currentQuestionIndex]?.question_text}
                                    </h2>

                                    <div className="space-y-4 mb-10">
                                        {(activeQuiz as any)?.questions?.[currentQuestionIndex]?.options?.map((option: any, index: number) => (
                                            <label
                                                key={index}
                                                className={`flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all group ${
                                                    selectedAnswers[currentQuestionIndex] === index
                                                        ? 'border-[#7E2259] bg-[#7E2259]/5'
                                                        : 'border-slate-50 bg-slate-50 hover:bg-slate-100 hover:border-slate-200'
                                                }`}
                                                onClick={() => setSelectedAnswers(prev => ({...prev, [currentQuestionIndex]: index}))}
                                            >
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                    selectedAnswers[currentQuestionIndex] === index
                                                        ? 'border-[#7E2259] bg-[#7E2259]'
                                                        : 'border-slate-300 bg-white group-hover:border-slate-400'
                                                }`}>
                                                    {selectedAnswers[currentQuestionIndex] === index && (
                                                        <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                                                    )}
                                                </div>
                                                <span className={`text-sm font-semibold selection:bg-transparent ${
                                                    selectedAnswers[currentQuestionIndex] === index ? 'text-[#7E2259]' : 'text-slate-600'
                                                }`}>
                                                    {option.option_text}
                                                </span>
                                            </label>
                                        ))}
                                    </div>

                                    {/* Conditional Button Rendering */}
                                    {(currentQuestionIndex === ((activeQuiz as any)?.questions?.length || 0) - 1) ? (
                                        <div className="flex justify-center pt-8">
                                            <button
                                                onClick={() => setShowCompletionModal(true)}
                                                className="bg-[#7E2259] text-white px-10 py-4 rounded-full font-bold hover:bg-[#601a44] transition-all shadow-lg shadow-[#7E2259]/20 text-base"
                                            >
                                                Complete Quiz
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between border-t border-slate-100 pt-8">
                                            <button
                                                onClick={() => setCurrentQuestionIndex(prev => Math.max(prev - 1, 0))}
                                                className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
                                                disabled={currentQuestionIndex === 0}
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() => setCurrentQuestionIndex(prev => 
                                                    Math.min(prev + 1, ((activeQuiz as any)?.questions?.length || 1) - 1)
                                                )}
                                                className="bg-[#7E2259] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#601a44] transition-all shadow-lg shadow-[#7E2259]/20 flex items-center gap-2"
                                            >
                                                Next Question
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Lesson Content View */
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_2px_20px_rgb(0,0,0,0.02)]">
                            <div className="flex items-center justify-between mb-8">
                                <h1 className="text-3xl font-bold text-slate-900">
                                    {activeContentItem?.title || 'Lesson'}
                                </h1>
                                <div className="flex items-center gap-2">
                                    <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900 transition-colors">
                                        <Download size={20} />
                                    </button>
                                    <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900 transition-colors">
                                        <Maximize size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Lesson Content */}
                            <div className="prose prose-slate max-w-none mb-10">
                                {activeLesson?.content ? (
                                    <div className="text-slate-700 text-base leading-relaxed whitespace-pre-wrap">
                                        {activeLesson.content}
                                    </div>
                                ) : (
                                    <div className="text-slate-500 text-lg leading-relaxed">
                                        <p>Loading lesson content...</p>
                                        {activeContentItem?.description && (
                                            <p className="mt-4">{activeContentItem.description}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Video or Document Content */}
                            {activeLesson?.video_url && (
                                <div className="mb-8">
                                    <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center">
                                        <div className="text-center">
                                            <PlayCircle size={48} className="mx-auto mb-2 text-slate-400" />
                                            <p className="text-slate-500">Video content would be displayed here</p>
                                            <p className="text-xs text-slate-400 mt-1">{activeLesson.video_url}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeLesson?.document_url && (
                                <div className="mb-8 p-4 bg-slate-50 rounded-xl">
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <FileText size={20} />
                                        <div>
                                            <p className="font-medium">Document Attached</p>
                                            <p className="text-xs text-slate-500">{activeLesson.document_url}</p>
                                        </div>
                                        <button className="ml-auto p-2 hover:bg-slate-200 rounded-lg transition-colors">
                                            <Download size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-4 mb-12 opacity-50">
                                <div className="w-1/2 h-4 bg-slate-100 rounded-full"></div>
                                <div className="w-full h-4 bg-slate-100 rounded-full"></div>
                                <div className="w-3/4 h-4 bg-slate-100 rounded-full"></div>
                                <div className="w-1/3 h-4 bg-slate-100 rounded-full"></div>
                            </div>
                            {/* Navigation buttons */}
                            <div className="flex justify-between items-center pt-8 border-t border-slate-100">
                                <button
                                    onClick={() => navigate(`/student/course/${courseId}`)}
                                    className="text-slate-500 hover:text-slate-700 transition-colors"
                                >
                                    ← Back to Course
                                </button>
                                <button
                                    className="bg-[#7E2259] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#601a44] transition-all shadow-lg shadow-[#7E2259]/20"
                                    onClick={() => navigate(`/student/course/${courseId}`)}
                                >
                                    Complete Lesson
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Floating Next Button - only show when not in quiz mode or quiz not started */}
                {(currentActiveContentType !== 'QUIZ' || !quizStarted) && (
                    <div className="sticky bottom-8 right-8 flex justify-end px-8 pb-8 pointer-events-none">
                        <button 
                            className="pointer-events-auto flex items-center gap-2 bg-[#7E2259] text-white px-8 py-4 rounded-full font-bold shadow-2xl shadow-[#7E2259]/30 hover:bg-[#601a44] transition-all hover:-translate-y-1"
                            onClick={() => navigate(`/student/course/${courseId}`)}
                        >
                            Back to Course
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
                {/* Completion Modal */}
                {showCompletionModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-white rounded-3xl p-8 max-w-md w-full relative transform transition-all scale-100 shadow-2xl text-center">
                            <button
                                onClick={() => setShowCompletionModal(false)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="w-24 h-24 bg-[#DCFCE7] rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
                                <PartyPopper size={40} className="text-[#16A34A]" />
                            </div>

                            <h2 className="text-3xl font-bold text-[#16A34A] mb-2">Bingo!</h2>
                            <p className="text-slate-600 font-bold text-lg mb-8">You have earned!</p>

                            <div className="inline-block bg-[#DCFCE7] text-[#16A34A] px-6 py-2 rounded-full font-bold shadow-sm mb-8">
                                20 points
                            </div>

                            {/* Progress Bar in Modal */}
                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 justify-between px-1">
                                <span>5 Points</span>
                                <span>100 Points</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3 mb-8 relative overflow-hidden">
                                <div className="absolute top-0 left-0 h-full w-[20%] bg-[#10B981] rounded-full"></div>
                            </div>

                            <p className="text-slate-500 text-sm mb-8">
                                Reach the next rank to gain more points.
                            </p>

                            <button
                                onClick={() => navigate(`/student/course/${courseId}`)}
                                className="w-full bg-[#7E2259] text-white py-4 rounded-xl font-bold hover:bg-[#601a44] transition-all shadow-lg shadow-[#7E2259]/20"
                            >
                                Continue Journey
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default LessonView;
