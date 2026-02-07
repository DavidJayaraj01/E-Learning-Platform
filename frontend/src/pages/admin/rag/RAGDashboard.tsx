import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  FileText,
  Upload,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  Plus,
  BookOpen,
} from 'lucide-react';
import { ragApi } from '../../../services/api';
import type { UploadedDocument, CourseGenerationJob } from '../../../types/api';
import { toast } from 'sonner';

const RAGDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [jobs, setJobs] = useState<CourseGenerationJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [docsData, jobsData] = await Promise.all([
        ragApi.listDocuments(),
        ragApi.listJobs(),
      ]);
      setDocuments(docsData.documents);
      setJobs(jobsData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string, size = 16) => {
    switch (status) {
      case 'completed':
      case 'processed':
        return <CheckCircle className="text-green-500" size={size} />;
      case 'failed':
      case 'error':
        return <AlertCircle className="text-red-500" size={size} />;
      case 'analyzing':
      case 'generating_structure':
      case 'generating_content':
      case 'generating_quizzes':
        return <Loader2 className="text-blue-500 animate-spin" size={size} />;
      default:
        return <Clock className="text-amber-500" size={size} />;
    }
  };

  const isJobInProgress = (status: string) => {
    return ['pending', 'analyzing', 'generating_structure', 'generating_content', 'generating_quizzes'].includes(status);
  };

  const processedDocs = documents.filter(d => d.status === 'processed');
  const pendingJobs = jobs.filter(j => isJobInProgress(j.status));
  const completedJobs = jobs.filter(j => j.status === 'completed');

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#7E2259] to-purple-600 rounded-lg">
              <Sparkles className="text-white" size={20} />
            </div>
            <h1 className="text-lg font-bold text-slate-900">AI Course Generation</h1>
          </div>
          <button
            onClick={() => navigate('/admin/rag/generate')}
            className="flex items-center gap-2 bg-[#7E2259] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#601a44] transition-colors shadow-lg shadow-[#7E2259]/20"
          >
            <Plus size={18} />
            New Generation
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{documents.length}</p>
                <p className="text-sm text-slate-500">Documents</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{processedDocs.length}</p>
                <p className="text-sm text-slate-500">Processed</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Loader2 className="text-amber-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{pendingJobs.length}</p>
                <p className="text-sm text-slate-500">In Progress</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{completedJobs.length}</p>
                <p className="text-sm text-slate-500">Courses Generated</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Generate Card */}
            <div className="bg-gradient-to-br from-[#7E2259] to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold mb-2">Generate New Course</h2>
                  <p className="text-white/80 text-sm mb-4">
                    Use AI to automatically create courses from your documents
                  </p>
                  <button
                    onClick={() => navigate('/admin/rag/generate')}
                    className="flex items-center gap-2 bg-white text-[#7E2259] px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-100 transition-colors"
                  >
                    <Sparkles size={16} />
                    Start Generation
                  </button>
                </div>
                <Sparkles size={48} className="text-white/20" />
              </div>
            </div>

            {/* Upload Documents Card */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                  <Upload size={20} className="text-[#7E2259]" />
                  Documents
                </h2>
                <button
                  onClick={() => navigate('/admin/rag/documents')}
                  className="text-sm text-[#7E2259] font-medium hover:underline"
                >
                  Manage
                </button>
              </div>

              {documents.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="text-slate-400" size={24} />
                  </div>
                  <p className="text-slate-500 mb-4">No documents uploaded yet</p>
                  <button
                    onClick={() => navigate('/admin/rag/documents')}
                    className="text-[#7E2259] font-medium hover:underline"
                  >
                    Upload Documents
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.slice(0, 4).map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                    >
                      {getStatusIcon(doc.status)}
                      <span className="flex-1 text-sm text-slate-700 truncate">
                        {doc.filename}
                      </span>
                      <span className="text-xs text-slate-400">
                        {doc.total_chunks} chunks
                      </span>
                    </div>
                  ))}
                  {documents.length > 4 && (
                    <button
                      onClick={() => navigate('/admin/rag/documents')}
                      className="w-full p-2 text-sm text-slate-500 hover:text-[#7E2259] transition-colors"
                    >
                      View all {documents.length} documents
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Recent Jobs */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Generation Jobs</h2>
              <button
                onClick={() => navigate('/admin/rag/jobs')}
                className="text-sm text-[#7E2259] font-medium hover:underline"
              >
                View All
              </button>
            </div>

            {jobs.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="text-slate-400" size={24} />
                </div>
                <p className="text-slate-500 mb-2">No generation jobs yet</p>
                <p className="text-sm text-slate-400">
                  Start your first AI-powered course generation
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {jobs.slice(0, 5).map((job) => (
                  <button
                    key={job.id}
                    onClick={() => navigate(`/admin/rag/jobs/${job.id}`)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    {getStatusIcon(job.status, 20)}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 truncate">
                        {job.settings?.course_title || `Job #${job.id}`}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {new Date(job.created_at).toLocaleDateString()} • {job.status}
                      </p>
                    </div>
                    <ChevronRight className="text-slate-300" size={20} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Getting Started (shown when no documents) */}
        {documents.length === 0 && (
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
            <h3 className="font-bold text-slate-900 mb-4">Getting Started with AI Generation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">Upload Documents</h4>
                  <p className="text-sm text-slate-500">PDF, TXT, or DOC files with your course content</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">Configure Settings</h4>
                  <p className="text-sm text-slate-500">Set course title, lessons, and quiz options</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">Generate Course</h4>
                  <p className="text-sm text-slate-500">AI creates lessons and quizzes automatically</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default RAGDashboard;
