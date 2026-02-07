import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Plus,
  Edit,
  Trash2,
  PlayCircle,
  FileText,
  Image as ImageIcon,
  HelpCircle,
  Clock,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { lessonsApi, coursesApi } from '../../../services/api';
import type { Lesson, Course } from '../../../types/api';
import { toast } from 'sonner';

const LessonList: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState<number | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [courseData, lessonsData] = await Promise.all([
        coursesApi.get(parseInt(courseId!)),
        lessonsApi.getByCourse(parseInt(courseId!)),
      ]);
      setCourse(courseData);
      setLessons(lessonsData.sort((a, b) => a.order_index - b.order_index));
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (lessonId: number) => {
    try {
      await lessonsApi.delete(lessonId);
      toast.success('Lesson deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete lesson');
    } finally {
      setDeleteModalOpen(null);
    }
  };

  const handleReorder = async (lessonId: number, direction: 'up' | 'down') => {
    const index = lessons.findIndex(l => l.id === lessonId);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === lessons.length - 1)) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const swapLesson = lessons[newIndex];
    
    try {
      await Promise.all([
        lessonsApi.update(lessonId, { order_index: swapLesson.order_index }),
        lessonsApi.update(swapLesson.id, { order_index: lessons[index].order_index }),
      ]);
      fetchData();
    } catch (error: any) {
      toast.error('Failed to reorder lessons');
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video': return <PlayCircle className="text-red-500" size={20} />;
      case 'document': return <FileText className="text-blue-500" size={20} />;
      case 'image': return <ImageIcon className="text-green-500" size={20} />;
      case 'quiz': return <HelpCircle className="text-purple-500" size={20} />;
      default: return <FileText className="text-slate-400" size={20} />;
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/admin/courses/${courseId}/edit`)}
              className="flex items-center gap-2 text-slate-600 hover:text-[#7E2259] transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="font-medium">Back to Course</span>
            </button>
          </div>
          <button
            onClick={() => navigate(`/admin/courses/${courseId}/lessons/new`)}
            className="flex items-center gap-2 bg-[#7E2259] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#601a44] transition-colors shadow-lg shadow-[#7E2259]/20"
          >
            <Plus size={18} />
            Add Lesson
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Info */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#7E2259] to-[#a855f7] flex items-center justify-center text-white font-bold text-xl">
              {course?.title.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{course?.title}</h1>
              <p className="text-sm text-slate-500">{lessons.length} lessons • Manage course content</p>
            </div>
          </div>
        </div>

        {/* Lessons List */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Course Lessons</h2>
          </div>

          {lessons.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="text-slate-400" size={32} />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">No lessons yet</h3>
              <p className="text-slate-500 mb-6">Get started by adding your first lesson</p>
              <button
                onClick={() => navigate(`/admin/courses/${courseId}/lessons/new`)}
                className="inline-flex items-center gap-2 bg-[#7E2259] text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-[#601a44] transition-colors"
              >
                <Plus size={18} />
                Add First Lesson
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group"
                >
                  {/* Order Controls */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleReorder(lesson.id, 'up')}
                      disabled={index === 0}
                      className="p-1 text-slate-300 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => handleReorder(lesson.id, 'down')}
                      disabled={index === lessons.length - 1}
                      className="p-1 text-slate-300 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>

                  {/* Order Number */}
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500">
                    {index + 1}
                  </div>

                  {/* Lesson Icon */}
                  <div className="p-2 bg-slate-50 rounded-lg">
                    {getLessonIcon(lesson.lesson_type)}
                  </div>

                  {/* Lesson Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{lesson.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-medium text-slate-500 uppercase">{lesson.lesson_type}</span>
                      {lesson.duration && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock size={12} />
                            {lesson.duration}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => navigate(`/admin/courses/${courseId}/lessons/${lesson.id}/edit`)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => setDeleteModalOpen(lesson.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Quiz Section */}
        <div className="mt-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <HelpCircle className="text-purple-600" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Course Quizzes</h3>
                <p className="text-sm text-slate-600">Create quizzes to assess student knowledge</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/admin/courses/${courseId}/quizzes`)}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-purple-700 transition-colors"
            >
              <Plus size={18} />
              Manage Quizzes
            </button>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-red-100">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Lesson</h3>
                <p className="text-sm text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete this lesson? All content and progress will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalOpen(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteModalOpen)}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonList;
