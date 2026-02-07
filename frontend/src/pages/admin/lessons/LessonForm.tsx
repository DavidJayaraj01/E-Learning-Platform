import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { lessonsApi, coursesApi } from '../../../services/api';
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

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    lesson_type: 'DOCUMENT' as 'VIDEO' | 'DOCUMENT' | 'IMAGE' | 'QUIZ',
    description: '',
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
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                <div>
                  <h3 className="font-bold text-purple-900">Quiz Content</h3>
                  <p className="text-sm text-purple-700 mt-1">
                    Quiz questions and answers are managed in the Quiz Builder. After creating this lesson, 
                    you can add questions through the course quiz management section.
                  </p>
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
