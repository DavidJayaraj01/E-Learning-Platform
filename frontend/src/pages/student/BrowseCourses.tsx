import { useState, useEffect } from 'react';
import { BookOpen, Users, Clock, CheckCircle } from 'lucide-react';
import { coursesApi } from '../../services/api';
import type { Course } from '../../types/api';
import { toast } from 'sonner';

export default function BrowseCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      // Get all published courses
      const allCourses = await coursesApi.list();
      const published = allCourses.filter((c: Course) => c.published);
      setCourses(published);

      // Get enrolled courses to mark them
      const enrolled = await coursesApi.getMyCourses();
      setEnrolledCourseIds(new Set(enrolled.map((c: Course) => c.id)));
    } catch (error) {
      console.error('Failed to load courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async (courseId: number) => {
    try {
      await coursesApi.enrollInCourse(courseId);
      toast.success('Successfully enrolled in course!');
      // Update enrolled courses
      setEnrolledCourseIds(prev => new Set([...prev, courseId]));
    } catch (error: any) {
      console.error('Enrollment failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to enroll in course');
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Browse Courses</h1>
          <p className="text-slate-600">Discover and enroll in courses to start learning</p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="mx-auto h-16 w-16 text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No courses available</h3>
            <p className="text-slate-500">Check back later for new courses</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const isEnrolled = enrolledCourseIds.has(course.id);
              
              return (
                <div
                  key={course.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-slate-200"
                >
                  {/* Course Image or Placeholder */}
                  <div className="h-48 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <BookOpen className="h-20 w-20 text-white opacity-50" />
                  </div>

                  {/* Course Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                      {course.description || 'No description available'}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{course.enrollments_count || 0} enrolled</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{course.duration || 'Self-paced'}</span>
                      </div>
                    </div>

                    {/* Enroll Button */}
                    {isEnrolled ? (
                      <button
                        disabled
                        className="w-full px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium flex items-center justify-center gap-2 cursor-not-allowed"
                      >
                        <CheckCircle className="h-5 w-5" />
                        Enrolled
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course.id)}
                        className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
                      >
                        Enroll Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
