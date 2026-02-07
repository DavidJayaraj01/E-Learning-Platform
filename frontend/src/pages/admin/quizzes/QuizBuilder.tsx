import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  CheckCircle,
  Circle,
  HelpCircle,
  Settings,
  X,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { quizzesApi, coursesApi, aiApi } from '../../../services/api';
import type { Course, QuizCreate, QuizUpdate, QuizQuestion } from '../../../types/api';
import { toast } from 'sonner';

type QuestionType = 'multiple_choice' | 'true_false' | 'open_ended';

interface QuestionFormData {
  id?: number;
  tempId: string;
  question_text: string;
  question_type: string;
  points: number;
  order_index: number;
  answers: AnswerFormData[];
}

interface AnswerFormData {
  id?: number;
  tempId: string;
  answer_text: string;
  is_correct: boolean;
}

const QuizBuilder: React.FC = () => {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const isEditing = !!quizId;

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiSettings, setAiSettings] = useState({
    numQuestions: 5,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    passing_score: 70,
    time_limit: 0,
    is_active: false,
  });

  const [questions, setQuestions] = useState<QuestionFormData[]>([]);

  useEffect(() => {
    fetchCourse();
    if (isEditing && quizId) {
      fetchQuiz();
    }
  }, [courseId, quizId]);

  const fetchCourse = async () => {
    try {
      const data = await coursesApi.get(parseInt(courseId!));
      setCourse(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch course');
    }
  };

  const fetchQuiz = async () => {
    setIsLoading(true);
    try {
      const quiz = await quizzesApi.get(parseInt(quizId!));
      setFormData({
        title: quiz.title,
        description: quiz.description || '',
        passing_score: quiz.passing_score,
        time_limit: quiz.time_limit || 0,
        is_active: quiz.is_active,
      });
      
      if (quiz.questions) {
        setQuestions(quiz.questions.map((q: QuizQuestion, idx: number) => ({
          id: q.id,
          tempId: `q-${q.id}`,
          question_text: q.question_text,
          question_type: q.question_type,
          points: q.points,
          order_index: q.order_index || idx,
          answers: q.answers?.map(a => ({
            id: a.id,
            tempId: `a-${a.id}`,
            answer_text: a.answer_text,
            is_correct: a.is_correct,
          })) || [],
        })));
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addQuestion = () => {
    const newQuestion: QuestionFormData = {
      tempId: generateTempId(),
      question_text: '',
      question_type: 'multiple_choice',
      points: 10,
      order_index: questions.length,
      answers: [
        { tempId: generateTempId(), answer_text: '', is_correct: true },
        { tempId: generateTempId(), answer_text: '', is_correct: false },
      ],
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (tempId: string) => {
    setQuestions(questions.filter(q => q.tempId !== tempId));
  };

  const updateQuestion = (tempId: string, updates: Partial<QuestionFormData>) => {
    setQuestions(questions.map(q => 
      q.tempId === tempId ? { ...q, ...updates } : q
    ));
  };

  const addAnswer = (questionTempId: string) => {
    setQuestions(questions.map(q => {
      if (q.tempId === questionTempId) {
        return {
          ...q,
          answers: [...q.answers, { tempId: generateTempId(), answer_text: '', is_correct: false }],
        };
      }
      return q;
    }));
  };

  const removeAnswer = (questionTempId: string, answerTempId: string) => {
    setQuestions(questions.map(q => {
      if (q.tempId === questionTempId) {
        return {
          ...q,
          answers: q.answers.filter(a => a.tempId !== answerTempId),
        };
      }
      return q;
    }));
  };

  const updateAnswer = (questionTempId: string, answerTempId: string, updates: Partial<AnswerFormData>) => {
    setQuestions(questions.map(q => {
      if (q.tempId === questionTempId) {
        return {
          ...q,
          answers: q.answers.map(a => 
            a.tempId === answerTempId ? { ...a, ...updates } : a
          ),
        };
      }
      return q;
    }));
  };

  const setCorrectAnswer = (questionTempId: string, answerTempId: string) => {
    setQuestions(questions.map(q => {
      if (q.tempId === questionTempId) {
        return {
          ...q,
          answers: q.answers.map(a => ({
            ...a,
            is_correct: a.tempId === answerTempId,
          })),
        };
      }
      return q;
    }));
  };

  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) {
      toast.error('Please enter a topic for the quiz');
      return;
    }

    if (!courseId) {
      toast.error('Course ID is required');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const response = await aiApi.generateAndSaveQuiz({
        course_id: parseInt(courseId),
        topic: aiTopic,
        num_questions: aiSettings.numQuestions,
        difficulty: aiSettings.difficulty,
        passing_score: formData.passing_score || 70,
        time_limit: formData.time_limit || null,
      });

      toast.success(response.message || 'Quiz generated and saved successfully!');
      navigate(`/admin/courses/${courseId}/quizzes`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate quiz. Make sure Ollama is running and you have permission.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!formData.title.trim()) {
      toast.error('Please enter a quiz title');
      return;
    }
    
    if (questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    for (const q of questions) {
      if (!q.question_text.trim()) {
        toast.error('All questions must have text');
        return;
      }
      if (q.answers.length < 2) {
        toast.error('Each question must have at least 2 answers');
        return;
      }
      if (!q.answers.some(a => a.is_correct)) {
        toast.error('Each question must have a correct answer');
        return;
      }
      for (const a of q.answers) {
        if (!a.answer_text.trim()) {
          toast.error('All answers must have text');
          return;
        }
      }
    }

    setIsSaving(true);

    try {
      if (isEditing) {
        // Update quiz
        const updateData: QuizUpdate = {
          title: formData.title,
          description: formData.description || undefined,
          passing_score: formData.passing_score,
          time_limit: formData.time_limit || undefined,
          is_active: formData.is_active,
        };
        await quizzesApi.update(parseInt(quizId!), updateData);

        // Update questions (simplified - in a real app we'd handle adds/removes/updates separately)
        for (const question of questions) {
          if (question.id) {
            // Update existing question
            await quizzesApi.updateQuestion(question.id, {
              question_text: question.question_text,
              question_type: question.question_type as QuestionType,
              points: question.points,
              order_index: question.order_index,
              answers: question.answers.map(a => ({
                id: a.id,
                answer_text: a.answer_text,
                is_correct: a.is_correct,
              })),
            });
          } else {
            // Add new question
            await quizzesApi.addQuestion(parseInt(quizId!), {
              question_text: question.question_text,
              question_type: question.question_type as QuestionType,
              points: question.points,
              order_index: question.order_index,
              answers: question.answers.map(a => ({
                answer_text: a.answer_text,
                is_correct: a.is_correct,
              })),
            });
          }
        }
        
        toast.success('Quiz updated successfully');
      } else {
        // Create quiz with questions
        const createData: QuizCreate = {
          course_id: parseInt(courseId!),
          title: formData.title,
          description: formData.description || undefined,
          passing_score: formData.passing_score,
          time_limit: formData.time_limit || undefined,
          is_active: formData.is_active,
        };
        
        const quiz = await quizzesApi.create(createData);

        // Add questions
        for (const question of questions) {
          await quizzesApi.addQuestion(quiz.id, {
            question_text: question.question_text,
            question_type: question.question_type as QuestionType,
            points: question.points,
            order_index: question.order_index,
            answers: question.answers.map(a => ({
              answer_text: a.answer_text,
              is_correct: a.is_correct,
            })),
          });
        }
        
        toast.success('Quiz created successfully');
      }
      
      navigate(`/admin/courses/${courseId}/quizzes`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save quiz');
    } finally {
      setIsSaving(false);
    }
  };

  const getTotalPoints = () => questions.reduce((sum, q) => sum + q.points, 0);

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
              onClick={() => navigate(`/admin/courses/${courseId}/quizzes`)}
              className="flex items-center gap-2 text-slate-600 hover:text-[#7E2259] transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="font-medium">Back to Quizzes</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-500">Total Points</p>
              <p className="font-bold text-[#7E2259]">{getTotalPoints()}</p>
            </div>
            <button
              type="submit"
              form="quiz-form"
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
                  {isEditing ? 'Update' : 'Create'} Quiz
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form id="quiz-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Page Title */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isEditing ? 'Edit Quiz' : 'Create New Quiz'}
            </h1>
            <p className="text-slate-500 mt-1">{course?.title}</p>
          </div>

          {/* Quiz Settings */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Settings size={20} className="text-slate-400" />
              <h2 className="font-bold text-slate-900">Quiz Settings</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7E2259]/20 focus:border-[#7E2259] transition-colors"
                  placeholder="Enter quiz title"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7E2259]/20 focus:border-[#7E2259] transition-colors resize-none"
                  placeholder="Brief description of the quiz..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.passing_score}
                  onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7E2259]/20 focus:border-[#7E2259] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.time_limit}
                  onChange={(e) => setFormData({ ...formData, time_limit: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7E2259]/20 focus:border-[#7E2259] transition-colors"
                  placeholder="0 = no limit"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  formData.is_active ? 'bg-green-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    formData.is_active ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-slate-700">
                {formData.is_active ? 'Active' : 'Draft'}
              </span>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle size={20} className="text-purple-500" />
                Questions ({questions.length})
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAIPanel(!showAIPanel)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                    showAIPanel
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'border border-purple-200 text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  <Sparkles size={16} />
                  AI Generate
                </button>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-purple-200 text-purple-600 font-medium text-sm hover:bg-purple-50 transition-colors"
                >
                  <Plus size={16} />
                  Add Question
                </button>
              </div>
            </div>

            {/* AI Generation Panel */}
            {showAIPanel && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Wand2 className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-purple-900">AI Quiz Generator</h3>
                    <p className="text-sm text-purple-700">
                      Enter a topic and let AI generate quiz questions using Gemma 12B
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-purple-900 mb-2">
                    Topic / Subject *
                  </label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="e.g., Python Data Types, JavaScript Basics, Machine Learning Fundamentals"
                    className="w-full px-4 py-3 rounded-xl border border-purple-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAIGenerate())}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-purple-900 mb-2">
                      Number of Questions
                    </label>
                    <select
                      value={aiSettings.numQuestions}
                      onChange={(e) => setAiSettings(prev => ({ ...prev, numQuestions: parseInt(e.target.value) }))}
                      className="w-full px-4 py-3 rounded-xl border border-purple-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    >
                      {[3, 5, 7, 10, 15, 20].map(n => (
                        <option key={n} value={n}>{n} questions</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-purple-900 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={aiSettings.difficulty}
                      onChange={(e) => setAiSettings(prev => ({ ...prev, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}
                      className="w-full px-4 py-3 rounded-xl border border-purple-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAIPanel(false)}
                    className="px-4 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAIGenerate}
                    disabled={isGeneratingAI || !aiTopic.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isGeneratingAI ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        Generate Questions
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {questions.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <HelpCircle className="text-purple-500" size={24} />
                </div>
                <p className="text-slate-600 mb-4">No questions yet. Add your first question to get started.</p>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white font-medium text-sm hover:bg-purple-700 transition-colors"
                >
                  <Plus size={16} />
                  Add First Question
                </button>
              </div>
            ) : (
              questions.map((question, qIndex) => (
                <div
                  key={question.tempId}
                  className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden"
                >
                  {/* Question Header */}
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                        {qIndex + 1}
                      </span>
                      <span className="font-medium text-slate-700">Question</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={question.points}
                        onChange={(e) => updateQuestion(question.tempId, { points: parseInt(e.target.value) || 1 })}
                        className="w-16 px-2 py-1 rounded-lg border border-slate-200 text-sm text-center"
                      />
                      <span className="text-sm text-slate-500">pts</span>
                      <button
                        type="button"
                        onClick={() => removeQuestion(question.tempId)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="p-4 space-y-4">
                    <textarea
                      value={question.question_text}
                      onChange={(e) => updateQuestion(question.tempId, { question_text: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors resize-none"
                      placeholder="Enter the question..."
                    />

                    {/* Answers */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-700">Answer Options</p>
                      {question.answers.map((answer, aIndex) => (
                        <div key={answer.tempId} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCorrectAnswer(question.tempId, answer.tempId)}
                            className={`p-1 rounded-full transition-colors ${
                              answer.is_correct
                                ? 'text-green-600'
                                : 'text-slate-300 hover:text-slate-400'
                            }`}
                          >
                            {answer.is_correct ? (
                              <CheckCircle size={20} />
                            ) : (
                              <Circle size={20} />
                            )}
                          </button>
                          <input
                            type="text"
                            value={answer.answer_text}
                            onChange={(e) => updateAnswer(question.tempId, answer.tempId, { answer_text: e.target.value })}
                            className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                              answer.is_correct
                                ? 'border-green-300 bg-green-50'
                                : 'border-slate-200'
                            } focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500`}
                            placeholder={`Option ${aIndex + 1}`}
                          />
                          {question.answers.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeAnswer(question.tempId, answer.tempId)}
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                      {question.answers.length < 6 && (
                        <button
                          type="button"
                          onClick={() => addAnswer(question.tempId)}
                          className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 mt-2"
                        >
                          <Plus size={14} />
                          Add Option
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {questions.length > 0 && (
              <button
                type="button"
                onClick={addQuestion}
                className="w-full py-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 font-medium hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Add Another Question
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(`/admin/courses/${courseId}/quizzes`)}
              className="flex-1 py-3 px-6 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 px-6 rounded-xl bg-[#7E2259] text-white font-bold hover:bg-[#601a44] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : isEditing ? 'Update Quiz' : 'Create Quiz'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default QuizBuilder;
