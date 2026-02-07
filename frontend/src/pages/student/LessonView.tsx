import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

// Mock Data specific to this view to match UI exactly
const LESSON_DATA = [
    {
        id: 1,
        title: "Advanced Sales & CRM Automation in Odoo",
        type: 'VIDEO',
        duration: "45:00",
        description: "[Additional attachment should be visible here]",
        isActive: false,
        isCompleted: true
    },
    {
        id: 2,
        title: "Document",
        type: 'DOCUMENT',
        duration: "10 min",
        description: "[Additional attachment should be visible here]",
        isActive: true, // Default active for this view
        isCompleted: false
    },
    {
        id: 3,
        title: "Quiz", // Renamed to match UI
        type: 'QUIZ',
        duration: "20 min",
        isActive: false,
        isCompleted: false,
        questions: [
            {
                id: 1,
                question: "What is the primary benefit of CRM automation?",
                options: [
                    "Reducing the number of employees required in sales",
                    "Improving data accuracy and reducing manual repetitive tasks",
                    "Increasing the cost of customer acquisition",
                    "Simplifying the product design process"
                ],
                correctAnswer: 1 // Index of correct option
            },
            {
                id: 2,
                question: "Which feature allows you to track potential revenue?",
                options: [
                    "Employee Directory",
                    "Sales Pipeline",
                    "Website Builder",
                    "Inventory Control"
                ],
                correctAnswer: 1
            },
            {
                id: 3,
                question: "Which of the following describes the primary benefit of a centralized CRM system?",
                options: [
                    "It allows individual sales teams to keep data private.",
                    "It ensures all team members have access to a single source of truth for customer data.",
                    "It replaces the need for a marketing department."
                ],
                correctAnswer: 1
            }
        ]
    }
];

const LessonView: React.FC = () => {
    const navigate = useNavigate();
    const { courseId } = useParams();
    const [activeLessonId, setActiveLessonId] = useState(2); // Set to 2 (Document) by default for this view
    const [quizStarted, setQuizStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(2); // Start at last question for demo purposes per request
    const [showCompletionModal, setShowCompletionModal] = useState(false);

    const activeLesson = LESSON_DATA.find(l => l.id === activeLessonId) || LESSON_DATA[0];

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

                {/* Lesson List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="px-4 pb-4 space-y-2">
                        {LESSON_DATA.map((lesson) => (
                            <div
                                key={lesson.id}
                                onClick={() => setActiveLessonId(lesson.id)}
                                className={`p-4 rounded-xl cursor-pointer transition-all border ${lesson.id === activeLessonId
                                    ? 'bg-[#FDF2F8] border-[#7E2259]/20'
                                    : 'bg-transparent border-transparent hover:bg-slate-50'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex-shrink-0">
                                        {lesson.isCompleted ? (
                                            <div className="w-5 h-5 bg-[#3B82F6] rounded-full flex items-center justify-center text-white">
                                                <CheckCircle size={14} className="text-white" />
                                            </div>
                                        ) : lesson.id === activeLessonId ? (
                                            <div className="w-5 h-5 bg-[#3B82F6] rounded-full border-2 border-[#3B82F6]"></div>
                                        ) : (
                                            <div className="w-5 h-5 rounded-full border-2 border-[#3B82F6] bg-white"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`text-sm font-bold mb-1 leading-snug ${lesson.id === activeLessonId ? 'text-slate-900' : 'text-slate-700'}`}>
                                            {lesson.title}
                                        </h3>
                                        {lesson.description && (
                                            <p className="text-[10px] font-medium text-[#16A34A] leading-tight">
                                                <span className="inline-block mr-1">📎</span>
                                                {lesson.description}
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
                    {activeLesson.type === 'QUIZ' ? (
                        /* Quiz View */
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-slate-100 min-h-[600px] flex flex-col justify-center">
                            {!quizStarted ? (
                                /* Quiz Start View */
                                <div className="max-w-md mx-auto w-full text-center">
                                    <div className="w-20 h-20 bg-[#FDF2F8] rounded-full flex items-center justify-center mx-auto mb-6">
                                        <ClipboardList size={32} className="text-[#7E2259]" />
                                    </div>

                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Module Quiz</h2>

                                    <p className="text-slate-500 mb-10 leading-relaxed">
                                        Test your knowledge on the basics of Odoo CRM before moving to the next section.
                                    </p>

                                    <div className="space-y-4 mb-10 text-left bg-slate-50 p-6 rounded-2xl">
                                        <div className="flex items-center gap-3 text-sm text-slate-600">
                                            <ClipboardList size={18} className="text-[#3B82F6]" />
                                            <span className="font-semibold text-[#3B82F6]">Total Questions:</span>
                                            <span className="ml-auto font-bold text-slate-900">{activeLesson.questions?.length || 5}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-600">
                                            <RotateCcw size={18} className="text-[#3B82F6]" />
                                            <span className="font-semibold text-[#3B82F6]">Multiple Attempts</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-600">
                                            <Timer size={18} className="text-slate-400" />
                                            <span className="font-semibold text-slate-500">No Time Limit</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setQuizStarted(true)}
                                        className="w-full bg-[#7E2259] text-white py-4 rounded-xl font-bold hover:bg-[#601a44] transition-all shadow-lg shadow-[#7E2259]/20"
                                    >
                                        Start Quiz
                                    </button>
                                </div>
                            ) : (
                                /* Question View */
                                <div className="max-w-3xl mx-auto w-full animate-fade-in">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-medium text-slate-500">Question {currentQuestionIndex + 1} of {activeLesson.questions?.length}</span>
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
                                        {activeLesson.questions?.[currentQuestionIndex].question}
                                    </h2>

                                    <div className="space-y-4 mb-10">
                                        {activeLesson.questions?.[currentQuestionIndex].options.map((option, index) => (
                                            <label
                                                key={index}
                                                className={`flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all group ${index === 1 // Mock selection
                                                    ? 'border-[#7E2259] bg-[#7E2259]/5'
                                                    : 'border-slate-50 bg-slate-50 hover:bg-slate-100 hover:border-slate-200'
                                                    }`}
                                            >
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${index === 1
                                                    ? 'border-[#7E2259] bg-[#7E2259]'
                                                    : 'border-slate-300 bg-white group-hover:border-slate-400'
                                                    }`}>
                                                    {index === 1 && <div className="w-2.5 h-2.5 bg-[#7E2259] rounded-full"></div>}
                                                </div>
                                                <span className={`text-sm font-semibold selection:bg-transparent ${index === 1 ? 'text-[#7E2259]' : 'text-slate-600'}`}>
                                                    {option}
                                                </span>
                                            </label>
                                        ))}
                                    </div>

                                    {/* Conditional Button Rendering */}
                                    {(currentQuestionIndex === (activeLesson.questions?.length || 0) - 1) ? (
                                        <div className="flex justify-center pt-8">
                                            <button
                                                onClick={() => setShowCompletionModal(true)}
                                                className="bg-[#7E2259] text-white px-10 py-4 rounded-full font-bold hover:bg-[#601a44] transition-all shadow-lg shadow-[#7E2259]/20 text-base"
                                            >
                                                Proceed and Complete Quiz
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-end gap-6 border-t border-slate-100 pt-8">
                                            <button
                                                onClick={() => setCurrentQuestionIndex(prev => Math.min(prev + 1, (activeLesson.questions?.length || 1) - 1))}
                                                className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
                                            >
                                                <SkipForward size={14} />
                                                Skip Question
                                            </button>
                                            <button
                                                onClick={() => setCurrentQuestionIndex(prev => Math.min(prev + 1, (activeLesson.questions?.length || 1) - 1))}
                                                className="bg-[#7E2259] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#601a44] transition-all shadow-lg shadow-[#7E2259]/20 flex items-center gap-2"
                                            >
                                                Submit Answer
                                                <Check size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (activeLesson.type === 'DOCUMENT' ? (
                        /* Document View */
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_2px_20px_rgb(0,0,0,0.02)]">
                            <div className="flex items-center justify-between mb-8">
                                <h1 className="text-3xl font-bold text-slate-900">
                                    {activeLesson.title}
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

                            <div className="prose prose-slate max-w-none mb-10">
                                <p className="text-slate-500 text-lg leading-relaxed">
                                    This area is dedicated for the document viewer or specific lesson content. It follows the structural layout of the wireframe while enhancing it with professional spacing and design elements.
                                </p>
                            </div>

                            {/* Skeleton Loader Lines */}
                            <div className="space-y-4 mb-12 opacity-50">
                                <div className="w-1/2 h-4 bg-slate-100 rounded-full"></div>
                                <div className="w-full h-4 bg-slate-100 rounded-full"></div>
                                <div className="w-3/4 h-4 bg-slate-100 rounded-full"></div>
                                <div className="w-1/3 h-4 bg-slate-100 rounded-full"></div>
                            </div>

                            {/* Content Placeholder */}
                            <div className="border-2 border-dashed border-slate-200 rounded-3xl h-80 flex flex-col items-center justify-center text-slate-300 bg-slate-50/30">
                                <FileText size={48} className="mb-4 opacity-50" />
                                <span className="font-medium">Content loading area placeholder</span>
                            </div>
                        </div>
                    ) : (
                        /* Default/Video View - Unified */
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_2px_20px_rgb(0,0,0,0.02)]">
                            <div className="flex items-center justify-between mb-8">
                                <h1 className="text-3xl font-bold text-slate-900">
                                    {activeLesson.title}
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

                            <div className="prose prose-slate max-w-none mb-10">
                                <p className="text-slate-500 text-lg leading-relaxed">
                                    This area is reserved for the video player content.
                                </p>
                            </div>

                            {/* Content Placeholder */}
                            <div className="border-2 border-dashed border-slate-200 rounded-3xl h-80 flex flex-col items-center justify-center text-slate-300 bg-slate-50/30">
                                <PlayCircle size={48} className="mb-4 opacity-50" />
                                <span className="font-medium">Video Player Placeholder</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Floating Next Button */}
                <div className="sticky bottom-8 right-8 flex justify-end px-8 pb-8 pointer-events-none">
                    <button className="pointer-events-auto flex items-center gap-2 bg-[#7E2259] text-white px-8 py-4 rounded-full font-bold shadow-2xl shadow-[#7E2259]/30 hover:bg-[#601a44] transition-all hover:-translate-y-1">
                        {activeLessonId === 4 ? "Complete this course" : "Next Content"}
                        <ChevronRight size={20} />
                    </button>
                </div>
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
