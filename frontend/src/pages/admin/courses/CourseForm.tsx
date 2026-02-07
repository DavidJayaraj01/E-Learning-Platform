import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
  ChevronLeft,
  GraduationCap,
  Save,
  Image,
  Tag,
  DollarSign,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Users,
  Plus,
  X,
  Loader2,
} from 'lucide-react';
import { coursesApi } from '../../../services/api';
import type { CourseCreate } from '../../../types/api';
import { toast } from 'sonner';

const CourseForm: React.FC = () => {
  const { courseId } = useParams();
  const isEditing = Boolean(courseId);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const [formData, setFormData] = useState<CourseCreate>({
    title: '',
    description: '',
    image_url: undefined,
    tags: [],
    website_url: undefined,
    published: true,
    visibility: 'EVERYONE',
    access_type: 'OPEN',
    price: 0,
    course_admin_id: user?.id,
  });

  useEffect(() => {
    if (isEditing && courseId) {
      fetchCourse(parseInt(courseId));
    }
  }, [courseId]);

  const fetchCourse = async (id: number) => {
    setIsLoading(true);
    try {
      const course = await coursesApi.get(id);
      setFormData({
        title: course.title,
        description: course.description || '',
        image_url: course.image_url || '',
        tags: course.tags || [],
        website_url: course.website_url || '',
        published: course.published,
        visibility: course.visibility,
        access_type: course.access_type,
        price: course.price,
        course_admin_id: course.course_admin_id,
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch course');
      navigate('/admin/courses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Course title is required');
      return;
    }

    setIsSaving(true);
    try {
      // Clean up empty URLs - backend expects valid URL or undefined
      const submitData = {
        ...formData,
        image_url: formData.image_url?.trim() || undefined,
        website_url: formData.website_url?.trim() || undefined,
        description: formData.description?.trim() || undefined,
      };
      
      if (isEditing && courseId) {
        await coursesApi.update(parseInt(courseId), submitData);
        toast.success('Course updated successfully');
      } else {
        const newCourse = await coursesApi.create(submitData);
        toast.success('Course created successfully');
        // Redirect to lessons page to start adding content
        navigate(`/admin/courses/${newCourse.id}/lessons`);
        return;
      }
      navigate('/admin/courses');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save course');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim().toUpperCase()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tag) || [],
    });
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
              onClick={() => navigate('/admin/courses')}
              className="flex items-center gap-2 text-slate-600 hover:text-[#7E2259] transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="font-medium">Back</span>
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="bg-[#7E2259] p-1.5 rounded-lg">
                <GraduationCap className="text-white w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Course' : 'Create Course'}
              </span>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#7E2259] text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-[#601a44] transition-colors shadow-lg shadow-[#7E2259]/20 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaving ? 'Saving...' : 'Save Course'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Basic Information</h2>
            
            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Course Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter course title"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7E2259] focus:ring-2 focus:ring-[#7E2259]/10 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter course description"
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7E2259] focus:ring-2 focus:ring-[#7E2259]/10 transition-all resize-none"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Image size={16} className="inline mr-2" />
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7E2259] focus:ring-2 focus:ring-[#7E2259]/10 transition-all"
                />
              </div>

              {/* Website URL */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Globe size={16} className="inline mr-2" />
                  Website URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7E2259] focus:ring-2 focus:ring-[#7E2259]/10 transition-all"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Tag size={16} className="inline mr-2" />
                  Tags
                </label>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {formData.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#7E2259]/10 text-[#7E2259] rounded-full text-sm font-bold"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:bg-[#7E2259]/20 rounded-full p-0.5"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add a tag"
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7E2259] focus:ring-2 focus:ring-[#7E2259]/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Access & Pricing */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Access & Pricing</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Visibility */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Visibility
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors border border-slate-200">
                    <input
                      type="radio"
                      name="visibility"
                      value="EVERYONE"
                      checked={formData.visibility === 'EVERYONE'}
                      onChange={() => setFormData({ ...formData, visibility: 'EVERYONE' })}
                      className="w-4 h-4 text-[#7E2259] focus:ring-[#7E2259]"
                    />
                    <Globe size={18} className="text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-900">Everyone</p>
                      <p className="text-xs text-slate-500">Visible to anyone</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors border border-slate-200">
                    <input
                      type="radio"
                      name="visibility"
                      value="SIGNED_IN"
                      checked={formData.visibility === 'SIGNED_IN'}
                      onChange={() => setFormData({ ...formData, visibility: 'SIGNED_IN' })}
                      className="w-4 h-4 text-[#7E2259] focus:ring-[#7E2259]"
                    />
                    <Users size={18} className="text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-900">Signed In Users</p>
                      <p className="text-xs text-slate-500">Only registered users</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Access Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Access Type
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors border border-slate-200">
                    <input
                      type="radio"
                      name="access"
                      value="OPEN"
                      checked={formData.access_type === 'OPEN'}
                      onChange={() => setFormData({ ...formData, access_type: 'OPEN', price: 0 })}
                      className="w-4 h-4 text-[#7E2259] focus:ring-[#7E2259]"
                    />
                    <Globe size={18} className="text-green-500" />
                    <div>
                      <p className="font-medium text-slate-900">Open Access</p>
                      <p className="text-xs text-slate-500">Free for everyone</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors border border-slate-200">
                    <input
                      type="radio"
                      name="access"
                      value="INVITATION"
                      checked={formData.access_type === 'INVITATION'}
                      onChange={() => setFormData({ ...formData, access_type: 'INVITATION', price: 0 })}
                      className="w-4 h-4 text-[#7E2259] focus:ring-[#7E2259]"
                    />
                    <Lock size={18} className="text-yellow-500" />
                    <div>
                      <p className="font-medium text-slate-900">Invitation Only</p>
                      <p className="text-xs text-slate-500">Requires invite</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors border border-slate-200">
                    <input
                      type="radio"
                      name="access"
                      value="PAYMENT"
                      checked={formData.access_type === 'PAYMENT'}
                      onChange={() => setFormData({ ...formData, access_type: 'PAYMENT' })}
                      className="w-4 h-4 text-[#7E2259] focus:ring-[#7E2259]"
                    />
                    <DollarSign size={18} className="text-purple-500" />
                    <div>
                      <p className="font-medium text-slate-900">Paid Access</p>
                      <p className="text-xs text-slate-500">Requires payment</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Price (shown only for paid access) */}
            {formData.access_type === 'PAYMENT' && (
              <div className="mt-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <DollarSign size={16} className="inline mr-2" />
                  Course Price
                </label>
                <div className="relative max-w-xs">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7E2259] focus:ring-2 focus:ring-[#7E2259]/10 transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Publishing */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Publishing</h2>
            
            <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors border border-slate-200">
              <div className="flex items-center gap-4">
                {formData.published ? (
                  <Eye size={24} className="text-green-500" />
                ) : (
                  <EyeOff size={24} className="text-slate-400" />
                )}
                <div>
                  <p className="font-bold text-slate-900">
                    {formData.published ? 'Course is Published' : 'Course is Draft'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formData.published
                      ? 'Students can see and enroll in this course'
                      : 'Only you can see this course'}
                  </p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-slate-200 peer-checked:bg-[#7E2259] rounded-full transition-colors cursor-pointer" />
                <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-7 shadow-sm" />
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/courses')}
              className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-[#7E2259] text-white rounded-xl font-bold hover:bg-[#601a44] transition-colors shadow-lg shadow-[#7E2259]/20 disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isSaving ? 'Saving...' : isEditing ? 'Update Course' : 'Create Course'}
            </button>
          </div>
        </form>

        {/* Lessons Management Link (only for editing) */}
        {isEditing && courseId && (
          <div className="mt-8 bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Course Content</h2>
                <p className="text-sm text-slate-500">Add lessons, quizzes, and other content to your course</p>
              </div>
              <button
                onClick={() => navigate(`/admin/courses/${courseId}/lessons`)}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                Manage Lessons
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CourseForm;
