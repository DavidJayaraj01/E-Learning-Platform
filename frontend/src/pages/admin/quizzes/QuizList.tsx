import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Plus,
  Edit,
  Trash2,
  HelpCircle,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  Award,
} from 'lucide-react';
import { quizzesApi, coursesApi } from '../../../services/api';
import type { Quiz, Course } from '../../../types/api';
import { toast } from 'sonner';

const QuizList: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
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
      const [courseData, quizzesData] = await Promise.all([
        coursesApi.get(parseInt(courseId!)),
        quizzesApi.getByCourse(parseInt(courseId!)),
      ]);
      setCourse(courseData);
      setQuizzes(quizzesData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (quizId: number) => {
    try {
      await quizzesApi.delete(quizId);
      toast.success('Quiz deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete quiz');
    } finally {
      setDeleteModalOpen(null);
    }
  };

  const getTotalPoints = (quiz: Quiz) => {
    return quiz.questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0;
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
              onClick={() => navigate(`/admin/courses/${courseId}/lessons`)}
              className="flex items-center gap-2 text-slate-600 hover:text-[#7E2259] transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="font-medium">Back to Lessons</span>
            </button>
          </div>
          <button
            onClick={() => navigate(`/admin/courses/${courseId}/quizzes/new`)}
            className="flex items-center gap-2 bg-[#7E2259] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#601a44] transition-colors shadow-lg shadow-[#7E2259]/20"
          >
            <Plus size={18} />
            Create Quiz
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Info */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <HelpCircle className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Course Quizzes</h1>
              <p className="text-sm text-slate-500">{course?.title} • {quizzes.length} quizzes</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <HelpCircle className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{quizzes.length}</p>
                <p className="text-sm text-slate-500">Total Quizzes</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {quizzes.reduce((sum, q) => sum + (q.questions?.length || 0), 0)}
                </p>
                <p className="text-sm text-slate-500">Total Questions</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Award className="text-amber-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {quizzes.reduce((sum, q) => sum + getTotalPoints(q), 0)}
                </p>
                <p className="text-sm text-slate-500">Total Points</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quizzes List */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">All Quizzes</h2>
          </div>

          {quizzes.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="text-purple-500" size={32} />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">No quizzes yet</h3>
              <p className="text-slate-500 mb-6">Create your first quiz to assess student knowledge</p>
              <button
                onClick={() => navigate(`/admin/courses/${courseId}/quizzes/new`)}
                className="inline-flex items-center gap-2 bg-[#7E2259] text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-[#601a44] transition-colors"
              >
                <Plus size={18} />
                Create First Quiz
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="p-5 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-slate-900 truncate">{quiz.title}</h3>
                        {quiz.is_active ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                            <CheckCircle size={12} />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                            <AlertCircle size={12} />
                            Draft
                          </span>
                        )}
                      </div>

                      {quiz.description && (
                        <p className="text-sm text-slate-500 mb-3 line-clamp-2">{quiz.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <HelpCircle size={14} />
                          {quiz.questions?.length || 0} questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Award size={14} />
                          {getTotalPoints(quiz)} points
                        </span>
                        {quiz.time_limit && (
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {quiz.time_limit} mins
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Target size={14} />
                          {quiz.passing_score}% to pass
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => navigate(`/admin/courses/${courseId}/quizzes/${quiz.id}/edit`)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteModalOpen(quiz.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                <h3 className="text-lg font-bold text-slate-900">Delete Quiz</h3>
                <p className="text-sm text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete this quiz? All questions and student attempts will be permanently removed.
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

export default QuizList;
