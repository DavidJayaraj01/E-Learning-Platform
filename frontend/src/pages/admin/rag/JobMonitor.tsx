import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  BookOpen,
  FileText,
  HelpCircle,
  RefreshCw,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { ragApi } from '../../../services/api';
import type { CourseGenerationJob } from '../../../types/api';
import { toast } from 'sonner';

const isJobInProgress = (status: string) => {
  return ['pending', 'analyzing', 'generating_structure', 'generating_content', 'generating_quizzes'].includes(status);
};

const JobMonitor: React.FC = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<CourseGenerationJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  useEffect(() => {
    if (!isPolling || !job) return;
    
    // Poll for updates if job is in progress
    if (isJobInProgress(job.status)) {
      const interval = setInterval(fetchJob, 3000);
      return () => clearInterval(interval);
    }
  }, [isPolling, job?.status]);

  const fetchJob = async () => {
    try {
      const data = await ragApi.getJob(parseInt(jobId!));
      setJob(data);
      
      if (data.status === 'completed' || data.status === 'failed') {
        setIsPolling(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch job status');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={24} />;
      case 'failed':
      case 'error':
        return <AlertCircle className="text-red-500" size={24} />;
      case 'analyzing':
      case 'generating_structure':
      case 'generating_content':
      case 'generating_quizzes':
        return <Loader2 className="text-blue-500 animate-spin" size={24} />;
      default:
        return <Clock className="text-amber-500" size={24} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-700';
      case 'analyzing':
      case 'generating_structure':
      case 'generating_content':
      case 'generating_quizzes':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-amber-100 text-amber-700';
    }
  };

  const getProgressPercent = () => {
    if (!job) return 0;
    if (job.status === 'completed') return 100;
    if (job.status === 'failed') return 0;
    
    // Use progress_percentage from job if available
    if (job.progress_percentage) return job.progress_percentage;
    
    // Estimate progress based on status
    if (job.status === 'pending') return 10;
    if (job.status === 'analyzing') return 25;
    if (job.status === 'generating_structure') return 40;
    if (job.status === 'generating_content') return 60;
    if (job.status === 'generating_quizzes') return 80;
    return 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7E2259] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900">Job not found</h2>
          <button
            onClick={() => navigate('/admin/rag')}
            className="mt-4 text-[#7E2259] font-medium hover:underline"
          >
            Back to RAG Dashboard
          </button>
        </div>
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
              <span className="font-medium">Back to RAG</span>
            </button>
          </div>
          {isJobInProgress(job.status) && (
            <button
              onClick={fetchJob}
              className="flex items-center gap-2 text-slate-600 hover:text-[#7E2259] transition-colors"
            >
              <RefreshCw size={18} className={isPolling ? 'animate-spin' : ''} />
              Refresh
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Card */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-100 rounded-xl">
              {getStatusIcon(job.status)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {job.settings?.course_title || 'Course Generation'}
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(job.status)}`}>
                  {job.status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
              <p className="text-slate-500">
                Job ID: {job.id} • Started: {new Date(job.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          {isJobInProgress(job.status) && (
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Progress</span>
                <span className="font-medium text-slate-700">{getProgressPercent()}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#7E2259] transition-all duration-500"
                  style={{ width: `${getProgressPercent()}%` }}
                />
              </div>
              {job.current_step && (
                <p className="text-sm text-slate-500 mt-2 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  {job.current_step}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Processing Animation */}
        {isJobInProgress(job.status) && job.status !== 'pending' && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100 p-8 mb-6 text-center">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-purple-200" />
              <div className="absolute inset-0 rounded-full border-4 border-[#7E2259] border-t-transparent animate-spin" />
              <Sparkles className="absolute inset-0 m-auto text-[#7E2259]" size={28} />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">AI is working its magic...</h3>
            <p className="text-slate-600 mt-2">
              Analyzing documents and generating course content. This may take a few minutes.
            </p>
          </div>
        )}

        {/* Error Display */}
        {job.status === 'failed' && job.error_message && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-red-900">Generation Failed</h3>
                <p className="text-red-700 mt-1">{job.error_message}</p>
                <button
                  onClick={() => navigate('/admin/rag/generate')}
                  className="mt-4 text-red-700 font-medium hover:underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Display */}
        {job.status === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
              <div className="flex-1">
                <h3 className="font-bold text-green-900">Generation Complete!</h3>
                <p className="text-green-700 mt-1">
                  Your course has been successfully generated and is ready for review.
                </p>
                {job.generated_course_id && (
                  <button
                    onClick={() => navigate(`/admin/courses/${job.generated_course_id}/edit`)}
                    className="mt-4 inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-700 transition-colors"
                  >
                    <ExternalLink size={16} />
                    View Generated Course
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Generation Details */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-bold text-slate-900 mb-4">Generation Details</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <FileText className="text-blue-500" size={20} />
              <div>
                <p className="text-sm text-slate-500">Document ID</p>
                <p className="font-bold text-slate-900">{job.document_id}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <BookOpen className="text-purple-500" size={20} />
              <div>
                <p className="text-sm text-slate-500">Target Lessons</p>
                <p className="font-bold text-slate-900">{job.settings?.max_lessons || job.settings?.target_lessons || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <HelpCircle className="text-amber-500" size={20} />
              <div>
                <p className="text-sm text-slate-500">Include Quizzes</p>
                <p className="font-bold text-slate-900">{job.settings?.include_quizzes ? 'Yes' : 'No'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <Sparkles className="text-[#7E2259]" size={20} />
              <div>
                <p className="text-sm text-slate-500">Difficulty</p>
                <p className="font-bold text-slate-900 capitalize">{job.settings?.difficulty_level || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Generated Content Preview */}
        {job.generated_outline && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mt-6">
            <h2 className="font-bold text-slate-900 mb-4">Generated Outline</h2>
            <pre className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg overflow-auto max-h-60">
              {JSON.stringify(job.generated_outline, null, 2)}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
};

export default JobMonitor;
