import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Moon,
    Upload,
    CheckSquare,
    Square,
    List,
    Image as ImageIcon,
    Info,
    CheckCircle,
    Menu,
    Link as LinkIcon,
    X
} from 'lucide-react';

const ContentEditor: React.FC = () => {
    const navigate = useNavigate();
    const [title] = useState('Advanced Sales & CRM Automation in Odoo');
    const [activeSubTab, setActiveSubTab] = useState('Description');
    const [category, setCategory] = useState('Image');
    const [videoLink, setVideoLink] = useState('');
    const [documentName] = useState('No file chosen...');
    const [imageName] = useState('No file chosen');
    const [responsible, setResponsible] = useState('');
    const [allowDownload, setAllowDownload] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#FDFDFF] font-sans flex flex-col">
            {/* Header */}
            <header className="bg-white px-8 py-3 flex items-center justify-between border-b border-gray-50 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="bg-[#7E2259] p-1.5 rounded-lg flex items-center justify-center">
                        <Menu className="text-white" size={20} />
                    </div>
                    <span className="text-lg font-black text-[#2D2D2D] tracking-tight">
                        Content <span className="text-slate-800">Studio</span>
                    </span>
                </div>

                <div className="flex items-center gap-6">
                    <button className="text-slate-400 hover:text-slate-600 transition-colors">
                        <Moon size={20} />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-[#7E2259] flex items-center justify-center font-black text-white text-xs shadow-sm cursor-pointer">
                        JD
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto px-8 py-12 space-y-8">
                {/* Main Card */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_40px_rgba(0,0,0,0.02)] overflow-hidden">
                    <div className="p-12 pb-0 space-y-6">
                        <div className="space-y-1">
                            <span className="text-[11px] font-black text-[#FF8A00] uppercase tracking-[0.1em]">Content title</span>
                            <h1 className="text-3xl font-black text-[#0066FF] tracking-tight leading-tight">
                                {title}
                            </h1>
                            <div className="h-0.5 bg-[#0066FF]/20 w-fit min-w-[300px]" />
                        </div>

                        {/* Tabs */}
                        <div className="flex pt-6">
                            {['Content', 'Description', 'Additional attachment'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveSubTab(tab)}
                                    className={`px-10 py-4 text-sm font-black transition-all relative border border-b-0 border-transparent rounded-t-2xl ${activeSubTab === tab
                                        ? 'bg-[#7E2259] text-white shadow-lg'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-12 border-t border-slate-50 min-h-[300px]">
                        {activeSubTab === 'Content' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* Category */}
                                <div className="flex items-center gap-10">
                                    <span className="text-sm font-bold text-slate-700 min-w-[140px]">Content Category :</span>
                                    <div className="flex items-center gap-10">
                                        {['Video', 'Document', 'Image'].map((cat) => (
                                            <label key={cat} className="flex items-center gap-4 cursor-pointer group">
                                                <div className="relative flex items-center justify-center">
                                                    <input
                                                        type="radio"
                                                        className="sr-only"
                                                        name="category"
                                                        checked={category === cat}
                                                        onChange={() => setCategory(cat)}
                                                    />
                                                    <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${category === cat ? 'border-[#7E2259]' : 'border-gray-200 group-hover:border-gray-300'
                                                        }`}>
                                                        {category === cat && <div className="w-2.5 h-2.5 bg-[#7E2259] rounded-full" />}
                                                    </div>
                                                </div>
                                                <span className={`text-sm font-bold ${category === cat ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-500'}`}>
                                                    {cat}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {category === 'Image' ? (
                                    <div className="space-y-10 animate-in fade-in duration-300">
                                        <div className="flex items-center gap-10">
                                            <span className="text-sm font-bold text-slate-700 min-w-[140px]">Image file :</span>
                                            <div className="flex-1 flex items-center gap-4">
                                                <div className="flex-1 border border-slate-200 bg-slate-50/30 px-6 py-3.5 rounded-xl text-sm font-bold text-slate-400">
                                                    {imageName}
                                                </div>
                                                <button
                                                    onClick={() => setIsUploadModalOpen(true)}
                                                    className="bg-[#7E2259] text-white px-8 py-3.5 rounded-xl text-sm font-black flex items-center gap-3 shadow-lg shadow-[#7E2259]/10 hover:bg-[#6D1F4D] transition-all whitespace-nowrap"
                                                >
                                                    <Upload size={18} />
                                                    Upload image
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-10">
                                            <div className="flex items-center gap-10 flex-1">
                                                <span className="text-sm font-bold text-slate-700 min-w-[140px]">Responsible :</span>
                                                <div className="flex-1 max-w-sm border border-slate-200 focus-within:border-[#7E2259]/20 transition-all rounded-xl overflow-hidden bg-white">
                                                    <input
                                                        type="text"
                                                        placeholder="Enter name"
                                                        className="w-full px-6 py-3.5 bg-transparent outline-none text-sm font-bold text-slate-600 placeholder-slate-300"
                                                        value={responsible}
                                                        onChange={(e) => setResponsible(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <span className="text-sm font-bold text-slate-700">Allow Download :</span>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => setAllowDownload(!allowDownload)}
                                                        className="text-[#7E2259] hover:opacity-80 transition-all"
                                                    >
                                                        {allowDownload ? <CheckSquare size={24} fill="#7E2259" className="text-white" /> : <Square size={24} className="text-slate-200" />}
                                                    </button>
                                                    <p className="text-[11px] font-bold text-slate-300 italic whitespace-nowrap">
                                                        (Participants can download the file)
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : category === 'Document' ? (
                                    <div className="space-y-10 animate-in fade-in duration-300">
                                        <div className="flex items-center gap-10">
                                            <span className="text-sm font-bold text-slate-700 min-w-[140px]">Document file :</span>
                                            <div className="flex-1 flex items-center gap-4">
                                                <div className="flex-1 border border-slate-200 bg-slate-50/30 px-6 py-3.5 rounded-xl text-sm font-bold text-slate-400">
                                                    {documentName}
                                                </div>
                                                <button
                                                    onClick={() => setIsUploadModalOpen(true)}
                                                    className="bg-[#7E2259] text-white px-8 py-3.5 rounded-xl text-sm font-black flex items-center gap-3 shadow-lg shadow-[#7E2259]/10 hover:bg-[#6D1F4D] transition-all"
                                                >
                                                    <Upload size={18} />
                                                    Upload file
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-10">
                                            <span className="text-sm font-bold text-slate-700 min-w-[140px]">Responsible :</span>
                                            <div className="flex-1 max-w-sm border-b-2 border-slate-50 focus-within:border-[#7E2259]/20 transition-all pb-2">
                                                <input
                                                    type="text"
                                                    className="w-full bg-transparent outline-none text-sm font-bold text-slate-600"
                                                    value={responsible}
                                                    onChange={(e) => setResponsible(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-10 animate-in fade-in duration-300">
                                        <div className="flex items-center gap-10">
                                            <span className="text-sm font-bold text-slate-700 min-w-[140px]">Video Link :</span>
                                            <div className="flex-1 max-w-2xl border-b-2 border-slate-50 focus-within:border-[#7E2259]/20 transition-all pb-2">
                                                <input
                                                    type="text"
                                                    placeholder="(Google drive link or youtube video link is applicable)"
                                                    className="w-full bg-transparent outline-none text-sm font-bold text-slate-600 placeholder-slate-200"
                                                    value={videoLink}
                                                    onChange={(e) => setVideoLink(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeSubTab === 'Description' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* Toolbar */}
                                <div className="flex items-center gap-6 pb-4 border-b border-slate-50">
                                    <div className="flex items-center gap-6">
                                        <button className="text-slate-400 hover:text-slate-900 transition-colors">
                                            <span className="font-serif font-black text-lg">B</span>
                                        </button>
                                        <button className="text-slate-400 hover:text-slate-900 transition-colors italic font-serif text-lg">
                                            I
                                        </button>
                                        <button className="text-slate-400 hover:text-slate-900 transition-colors">
                                            <List size={18} />
                                        </button>
                                        <button className="text-slate-400 hover:text-slate-900 transition-colors">
                                            <LinkIcon size={18} />
                                        </button>
                                    </div>
                                    <div className="w-px h-6 bg-slate-100" />
                                    <button className="text-slate-400 hover:text-slate-900 transition-colors">
                                        <ImageIcon size={18} />
                                    </button>
                                </div>

                                {/* Editor Area */}
                                <div className="relative">
                                    <textarea
                                        className="w-full min-h-[400px] bg-transparent outline-none text-xl font-bold text-blue-400/50 placeholder-blue-300/30 resize-none leading-relaxed"
                                        placeholder="Write your content description here..."
                                    />
                                    <div className="absolute bottom-0 right-0 py-4 text-[11px] font-bold text-slate-300 tracking-wide">
                                        Last saved 2 mins ago
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSubTab === 'Additional attachment' && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* File Upload Row */}
                                <div className="flex items-center gap-10">
                                    <span className="text-sm font-bold text-slate-700 min-w-[100px]">File :</span>
                                    <div className="flex-1 flex items-center gap-6">
                                        <div className="flex-1 border-b-2 border-slate-900/80 pb-1" />
                                        <button
                                            onClick={() => setIsUploadModalOpen(true)}
                                            className="bg-[#7E2259] text-white px-8 py-3 rounded-full text-sm font-black flex items-center gap-3 shadow-lg shadow-[#7E2259]/20 hover:bg-[#6D1F4D] transition-all whitespace-nowrap"
                                        >
                                            <Upload size={16} />
                                            Upload your file
                                        </button>
                                    </div>
                                </div>

                                {/* Link Input Row */}
                                <div className="flex items-center gap-10">
                                    <span className="text-sm font-bold text-slate-700 min-w-[100px]">Link :</span>
                                    <div className="flex-1 border-b-2 border-slate-900/80 pb-1">
                                        <input
                                            type="text"
                                            placeholder="e.g : www.google.com"
                                            className="w-full bg-transparent outline-none text-sm font-bold text-blue-400 placeholder-blue-300 italic"
                                        />
                                    </div>
                                </div>

                                {/* Info Box */}
                                <div className="bg-[#F0F7FF] rounded-xl p-6 flex items-start gap-4 border-l-4 border-[#0066FF] mt-10 shadow-sm border border-blue-50">
                                    <div className="bg-[#0066FF] p-1.5 rounded-full mt-0.5">
                                        <Info size={14} className="text-white" />
                                    </div>
                                    <p className="text-[13px] font-bold text-slate-500 leading-relaxed">
                                        Attachments allow students to download supporting materials for this lesson. You can upload local files or link to external resources.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Section Refresh */}
                    <div className="px-12 py-10 bg-slate-50/5 border-t border-slate-50 flex items-center justify-end gap-10">
                        <button
                            onClick={() => navigate(-1)}
                            className="text-sm font-black text-slate-400 hover:text-slate-600 transition-all tracking-wider"
                        >
                            {activeSubTab === 'Additional attachment' ? 'Discard' : activeSubTab === 'Description' ? 'Cancel' : 'Discard Changes'}
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="bg-[#7E2259] text-white px-14 py-4 rounded-xl font-black shadow-2xl shadow-[#7E2259]/20 hover:bg-[#6D1F4D] transition-all tracking-wider active:scale-95"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>

                {/* Preview & Tips Section (Only if not in Description and Attachments) */}
                {activeSubTab === 'Content' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Preview Box */}
                        <div className="lg:col-span-2 bg-[#E8EDF3]/40 rounded-[2.5rem] border-2 border-dashed border-[#BCCADA] p-12 min-h-[400px] flex flex-col items-center justify-center gap-6 text-center animate-in fade-in duration-700">
                            <div className="w-24 h-24 bg-white/50 backdrop-blur-sm rounded-3xl shadow-sm flex items-center justify-center text-slate-400">
                                <ImageIcon size={48} strokeWidth={1} />
                            </div>
                            <span className="text-lg font-bold text-slate-400/80">Image Preview will appear here</span>
                        </div>

                        {/* Quick Tips */}
                        <div className="bg-white rounded-3xl border border-slate-100 p-10 shadow-sm space-y-8 h-fit animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
                            <div className="flex items-center gap-4 pb-2 border-b border-slate-50">
                                <div className="bg-[#7E2259] p-2 rounded-lg">
                                    <Info size={18} className="text-white" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Quick Tips</h3>
                            </div>

                            <ul className="space-y-5">
                                {[
                                    'Use high resolution JPG or PNG files.',
                                    'Max file size is 10MB.',
                                    'Aspect ratio 16:9 recommended for best display.'
                                ].map((tip, i) => (
                                    <li key={i} className="flex items-start gap-4">
                                        <CheckCircle size={18} className="text-[#22C55E] mt-0.5 shrink-0" />
                                        <span className="text-sm font-bold text-slate-500 leading-relaxed">{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </main>

            <footer className="py-8 text-center bg-white border-t border-slate-50">
                <p className="text-sm font-bold text-slate-400">
                    © 2024 E-Learning Content Management System. All rights reserved.
                </p>
            </footer>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => setIsUploadModalOpen(false)}
                    />
                    <div className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl relative z-10 overflow-hidden transform transition-all animate-in zoom-in-95 duration-300">
                        <div className="p-8 flex items-center justify-between border-b border-slate-50">
                            <div className="flex items-center gap-4">
                                <div className="bg-[#FDF2F8] p-2 rounded-lg">
                                    <div className="bg-[#7E2259] p-1 rounded-md">
                                        <Upload size={14} className="text-white" />
                                    </div>
                                </div>
                                <h2 className="text-xl font-black text-slate-800">Upload Document</h2>
                            </div>
                            <button
                                onClick={() => setIsUploadModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="aspect-[16/9] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-4 group cursor-pointer hover:border-[#7E2259]/30 hover:bg-slate-50/50 transition-all">
                                <div className="w-16 h-16 bg-[#F8F9FB] rounded-2xl flex items-center justify-center text-[#7E2259] group-hover:scale-110 transition-transform">
                                    <div className="bg-[#7E2259] p-2.5 rounded-xl">
                                        <Upload size={24} className="text-white" />
                                    </div>
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-lg font-bold text-slate-700">
                                        Drag and drop your file here or <span className="text-[#7E2259] underline decoration-2 underline-offset-4">click to browse</span>
                                    </p>
                                    <p className="text-xs font-bold text-slate-400">PDF, DOCX, XLSX, JPG or PNG (max. 10MB)</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider">
                                    <span className="text-slate-400 italic font-serif normal-case text-xs font-bold">No file selected</span>
                                    <span className="text-slate-300">0%</span>
                                </div>
                                <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#7E2259] w-0 transition-all duration-500" />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-6 pt-4">
                                <button
                                    onClick={() => setIsUploadModalOpen(false)}
                                    className="text-sm font-black text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => setIsUploadModalOpen(false)}
                                    className="bg-[#7E2259] text-white px-10 py-3.5 rounded-xl font-black shadow-xl shadow-[#7E2259]/20 hover:bg-[#6D1F4D] transition-all active:scale-95"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Float Toggle */}
            <button className="fixed bottom-10 right-10 w-16 h-16 bg-white rounded-full text-slate-800 shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 border border-gray-100">
                <Moon size={24} />
            </button>
        </div>
    );
};

export default ContentEditor;
