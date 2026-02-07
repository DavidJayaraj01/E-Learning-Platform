import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileText,
  Settings,
  Play,
  Check,
  Loader2,
  BookOpen,
  Target,
  Zap,
  Brain,
} from 'lucide-react';
import { ragApi } from '../../../services/api';
import type { UploadedDocument, GenerationSettings } from '../../../types/api';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, title: 'Select Documents', icon: FileText },
  { id: 2, title: 'Configure Settings', icon: Settings },
  { id: 3, title: 'Generate', icon: Sparkles },
];

const LLM_PROVIDERS = [
  { id: 'ollama', name: 'Ollama', description: 'Local LLM (Free, Offline)' },
  { id: 'openai', name: 'OpenAI', description: 'GPT-4, GPT-3.5 (API Key Required)' },
  { id: 'gemini', name: 'Google Gemini', description: 'Gemini Pro (API Key Required)' },
];

const DIFFICULTY_LEVELS = [
  { id: 'beginner', name: 'Beginner', description: 'Introductory concepts' },
  { id: 'intermediate', name: 'Intermediate', description: 'Some prior knowledge' },
  { id: 'advanced', name: 'Advanced', description: 'Deep technical content' },
];

const GenerationWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [settings, setSettings] = useState<GenerationSettings>({
    course_title: '',
    course_description: '',
    target_lessons: 5,
    difficulty_level: 'intermediate',
    llm_provider: 'ollama',
    include_quizzes: true,
    quiz_questions_per_lesson: 5,
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await ragApi.listDocuments();
      setDocuments(data.documents.filter((d: UploadedDocument) => d.status === 'processed'));
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDocument = (docId: number) => {
    setSelectedDocs(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleGenerate = async () => {
    if (selectedDocs.length === 0) {
      toast.error('Please select at least one document');
      return;
    }

    if (!settings.course_title?.trim()) {
      toast.error('Please enter a course title');
      return;
    }

    setIsGenerating(true);

    try {
      const job = await ragApi.startGeneration({
        document_ids: selectedDocs,
        ...settings,
      });
      
      toast.success('Course generation started!');
      navigate(`/admin/rag/jobs/${job.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to start generation');
      setIsGenerating(false);
    }
  };

  const canContinue = () => {
    switch (currentStep) {
      case 1:
        return selectedDocs.length > 0;
      case 2:
        return (settings.course_title?.trim() ?? '') !== '';
      default:
        return true;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7E2259] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/rag')}
              className="flex items-center gap-2 text-slate-600 hover:text-[#7E2259] transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="font-medium">Back</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="text-[#7E2259]" size={20} />
            <span className="font-bold text-slate-900">AI Course Generation</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Steps Indicator */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      currentStep === step.id
                        ? 'bg-[#7E2259] text-white'
                        : currentStep > step.id
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check size={20} />
                    ) : (
                      <step.icon size={20} />
                    )}
                  </div>
                  <span
                    className={`font-medium hidden sm:block ${
                      currentStep >= step.id ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step 1: Select Documents */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Select Documents</h1>
              <p className="text-slate-500 mt-1">
                Choose the documents to use for generating your course
              </p>
            </div>

            {documents.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="text-slate-400" size={32} />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">No processed documents</h3>
                <p className="text-slate-500 mb-6">
                  Upload and process some documents first
                </p>
                <button
                  onClick={() => navigate('/admin/rag/documents')}
                  className="inline-flex items-center gap-2 bg-[#7E2259] text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-[#601a44] transition-colors"
                >
                  Upload Documents
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="font-bold text-slate-900">
                    Available Documents ({documents.length})
                  </h2>
                  <span className="text-sm text-slate-500">
                    {selectedDocs.length} selected
                  </span>
                </div>
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {documents.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => toggleDocument(doc.id)}
                      className={`w-full p-4 flex items-center gap-4 text-left transition-colors ${
                        selectedDocs.includes(doc.id)
                          ? 'bg-purple-50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                          selectedDocs.includes(doc.id)
                            ? 'border-[#7E2259] bg-[#7E2259]'
                            : 'border-slate-300'
                        }`}
                      >
                        {selectedDocs.includes(doc.id) && (
                          <Check size={14} className="text-white" />
                        )}
                      </div>
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="text-blue-600" size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900 truncate">
                          {doc.filename}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {doc.total_chunks} chunks available
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Configure Settings */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Configure Settings</h1>
              <p className="text-slate-500 mt-1">
                Customize how your course will be generated
              </p>
            </div>

            {/* Course Details */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <BookOpen size={20} className="text-[#7E2259]" />
                Course Details
              </h2>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Course Title *
                </label>
                <input
                  type="text"
                  value={settings.course_title}
                  onChange={(e) => setSettings({ ...settings, course_title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7E2259]/20 focus:border-[#7E2259] transition-colors"
                  placeholder="e.g., Introduction to Machine Learning"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={settings.course_description}
                  onChange={(e) => setSettings({ ...settings, course_description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7E2259]/20 focus:border-[#7E2259] transition-colors resize-none"
                  placeholder="Brief description of what the course will cover..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    <Target size={14} className="inline mr-1" />
                    Target Lessons
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={settings.target_lessons}
                    onChange={(e) => setSettings({ ...settings, target_lessons: parseInt(e.target.value) || 5 })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7E2259]/20 focus:border-[#7E2259] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={settings.difficulty_level}
                    onChange={(e) => setSettings({ ...settings, difficulty_level: e.target.value as 'beginner' | 'intermediate' | 'advanced' })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7E2259]/20 focus:border-[#7E2259] transition-colors"
                  >
                    {DIFFICULTY_LEVELS.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* LLM Provider */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <Brain size={20} className="text-[#7E2259]" />
                AI Provider
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {LLM_PROVIDERS.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => setSettings({ ...settings, llm_provider: provider.id as 'ollama' | 'openai' | 'gemini' })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      settings.llm_provider === provider.id
                        ? 'border-[#7E2259] bg-purple-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <h3 className="font-bold text-slate-900">{provider.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{provider.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Quiz Settings */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                  <Zap size={20} className="text-[#7E2259]" />
                  Quiz Generation
                </h2>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, include_quizzes: !settings.include_quizzes })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.include_quizzes ? 'bg-green-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.include_quizzes ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {settings.include_quizzes && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Questions per Lesson
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={settings.quiz_questions_per_lesson}
                    onChange={(e) => setSettings({ ...settings, quiz_questions_per_lesson: parseInt(e.target.value) || 5 })}
                    className="w-32 px-4 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7E2259]/20 focus:border-[#7E2259] transition-colors"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Generate */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Ready to Generate</h1>
              <p className="text-slate-500 mt-1">
                Review your settings and start the generation process
              </p>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
              <h2 className="font-bold text-slate-900">Generation Summary</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Course Title</p>
                  <p className="font-bold text-slate-900">{settings.course_title}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Documents Selected</p>
                  <p className="font-bold text-slate-900">{selectedDocs.length}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Target Lessons</p>
                  <p className="font-bold text-slate-900">{settings.target_lessons}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Difficulty</p>
                  <p className="font-bold text-slate-900 capitalize">{settings.difficulty_level}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">AI Provider</p>
                  <p className="font-bold text-slate-900 capitalize">{settings.llm_provider}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Include Quizzes</p>
                  <p className="font-bold text-slate-900">
                    {settings.include_quizzes ? `Yes (${settings.quiz_questions_per_lesson} Q/lesson)` : 'No'}
                  </p>
                </div>
              </div>
            </div>

            {/* Generate CTA */}
            <div className="bg-gradient-to-r from-[#7E2259] to-purple-600 rounded-xl p-8 text-center text-white">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Start Generation</h3>
              <p className="text-white/80 mb-6 max-w-md mx-auto">
                The AI will analyze your documents and create a complete course with lessons
                {settings.include_quizzes && ' and quizzes'}. This may take a few minutes.
              </p>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 bg-white text-[#7E2259] px-8 py-3 rounded-xl font-bold hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    Generate Course
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
            Back
          </button>

          {currentStep < 3 && (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canContinue()}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[#7E2259] text-white font-bold hover:bg-[#601a44] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default GenerationWizard;
