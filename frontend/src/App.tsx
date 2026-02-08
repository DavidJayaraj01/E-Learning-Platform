import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'sonner';

// Import pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import StudentDashboard from './pages/student/Dashboard';
import BrowseCourses from './pages/student/BrowseCourses';
import CourseOverview from './pages/student/CourseOverview';
import LessonView from './pages/student/LessonView';
import AdminDashboard from './pages/admin/AdminDashboard';
import CourseEditor from './pages/admin/CourseEditor';
import ContentEditor from './pages/admin/ContentEditor';
import QuizEditor from './pages/admin/QuizEditor';
import CourseReportingDashboard from './pages/admin/CourseReportingDashboard';
import AdminSettings from './pages/admin/AdminSettings';
import LandingPage from './pages/LandingPage';
import LoadingSpinner from './components/common/LoadingSpinner';

// Admin - Course Management
import CourseList from './pages/admin/courses/CourseList';
import CourseForm from './pages/admin/courses/CourseForm';
import CourseEnrollments from './pages/admin/courses/CourseEnrollments';

// Admin - Lesson Management
import LessonList from './pages/admin/lessons/LessonList';
import LessonForm from './pages/admin/lessons/LessonForm';

// Admin - Quiz Management
import QuizList from './pages/admin/quizzes/QuizList';
import QuizBuilder from './pages/admin/quizzes/QuizBuilder';

// Admin - RAG Generation
import RAGDashboard from './pages/admin/rag/RAGDashboard';
import DocumentUpload from './pages/admin/rag/DocumentUpload';
import GenerationWizard from './pages/admin/rag/GenerationWizard';
import JobMonitor from './pages/admin/rag/JobMonitor';

// Admin - User Management
import UserList from './pages/admin/users/UserList';
import UserForm from './pages/admin/users/UserForm';

// Profile
import Profile from './pages/Profile';

// Student - Invitations
import InvitationsPage from './pages/student/InvitationsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRole?: 'ADMIN' | 'INSTRUCTOR' | 'LEARNER' }> = ({ children, allowedRole }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole) {
    // Admin can access everything (check both cases for compatibility)
    if (user.role === 'admin' || user.role === 'ADMIN') {
      return <>{children}</>;
    }
    // Instructor can access instructor and student pages
    if ((user.role === 'instructor' || user.role === 'INSTRUCTOR') && (allowedRole === 'INSTRUCTOR' || allowedRole === 'LEARNER')) {
      return <>{children}</>;
    }
    // Student can only access student pages
    if ((user.role === 'learner' || user.role === 'LEARNER') && allowedRole === 'LEARNER') {
      return <>{children}</>;
    }
    // Redirect to appropriate dashboard if role doesn't match
    if (user.role === 'admin' || user.role === 'ADMIN' || user.role === 'instructor' || user.role === 'INSTRUCTOR') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/student/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

// Public Route Component (redirect to dashboard if authenticated)
// Note: We might want to allow authenticated users to view Landing Page? 
// If so, we should remove PublicRoute wrapper for LandingPage or modify PublicRoute.
// But typically, if logged in, you go to dashboard.
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (user) {
    if (user.role === 'admin' || user.role === 'ADMIN' || user.role === 'instructor' || user.role === 'INSTRUCTOR') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/student/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-center" richColors />
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={
                <PublicRoute>
                  <LandingPage />
                </PublicRoute>
              } />

              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } />

              {/* Protected Routes */}
              <Route path="/student/dashboard" element={
                <ProtectedRoute>
                  <StudentDashboard />
                </ProtectedRoute>
              } />

              <Route path="/student/course/:courseId" element={
                <ProtectedRoute>
                  <CourseOverview />
                </ProtectedRoute>
              } />

              <Route path="/student/course/:courseId/lesson/:lessonId" element={
                <ProtectedRoute>
                  <LessonView />
                </ProtectedRoute>
              } />

              <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRole="ADMIN">
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              {/* Legacy editor routes - redirect to new structure */}
              <Route path="/admin/course/create" element={
                <ProtectedRoute allowedRole="ADMIN">
                  <Navigate to="/admin/courses/new" replace />
                </ProtectedRoute>
              } />

              <Route path="/admin/course/content/edit" element={
                <ProtectedRoute allowedRole="ADMIN">
                  <ContentEditor />
                </ProtectedRoute>
              } />

              {/* Admin - Course Management */}
              <Route path="/admin/courses" element={
                <ProtectedRoute allowedRole="ADMIN">
                  <CourseList />
                </ProtectedRoute>
              } />
              <Route path="/admin/courses/new" element={
                <ProtectedRoute allowedRole="ADMIN">
                  <CourseForm />
                </ProtectedRoute>
              } />
              <Route path="/admin/courses/:courseId/edit" element={
                <ProtectedRoute allowedRole="ADMIN">
                  <CourseForm />
                </ProtectedRoute>
              } />
              <Route path="/admin/courses/:courseId/enrollments" element={
                <ProtectedRoute allowedRole="ADMIN">
                  <CourseEnrollments />
                </ProtectedRoute>
              } />

              {/* Admin - Lesson Management */}
              <Route path="/admin/courses/:courseId/lessons" element={
                <ProtectedRoute allowedRole="ADMIN">
                  <LessonList />
                </ProtectedRoute>
              } />
              <Route path="/admin/courses/:courseId/lessons/new" element={
                <ProtectedRoute allowedRole="ADMIN">
                  <LessonForm />
                </ProtectedRoute>
              } />
              <Route path="/admin/courses/:courseId/lessons/:lessonId/edit" element={
                <ProtectedRoute allowedRole="ADMIN">
                  <LessonForm />
                </ProtectedRoute>
              } />

              {/* Admin - Quiz Management */}
              <Route path="/admin/courses/:courseId/quizzes" element={
                <ProtectedRoute allowedRole="ADMIN">
                  <QuizList />
                </ProtectedRoute>
              } />
              <Route path="/admin/courses/:courseId/quizzes/new" element={
                <ProtectedRoute allowedRole="ADMIN">
                  <QuizBuilder />
                </ProtectedRoute>
              } />
              <Route path="/admin/courses/:courseId/quizzes/:quizId/edit" element={
                <ProtectedRoute allowedRole="ADMIN">
                  <QuizBuilder />
                </ProtectedRoute>
              } />

              {/* Legacy quiz route - redirect to new structure */}
              <Route path="/admin/course/quiz/new" element={
                <ProtectedRoute allowedRole="ADMIN">
                  <QuizEditor />
                </ProtectedRoute>
              } />

              {/* Admin - RAG Generation */}
              <Route path="/admin/rag" element={
                <ProtectedRoute allowedRole="ADMIN">
                  <RAGDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/rag/documents" element={
                <ProtectedRoute allowedRole="ADMIN">
                  <DocumentUpload />
                </ProtectedRoute>
              } />
              <Route path="/admin/rag/generate" element={
                <ProtectedRoute allowedRole="ADMIN">
                  <GenerationWizard />
                </ProtectedRoute>
              } />
              <Route path="/admin/rag/jobs/:jobId" element={
                <ProtectedRoute allowedRole="ADMIN">
                  <JobMonitor />
                </ProtectedRoute>
              } />

              {/* Admin - User Management */}
              <Route path="/admin/users" element={
                <ProtectedRoute allowedRole="ADMIN">
                  <UserList />
                </ProtectedRoute>
              } />
              <Route path="/admin/users/new" element={
                <ProtectedRoute allowedRole="ADMIN">
                  <UserForm />
                </ProtectedRoute>
              } />
              <Route path="/admin/users/:userId/edit" element={
                <ProtectedRoute allowedRole="ADMIN">
                  <UserForm />
                </ProtectedRoute>
              } />

              {/* Admin Settings & Reporting */}
              <Route path="/admin/settings" element={
                <ProtectedRoute allowedRole="ADMIN">
                  <AdminSettings />
                </ProtectedRoute>
              } />

              <Route path="/admin/reporting" element={
                <ProtectedRoute allowedRole="ADMIN">
                  <CourseReportingDashboard />
                </ProtectedRoute>
              } />

              {/* Profile - accessible by all authenticated users */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />

              {/* Legacy dashboard route redirect */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Navigate to="/student/dashboard" replace />
                  {/* The ProtectedRoute logic will actually redirect based on role anyway */}
                </ProtectedRoute>
              } />

              {/* Student - Course Browsing and Access */}
              <Route path="/student/courses" element={
                <ProtectedRoute allowedRole="LEARNER">
                  <BrowseCourses />
                </ProtectedRoute>
              } />

              {/* Student - Invitations */}
              <Route path="/student/invitations" element={
                <ProtectedRoute allowedRole="LEARNER">
                  <InvitationsPage />
                </ProtectedRoute>
              } />
              
              {/* Student - Quiz Taking */}
              <Route path="/student/course/:courseId/quiz/:quizId" element={
                <ProtectedRoute allowedRole="LEARNER">
                  <LessonView />
                </ProtectedRoute>
              } />

              {/* Default redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
