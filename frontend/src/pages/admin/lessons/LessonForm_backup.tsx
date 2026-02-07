import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Save,
  Loader2,
  PlayCircle,
  FileText,
  Image as ImageIcon,
  HelpCircle,
  Link as LinkIcon,
  Sparkles,
  Upload,
  X,
  Wand2,
} from 'lucide-react';
import { lessonsApi, coursesApi, aiApi } from '../../../services/api';
import type { LessonCreate, LessonUpdate, Course } from '../../../types/api';
import { toast } from 'sonner';

type LessonType = 'VIDEO' | 'DOCUMENT' | 'IMAGE' | 'QUIZ';

const LESSON_TYPES = [
  { value: 'VIDEO', label: 'Video', icon: PlayCircle, color: 'red', description: 'YouTube, Vimeo or uploaded video' },
  { value: 'DOCUMENT', label: 'Document', icon: FileText, color: 'blue', description: 'PDF, text, or rich content' },
  { value: 'IMAGE', label: 'Image', icon: ImageIcon, color: 'green', description: 'Image with description' },
  { value: 'QUIZ', label: 'Quiz', icon: HelpCircle, color: 'purple', description: 'Interactive quiz lesson' },
];

const LessonForm: React.FC = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const isEditing = !!lessonId;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [contentMode, setContentMode] = useState<'manual' | 'ai' | 'upload' | 'rag'>('manual');
  
  // RAG specific state
  const [ragFile, setRagFile] = useState<File | null>(null);
  const [ragPrompt, setRagPrompt] = useState('');
  const [isRagProcessing, setIsRagProcessing] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    lesson_type: 'DOCUMENT' as 'VIDEO' | 'DOCUMENT' | 'IMAGE' | 'QUIZ',
    description: '',
    content: '',
    video_url: '',
    duration: '',
    order_index: 0,
  });

  useEffect(() => {
    fetchCourse();
    if (isEditing && lessonId) {
      fetchLesson();
    }
  }, [courseId, lessonId]);

  const fetchCourse = async () => {
    try {
      const data = await coursesApi.get(parseInt(courseId!));
      setCourse(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch course');
    }
  };

  const fetchLesson = async () => {
    setIsLoading(true);
    try {
      const lesson = await lessonsApi.get(parseInt(lessonId!));
      setFormData({
        title: lesson.title,
        lesson_type: lesson.lesson_type,
        description: lesson.description || '',
        content: lesson.content || '',
        video_url: lesson.video?.url || '',
        duration: lesson.duration || '',
        order_index: lesson.order_index,
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch lesson');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Parse duration to seconds for backend
      const durationInSeconds = formData.duration ? parseInt(formData.duration) * 60 : undefined;
      
      if (isEditing) {
        const updateData: LessonUpdate = {
          title: formData.title,
          lesson_type: formData.lesson_type,
          description: formData.description || undefined,
          content: formData.content || undefined,
          order_index: formData.order_index,
        };
        await lessonsApi.update(parseInt(lessonId!), updateData);
        toast.success('Lesson updated successfully');
      } else {
        const createData: LessonCreate = {
          course_id: parseInt(courseId!),
          title: formData.title,
          lesson_type: formData.lesson_type,
          description: formData.description || undefined,
          content: formData.content || undefined,
          order_index: formData.order_index,
        };
        await lessonsApi.create(createData);
        toast.success('Lesson created successfully');
      }
      navigate(`/admin/courses/${courseId}/lessons`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save lesson');
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'VIDEO': return { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-300' };
      case 'DOCUMENT': return { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-300' };
      case 'IMAGE': return { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-300' };
      case 'QUIZ': return { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-300' };
      default: return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' };
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a topic or prompt');
      return;
    }

    if (!courseId) {
      toast.error('Course ID is required');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await aiApi.generateAndSaveLesson({
        course_id: parseInt(courseId),
        topic: aiPrompt,
        lesson_type: formData.lesson_type,
        additional_context: course?.title ? `This is for a course titled "${course.title}"` : undefined,
      });

      toast.success(response.message || 'Lesson generated and saved successfully!');
      navigate(`/admin/courses/${courseId}/lessons`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate lesson. Make sure Ollama is running and you have permission.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if we're in RAG mode or regular upload mode
    if (contentMode === 'rag') {
      setRagFile(file);
      toast.success(`Book uploaded: ${file.name}`);
    } else {
      setUploadedFile(file);
      toast.success(`File uploaded: ${file.name}`);
    }
  };

  const handleRagGenerate = async () => {
    if (!ragFile) {
      toast.error('Please upload a book first');
      return;
    }

    if (!ragPrompt.trim()) {
      toast.error('Please specify what you want to extract from the book');
      return;
    }

    setIsRagProcessing(true);
    try {
      const response = await aiApi.generateFromDocument(ragFile, {
        extraction_type: 'lesson',
        topic_focus: ragPrompt,
        content_requirements: `Generate detailed lesson content for: ${ragPrompt}`,
        difficulty_level: 'intermediate',
        include_examples: true,
      });

      // Update form with generated content
      setFormData(prev => ({
        ...prev,
        title: response.title_suggestion || `Lesson: ${ragPrompt}`,
        content: response.content,
      }));

      toast.success('Content generated successfully from your book!');
      setContentMode('manual'); // Switch to manual mode to show the generated content
    } catch (error: any) {
      toast.error(error.message || 'Failed to process the book. Please try again.');
    } finally {
      setIsRagProcessing(false);
    }
  };

  const removeRagFile = () => {
    setRagFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

    // Validate file type based on lesson type
    if (formData.lesson_type === 'DOCUMENT') {
      if (!file.type.match(/text.*|application\/pdf|application\/msword|application\/vnd.openxmlformats/)) {
        toast.error('Please upload a document file (PDF, DOC, TXT)');
        return;
      }
    } else if (formData.lesson_type === 'IMAGE') {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
    }

    setUploadedFile(file);

    // Read text files and populate description
    if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFormData(prev => ({ ...prev, description: content }));
        toast.success('File content loaded');
      };
      reader.readAsText(file);
    } else {
      toast.success(`File "${file.name}" uploaded`);
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/admin/courses/${courseId}/lessons`)}
              className="flex items-center gap-2 text-slate-600 hover:text-[#7E2259] transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="font-medium">Back to Lessons</span>
            </button>
          </div>
          <button
            type="submit"
            form="lesson-form"
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#7E2259] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#601a44] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#7E2259]/20"
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                {isEditing ? 'Update' : 'Create'} Lesson
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Context */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#7E2259] to-[#a855f7] flex items-center justify-center text-white font-bold">
              {course?.title.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Adding lesson to</p>
              <p className="font-bold text-slate-900">{course?.title}</p>
            </div>
          </div>
        </div>

        <form id="lesson-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Page Title */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isEditing ? 'Edit Lesson' : 'Create New Lesson'}
            </h1>
            <p className="text-slate-500 mt-1">
              {isEditing ? 'Update lesson details and content' : 'Add a new lesson to your course'}
            </p>
          </div>

          {/* Lesson Type Selection */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-bold text-slate-900 mb-4">Lesson Type</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {LESSON_TYPES.map((type) => {
                const Icon = type.icon;
                const colors = getTypeColor(type.value);
                const isSelected = formData.lesson_type === type.value;
                
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, lesson_type: type.value })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? `${colors.border} ${colors.bg}`
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`mx-auto mb-2 ${isSelected ? colors.text : 'text-slate-400'}`} size={24} />
                    <p className={`text-sm font-bold ${isSelected ? colors.text : 'text-slate-600'}`}>
                      {type.label}
                    </p>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-3">
              {LESSON_TYPES.find(t => t.value === formData.lesson_type)?.description}
            </p>
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-slate-900">Lesson Details</h2>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Lesson Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7E2259]/20 focus:border-[#7E2259] transition-colors"
                placeholder="Enter lesson title"
              />
            </div>

            {/* Lesson Content */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Lesson Content
              </label>
              <textarea
                value={formData.content || ''}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7E2259]/20 focus:border-[#7E2259] transition-colors resize-none"
                placeholder="Enter the main lesson content here. This will be generated automatically when you use RAG to extract content from books..."
              />
              <p className="text-xs text-slate-500 mt-2">
                Markdown formatting is supported. This field will be auto-filled when using RAG content generation.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Duration
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7E2259]/20 focus:border-[#7E2259] transition-colors"
                  placeholder="e.g., 15 mins"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Order Index
                </label>
                <input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7E2259]/20 focus:border-[#7E2259] transition-colors"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Video URL (shown for video type) */}
          {formData.lesson_type === 'VIDEO' && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-bold text-slate-900 mb-4">Video Content</h2>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Video URL
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7E2259]/20 focus:border-[#7E2259] transition-colors"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Supported: YouTube, Vimeo, or direct video URLs
                </p>
              </div>
            </div>
          )}

          {/* Content Text (for document, image types) */}
          {(formData.lesson_type === 'DOCUMENT' || formData.lesson_type === 'IMAGE') && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-bold text-slate-900 mb-4">
                {formData.lesson_type === 'DOCUMENT' ? 'Document Content' : 'Image Description'}
              </h2>

              {/* Content Mode Tabs */}
              <div className="flex gap-2 mb-4 flex-wrap">
                <button
                  type="button"
                  onClick={() => setContentMode('manual')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    contentMode === 'manual'
                      ? 'bg-[#7E2259] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <FileText size={16} />
                  Manual
                </button>
                <button
                  type="button"
                  onClick={() => setContentMode('ai')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    contentMode === 'ai'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Sparkles size={16} />
                  AI Generate
                </button>
                <button
                  type="button"
                  onClick={() => setContentMode('rag')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    contentMode === 'rag'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Wand2 size={16} />
                  📚 RAG Extract
                </button>
                <button
                  type="button"
                  onClick={() => setContentMode('upload')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    contentMode === 'upload'
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Upload size={16} />
                  Upload
                </button>
              </div>

              {/* AI Generation Mode */}
              {contentMode === 'ai' && (
                <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Wand2 className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-purple-900">AI Content Generator</h3>
                      <p className="text-sm text-purple-700">
                        Enter a topic and let AI create the content for you using Gemma 12B
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Enter topic (e.g., 'Introduction to Python variables')"
                      className="flex-1 px-4 py-3 rounded-xl border border-purple-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAIGenerate())}
                    />
                    <button
                      type="button"
                      onClick={handleAIGenerate}
                      disabled={isGenerating || !aiPrompt.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          Generate
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* RAG Mode - Book Processing */}
              {contentMode === 'rag' && (
                <div className="mb-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Wand2 className="text-emerald-600" size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-emerald-900">📚 RAG Content Extractor</h3>
                      <p className="text-sm text-emerald-700">
                        Upload a book and extract specific lesson content using Gemma 3 4B
                      </p>
                    </div>
                  </div>

                  {/* File Upload Area */}
                  <div className="mb-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      accept=".txt,.md,.pdf,.doc,.docx"
                      className="hidden"
                    />
                    
                    {ragFile ? (
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-emerald-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 rounded-lg">
                            <FileText className="text-emerald-600" size={20} />
                          </div>
                          <div>
                            <p className="font-semibold text-emerald-900">{ragFile.name}</p>
                            <p className="text-sm text-emerald-700">
                              {(ragFile.size / 1024 / 1024).toFixed(2)} MB • Ready for processing
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removeRagFile}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-emerald-300 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-25 transition-colors"
                      >
                        <Upload className="mx-auto text-emerald-500 mb-4" size={48} />
                        <h4 className="font-semibold text-emerald-900 mb-2">Click to upload book</h4>
                        <p className="text-sm text-emerald-600">
                          Supports: TXT, MD, PDF, DOC, DOCX
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Content Extraction Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-emerald-800 mb-2">
                      What do you want to extract from the book?
                    </label>
                    <textarea
                      value={ragPrompt}
                      onChange={(e) => setRagPrompt(e.target.value)}
                      placeholder="e.g., 'Explain the fundamentals of machine learning algorithms' or 'Create a lesson about neural networks'"
                      className="w-full px-4 py-3 rounded-xl border border-emerald-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 h-24 resize-none"
                    />
                    <p className="text-xs text-emerald-600 mt-2">
                      Be specific about what you want to learn or teach from the uploaded book
                    </p>
                  </div>

                  {/* Generate Button */}
                  <button
                    type="button"
                    onClick={handleRagGenerate}
                    disabled={isRagProcessing || !ragFile || !ragPrompt.trim()}
                    className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isRagProcessing ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Processing Book with Gemma 3 4B...
                      </>
                    ) : (
                      <>
                        <Wand2 size={18} />
                        Extract Content from Book
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Upload Mode */}
              {contentMode === 'upload' && (
                <div className="mb-4 p-4 bg-green-50 rounded-xl border border-green-200">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    accept={formData.lesson_type === 'IMAGE' ? 'image/*' : '.txt,.md,.pdf,.doc,.docx'}
                    className="hidden"
                  />
                  {uploadedFile ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          {formData.lesson_type === 'IMAGE' ? (
                            <ImageIcon className="text-green-600" size={20} />
                          ) : (
                            <FileText className="text-green-600" size={20} />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-green-900">{uploadedFile.name}</p>
                          <p className="text-sm text-green-700">
                            {(uploadedFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeUploadedFile}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-8 border-2 border-dashed border-green-300 rounded-xl text-center hover:bg-green-100/50 transition-colors"
                    >
                      <Upload className="mx-auto mb-2 text-green-500" size={32} />
                      <p className="font-semibold text-green-900">Click to upload file</p>
                      <p className="text-sm text-green-700">
                        {formData.lesson_type === 'IMAGE'
                          ? 'Supports: JPG, PNG, GIF, WebP'
                          : 'Supports: TXT, MD, PDF, DOC'}
                      </p>
                    </button>
                  )}
                </div>
              )}

              {/* Content Textarea */}
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={10}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7E2259]/20 focus:border-[#7E2259] transition-colors resize-none"
                placeholder={formData.lesson_type === 'DOCUMENT' 
                  ? 'Enter the lesson content here. You can use markdown formatting...'
                  : 'Enter a description for the image content...'}
              />
              <p className="text-xs text-slate-500 mt-2">
                Markdown formatting is supported
              </p>
            </div>
          )}

          {/* Quiz Type Notice */}
          {formData.lesson_type === 'QUIZ' && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <HelpCircle className="text-purple-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-purple-900">Quiz Content</h3>
                  <p className="text-sm text-purple-700 mt-1">
                    Quiz questions and answers are managed in the Quiz Builder. After creating this lesson, 
                    you can add questions through the course quiz management section.
                  </p>
                  
                  {/* AI Quiz Hint */}
                  <div className="mt-4 p-3 bg-purple-100/50 rounded-lg flex items-start gap-2">
                    <Sparkles className="text-purple-600 mt-0.5" size={16} />
                    <p className="text-xs text-purple-800">
                      <strong>Tip:</strong> You can use AI to automatically generate quiz questions in the Quiz Builder!
                    </p>
                  </div>
                  
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full mt-4 px-4 py-3 rounded-xl border border-purple-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors resize-none"
                    placeholder="Optional: Enter instructions or description for this quiz lesson..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(`/admin/courses/${courseId}/lessons`)}
              className="flex-1 py-3 px-6 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !formData.title}
              className="flex-1 py-3 px-6 rounded-xl bg-[#7E2259] text-white font-bold hover:bg-[#601a44] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : isEditing ? 'Update Lesson' : 'Create Lesson'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default LessonForm;
