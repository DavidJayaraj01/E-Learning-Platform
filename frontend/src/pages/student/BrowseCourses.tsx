import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Clock, CheckCircle, Lock, DollarSign, Loader2, ArrowLeft, Send, CreditCard, X, Shield } from 'lucide-react';
import { coursesApi, invitationsApi } from '../../services/api';
import type { Course } from '../../types/api';
import type { CourseInvitation } from '../../services/api';
import { toast } from 'sonner';

export default function BrowseCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<number>>(new Set());
  const [pendingInvitations, setPendingInvitations] = useState<Set<number>>(new Set());
  const [requestedCourses, setRequestedCourses] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(null);
  const [requestingCourseId, setRequestingCourseId] = useState<number | null>(null);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentCourse, setPaymentCourse] = useState<Course | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    loadCourses();

    const handleFocus = () => {
      loadCourses();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const allCourses = await coursesApi.list();
      const published = allCourses.filter((c: Course) => c.published);
      setCourses(published);

      const enrolled = await coursesApi.getMyCourses();
      setEnrolledCourseIds(new Set(enrolled.map((c: Course) => c.id)));

      // Load pending invitations and requests
      try {
        const invitations = await invitationsApi.getMyInvitations();
        const pending = new Set<number>();
        const requested = new Set<number>();
        invitations.invitations.forEach((inv: CourseInvitation) => {
          if (inv.status === 'pending') pending.add(inv.course_id);
          if (inv.status === 'requested') requested.add(inv.course_id);
        });
        setPendingInvitations(pending);
        setRequestedCourses(requested);
      } catch {
        // User might not have any invitations
      }
    } catch (error) {
      console.error('Failed to load courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async (courseId: number) => {
    try {
      setEnrollingCourseId(courseId);
      await coursesApi.enrollInCourse(courseId);
      toast.success('Successfully enrolled in course!');
      setEnrolledCourseIds(prev => new Set([...prev, courseId]));
    } catch (error: any) {
      console.error('Enrollment failed:', error);
      const message = error.message || error.response?.data?.detail || 'Failed to enroll in course';
      toast.error(message);
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const handleRequestInvitation = async (courseId: number) => {
    try {
      setRequestingCourseId(courseId);
      await invitationsApi.requestInvitation(courseId);
      toast.success('Invitation request sent! The admin will review your request.');
      setRequestedCourses(prev => new Set([...prev, courseId]));
    } catch (error: any) {
      console.error('Request failed:', error);
      toast.error(error.message || 'Failed to request invitation');
    } finally {
      setRequestingCourseId(null);
    }
  };

  const openPaymentModal = (course: Course) => {
    setPaymentCourse(course);
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!paymentCourse) return;
    try {
      setPaymentProcessing(true);
      // Create Stripe checkout session and redirect
      const result = await invitationsApi.createCheckoutSession(paymentCourse.id);
      // Redirect to Stripe Checkout
      window.location.href = result.url;
    } catch (error: any) {
      toast.error(error.message || 'Failed to initiate payment');
      setPaymentProcessing(false);
    }
  };

  const getAccessButton = (course: Course, isEnrolled: boolean) => {
    if (isEnrolled) {
      return (
        <button
          onClick={() => navigate(`/student/course/${course.id}`)}
          className="w-full px-4 py-2.5 bg-green-100 text-green-700 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-green-200 transition-all"
        >
          <CheckCircle className="h-5 w-5" />
          Continue Learning
        </button>
      );
    }

    const hasPendingInvitation = pendingInvitations.has(course.id);
    const hasRequested = requestedCourses.has(course.id);

    switch (course.access_type) {
      case 'INVITATION':
        if (hasPendingInvitation) {
          return (
            <button
              disabled
              className="w-full px-4 py-2.5 bg-green-100 text-green-700 rounded-lg font-medium flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <CheckCircle className="h-5 w-5" />
              Invitation Received
            </button>
          );
        }
        if (hasRequested) {
          return (
            <button
              disabled
              className="w-full px-4 py-2.5 bg-amber-100 text-amber-700 rounded-lg font-medium flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <Clock className="h-5 w-5" />
              Request Pending
            </button>
          );
        }
        return (
          <button
            onClick={() => handleRequestInvitation(course.id)}
            disabled={requestingCourseId === course.id}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            {requestingCourseId === course.id ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Send className="h-5 w-5" />
                Request Invitation
              </>
            )}
          </button>
        );

      case 'PAYMENT':
        return (
          <button
            onClick={() => openPaymentModal(course)}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:from-amber-600 hover:to-orange-600 transition-all"
          >
            <DollarSign className="h-5 w-5" />
            Buy Now - ${course.price || 0}
          </button>
        );

      default: // OPEN
        return (
          <button
            onClick={() => handleEnroll(course.id)}
            disabled={enrollingCourseId === course.id}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center justify-center gap-2"
          >
            {enrollingCourseId === course.id ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Enroll Now'
            )}
          </button>
        );
    }
  };

  const getAccessBadge = (accessType: string) => {
    switch (accessType) {
      case 'INVITATION':
        return (
          <span className="absolute top-3 right-3 px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
            <Lock size={12} />
            Invite Only
          </span>
        );
      case 'PAYMENT':
        return (
          <span className="absolute top-3 right-3 px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
            <DollarSign size={12} />
            Paid
          </span>
        );
      default:
        return null;
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back Button & Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="flex items-center gap-2 text-[var(--inactive)] hover:text-[var(--active)] transition-colors mb-4 font-medium"
          >
            <ArrowLeft size={18} />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">Browse Courses</h1>
          <p className="text-slate-600 text-sm sm:text-base">Discover and enroll in courses to start learning</p>
        </div>

        {/* Search */}
        <div className="mb-6 sm:mb-8">
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
          />
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <BookOpen className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-slate-400 mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-slate-700 mb-2">No courses available</h3>
            <p className="text-slate-500 text-sm sm:text-base">Check back later for new courses</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredCourses.map((course) => {
              const isEnrolled = enrolledCourseIds.has(course.id);
              
              return (
                <div
                  key={course.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-slate-200"
                >
                  {/* Course Image */}
                  <div className="relative h-36 sm:h-48 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 sm:h-20 sm:w-20 text-white opacity-50" />
                    {getAccessBadge(course.access_type)}
                  </div>

                  {/* Course Info */}
                  <div className="p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-slate-600 text-xs sm:text-sm mb-4 line-clamp-2 sm:line-clamp-3">
                      {course.description || 'No description available'}
                    </p>

                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span>{course.enrollments_count || 0} enrolled</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span>{course.duration || 'Self-paced'}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    {getAccessButton(course, isEnrolled)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && paymentCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Complete Payment</h3>
                <p className="text-sm text-slate-500 mt-1">Enroll in {paymentCourse.title}</p>
              </div>
              <button
                onClick={() => { setShowPaymentModal(false); setPaymentCourse(null); }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Price Display */}
            <div className="px-6 pt-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Course Price</p>
                  <p className="text-3xl font-bold text-[#7E2259]">${paymentCourse.price || 0}</p>
                </div>
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <DollarSign size={24} className="text-amber-500" />
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="px-6 pt-4 pb-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-blue-900">Secure Payment via Stripe</p>
                    <p className="text-xs text-blue-700 mt-1">
                      You'll be redirected to Stripe's secure checkout page to complete your payment. All major cards accepted.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 flex gap-3">
              <button
                onClick={() => { setShowPaymentModal(false); setPaymentCourse(null); }}
                disabled={paymentProcessing}
                className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={paymentProcessing}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {paymentProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    Pay ${paymentCourse.price || 0}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
