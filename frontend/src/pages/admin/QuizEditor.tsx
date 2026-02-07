import React, { useState } from 'react';
import {
    Plus,
    Moon,
    Pencil,
    Trophy,
    RotateCcw,
    Star,
    HelpCircle
} from 'lucide-react';

interface Question {
    id: number;
    text: string;
    options: string[];
    correctAnswer: number;
}

interface Rewards {
    firstTry: number;
    secondTry: string; // "?" in UI
    thirdTry: number;
    fourthTry: number;
}

const QuizEditor: React.FC = () => {
    const [view, setView] = useState<'question' | 'rewards'>('question');
    const [selectedQuestionId, setSelectedQuestionId] = useState<number>(1);
    const [questions, setQuestions] = useState<Question[]>([
        {
            id: 1,
            text: '',
            options: ['Answer 1', 'Answer 2', 'Answer 3'],
            correctAnswer: 0
        }
    ]);

    const [rewards, setRewards] = useState<Rewards>({
        firstTry: 10,
        secondTry: '?',
        thirdTry: 5,
        fourthTry: 2
    });

    const activeQuestion = questions.find(q => q.id === selectedQuestionId) || questions[0];

    const addQuestion = () => {
        const newId = Date.now();
        const newQuestion: Question = {
            id: newId,
            text: '',
            options: ['Answer 1', 'Answer 2', 'Answer 3'],
            correctAnswer: 0
        };
        setQuestions([...questions, newQuestion]);
        setSelectedQuestionId(newId);
        setView('question');
    };

    const updateQuestionText = (text: string) => {
        setQuestions(questions.map(q => q.id === selectedQuestionId ? { ...q, text } : q));
    };

    const updateOption = (oIdx: number, val: string) => {
        setQuestions(questions.map(q => q.id === selectedQuestionId ? {
            ...q,
            options: q.options.map((o, idx) => idx === oIdx ? val : o)
        } : q));
    };

    const setCorrectAnswer = (oIdx: number) => {
        setQuestions(questions.map(q => q.id === selectedQuestionId ? { ...q, correctAnswer: oIdx } : q));
    };

    const addChoice = () => {
        setQuestions(questions.map(q => q.id === selectedQuestionId ? {
            ...q,
            options: [...q.options, `Answer ${q.options.length + 1}`]
        } : q));
    };

    return (
        <div className="flex h-screen bg-[#FDFDFF] font-sans">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-gray-100 flex flex-col h-full sticky top-0 shadow-sm">
                <div className="p-8">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 px-2">QUESTION LIST</h3>
                    <div className="space-y-3">
                        {questions.map((q, idx) => (
                            <button
                                key={q.id}
                                onClick={() => {
                                    setSelectedQuestionId(q.id);
                                    setView('question');
                                }}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl text-sm font-bold transition-all group ${selectedQuestionId === q.id && view === 'question'
                                    ? 'bg-[#F8F1F6] text-[#7E2259]'
                                    : 'text-slate-400 hover:bg-slate-50'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${selectedQuestionId === q.id && view === 'question'
                                    ? 'bg-[#7E2259] text-white'
                                    : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                                    }`}>
                                    <HelpCircle size={16} />
                                </div>
                                <span className="flex-1 text-left">Question {idx + 1}</span>
                                {selectedQuestionId === q.id && view === 'question' && <Pencil size={14} />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-auto p-8 space-y-4 bg-slate-50/30">
                    <button
                        onClick={addQuestion}
                        className="w-full bg-[#7E2259] text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-[#7E2259]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Plus size={20} strokeWidth={3} />
                        Add Question
                    </button>
                    <button
                        onClick={() => setView('rewards')}
                        className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all ${view === 'rewards'
                            ? 'bg-[#7E2259] text-white shadow-xl shadow-[#7E2259]/20'
                            : 'bg-white border-2 border-[#7E2259]/10 text-[#7E2259] hover:bg-[#F8F1F6]'
                            }`}
                    >
                        <Trophy size={20} />
                        Rewards
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-[#FDFDFF] p-10 custom-scrollbar">
                <div className="max-w-5xl mx-auto">
                    {view === 'question' ? (
                        <div className="space-y-10">
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                {/* Question Input */}
                                <div className="flex gap-6 items-start">
                                    <span className="text-3xl font-black text-gray-300 pt-1">
                                        {questions.findIndex(q => q.id === selectedQuestionId) + 1}.
                                    </span>
                                    <input
                                        type="text"
                                        className="flex-1 bg-transparent text-3xl font-black text-gray-800 placeholder-gray-200 outline-none border-b-2 border-transparent focus:border-gray-100 pb-2"
                                        placeholder="Write your question here"
                                        value={activeQuestion.text}
                                        onChange={(e) => updateQuestionText(e.target.value)}
                                    />
                                </div>

                                {/* Choices Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between text-[11px] font-black text-gray-400 uppercase tracking-widest px-4">
                                        <span>CHOICES</span>
                                        <span>CORRECT</span>
                                    </div>

                                    <div className="space-y-4">
                                        {activeQuestion.options.map((option, idx) => (
                                            <div key={idx} className="flex items-center gap-6 group">
                                                <div className="flex-1 bg-[#F8F9FB] rounded-xl px-6 py-4 border border-transparent focus-within:border-gray-200 transition-all">
                                                    <input
                                                        type="text"
                                                        className="w-full bg-transparent outline-none text-sm font-bold text-gray-600"
                                                        value={option}
                                                        onChange={(e) => updateOption(idx, e.target.value)}
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => setCorrectAnswer(idx)}
                                                    className={`w-10 h-6 rounded-full relative transition-all ${activeQuestion.correctAnswer === idx
                                                        ? 'bg-[#22C55E]'
                                                        : 'bg-gray-200'
                                                        }`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${activeQuestion.correctAnswer === idx ? 'left-5' : 'left-1'
                                                        }`} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={addChoice}
                                        className="flex items-center gap-2 text-[#7E2259] font-black text-[11px] uppercase tracking-widest hover:opacity-70 transition-all px-4"
                                    >
                                        <div className="w-5 h-5 rounded-full border-2 border-[#7E2259] flex items-center justify-center">
                                            <Plus size={12} strokeWidth={3} />
                                        </div>
                                        Add choice
                                    </button>
                                </div>

                                {/* Footer Actions */}
                                <div className="flex items-center justify-end gap-4 pt-10 border-t border-gray-50">
                                    <button className="px-8 py-3 rounded-xl border border-gray-200 text-sm font-black text-gray-400 hover:bg-gray-50 transition-all">
                                        Discard Changes
                                    </button>
                                    <button className="bg-[#7E2259] text-white px-10 py-3.5 rounded-xl font-black shadow-xl shadow-[#7E2259]/20 hover:bg-[#6D1F4D] transition-all">
                                        Save Question
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            {/* Header Section */}
                            <div className="flex items-center justify-between mb-2">
                                <h1 className="text-xl font-black text-slate-800">Rewards Configuration</h1>
                                <div className="flex items-center gap-6">
                                    <button className="text-slate-400 hover:text-slate-600">
                                        <Moon size={22} fill="currentColor" />
                                    </button>
                                    <button className="bg-[#7E2259] text-white px-8 py-2.5 rounded-lg text-sm font-black shadow-lg shadow-[#7E2259]/20 hover:bg-[#6D1F4D] transition-all">
                                        Save Changes
                                    </button>
                                </div>
                            </div>

                            {/* Main Rewards Card */}
                            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-10 space-y-10">
                                    {/* Subheader */}
                                    <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                                        <div className="bg-[#F8F1F6] p-2.5 rounded-xl">
                                            <Trophy size={20} className="text-[#7E2259]" />
                                        </div>
                                        <h2 className="text-lg font-black text-slate-800 tracking-tight">Point Distribution by Attempts</h2>
                                    </div>

                                    {/* Input Grid */}
                                    <div className="grid grid-cols-2 gap-x-12 gap-y-10">
                                        {[
                                            { label: 'First try', value: rewards.firstTry, key: 'firstTry' },
                                            { label: 'Second try', value: rewards.secondTry, key: 'secondTry' },
                                            { label: 'Third try', value: rewards.thirdTry, key: 'thirdTry' },
                                            { label: 'Fourth Try and more', value: rewards.fourthTry, key: 'fourthTry' }
                                        ].map((item, idx) => (
                                            <div key={idx} className="space-y-3">
                                                <label className="text-sm font-bold text-slate-500 ml-1">{item.label}</label>
                                                <div className="relative group">
                                                    <input
                                                        type="text"
                                                        className="w-full bg-[#FDFDFF] border border-gray-200 rounded-xl px-6 py-4 text-slate-700 font-extrabold outline-none focus:border-[#7E2259]/30 focus:bg-white transition-all shadow-sm"
                                                        value={item.value}
                                                        onChange={(e) => setRewards({ ...rewards, [item.key]: e.target.value })}
                                                    />
                                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-300">points</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Info Box */}
                                    <div className="bg-[#F8F1F6] rounded-2xl p-6 flex items-start gap-4 border border-[#7E2259]/5">
                                        <div className="bg-[#7E2259] w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1">
                                            <span className="text-white text-xs font-black italic">i</span>
                                        </div>
                                        <p className="text-[13px] font-bold text-slate-500 leading-relaxed">
                                            Points are awarded based on the student's attempt number. The "First try" reward is typically set highest to encourage careful participation. You can customize these values to fit your course gamification strategy.
                                        </p>
                                    </div>
                                </div>

                                {/* Student View Preview Section */}
                                <div className="bg-slate-50/50 p-10 border-t border-gray-100">
                                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Live Preview (Student View)</h3>
                                    <div className="flex items-center gap-12">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center shadow-inner">
                                                <Star size={24} className="text-yellow-500 fill-yellow-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">First Try</p>
                                                <p className="text-lg font-black text-slate-800">{rewards.firstTry} pts</p>
                                            </div>
                                        </div>

                                        <div className="w-px h-10 bg-gray-200" />

                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shadow-inner">
                                                <RotateCcw size={22} className="text-blue-500 line-clamp-1" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subsequent</p>
                                                <p className="text-lg font-black text-slate-800">{rewards.secondTry} to {rewards.fourthTry} pts</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer text */}
                            <div className="text-center pt-10">
                                <p className="text-[11px] font-bold text-slate-300">© 2024 Quiz Platform Admin. All rights reserved.</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Accessibility Toggle */}
            <div className="fixed bottom-10 right-10">
                <button className="w-12 h-12 bg-white rounded-full shadow-2xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#7E2259] transition-all">
                    <Moon size={20} />
                </button>
            </div>
        </div>
    );
};

export default QuizEditor;
