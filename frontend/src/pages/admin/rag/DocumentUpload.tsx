import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Upload,
  FileText,
  Trash2,
  CheckCircle,
  AlertCircle,
  File,
  Loader2,
  Clock,
  Database,
} from 'lucide-react';
import { ragApi } from '../../../services/api';
import type { UploadedDocument } from '../../../types/api';
import { toast } from 'sonner';

const DocumentUpload: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await ragApi.listDocuments();
      setDocuments(data.documents);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (files: FileList) => {
    if (!files.length) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        const validTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.pdf')) {
          toast.error(`Invalid file type: ${file.name}. Supported: PDF, TXT, DOC, DOCX`);
          continue;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File too large: ${file.name}. Maximum size is 10MB`);
          continue;
        }

        await ragApi.uploadDocument(file);
        setUploadProgress(((i + 1) / files.length) * 100);
      }
      
      toast.success(`Successfully uploaded ${files.length} document(s)`);
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (documentId: number) => {
    try {
      await ragApi.deleteDocument(documentId);
      toast.success('Document deleted successfully');
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete document');
    } finally {
      setDeleteModalOpen(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
            <CheckCircle size={12} />
            Processed
          </span>
        );
      case 'processing':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
            <Loader2 size={12} className="animate-spin" />
            Processing
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
            <AlertCircle size={12} />
            Error
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
            <Clock size={12} />
            Pending
          </span>
        );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
              onClick={() => navigate('/admin/rag')}
              className="flex items-center gap-2 text-slate-600 hover:text-[#7E2259] transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="font-medium">Back to RAG</span>
            </button>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 bg-[#7E2259] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#601a44] transition-colors disabled:opacity-50 shadow-lg shadow-[#7E2259]/20"
          >
            <Upload size={18} />
            Upload Documents
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Document Upload</h1>
          <p className="text-slate-500 mt-1">Upload documents to use for AI-powered course generation</p>
        </div>

        {/* Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`bg-white rounded-xl border-2 border-dashed transition-colors p-8 mb-6 text-center ${
            dragActive
              ? 'border-[#7E2259] bg-purple-50'
              : 'border-slate-300 hover:border-[#7E2259]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.doc,.docx"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
            className="hidden"
          />

          {isUploading ? (
            <div className="py-4">
              <Loader2 size={40} className="mx-auto text-[#7E2259] animate-spin mb-4" />
              <p className="font-medium text-slate-700">Uploading documents...</p>
              <div className="w-48 h-2 bg-slate-200 rounded-full mx-auto mt-4 overflow-hidden">
                <div
                  className="h-full bg-[#7E2259] transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="text-[#7E2259]" size={32} />
              </div>
              <p className="font-medium text-slate-700 mb-2">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-sm text-slate-500">
                Supported formats: PDF, TXT, DOC, DOCX (Max 10MB per file)
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-4 py-2 rounded-lg border border-[#7E2259] text-[#7E2259] font-medium text-sm hover:bg-purple-50 transition-colors"
              >
                Select Files
              </button>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{documents.length}</p>
                <p className="text-sm text-slate-500">Total Documents</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {documents.filter(d => d.status === 'processed').length}
                </p>
                <p className="text-sm text-slate-500">Processed</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Database className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {documents.reduce((sum, d) => sum + (d.total_chunks || 0), 0)}
                </p>
                <p className="text-sm text-slate-500">Total Chunks</p>
              </div>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Uploaded Documents</h2>
          </div>

          {documents.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="text-slate-400" size={32} />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">No documents yet</h3>
              <p className="text-slate-500 mb-6">Upload your first document to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <File className="text-blue-600" size={24} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{doc.filename}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      <span>{formatFileSize(doc.file_size || 0)}</span>
                      {doc.total_chunks && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>{doc.total_chunks} chunks</span>
                        </>
                      )}
                      <span className="text-slate-300">•</span>
                      <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {getStatusBadge(doc.status)}

                  <button
                    onClick={() => setDeleteModalOpen(doc.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Generate Course CTA */}
        {documents.some(d => d.status === 'processed') && (
          <div className="mt-6 bg-gradient-to-r from-[#7E2259] to-purple-600 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <h3 className="font-bold text-lg">Ready to Generate?</h3>
                <p className="text-white/80 text-sm mt-1">
                  Use your processed documents to create AI-powered courses
                </p>
              </div>
              <button
                onClick={() => navigate('/admin/rag/generate')}
                className="flex items-center gap-2 bg-white text-[#7E2259] px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-slate-100 transition-colors"
              >
                Generate Course
              </button>
            </div>
          </div>
        )}
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
                <h3 className="text-lg font-bold text-slate-900">Delete Document</h3>
                <p className="text-sm text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete this document? All processed chunks will also be removed.
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

export default DocumentUpload;
