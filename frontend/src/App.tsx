import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'sonner';

// Import pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import StudentDashboard from './pages/student/Dashboard';
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRole?: 'admin' | 'learner' }> = ({ children, allowedRole }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // Redirect to correct dashboard if role doesn't match
    if (user.role === 'admin') {
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
    if (user.role === 'admin') {
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
                <ProtectedRoute allowedRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              <Route path="/admin/course/create" element={
                <ProtectedRoute allowedRole="admin">
                  <CourseEditor />
                </ProtectedRoute>
              } />

              <Route path="/admin/course/content/edit" element={
                <ProtectedRoute allowedRole="admin">
                  <ContentEditor />
                </ProtectedRoute>
              } />

              {/* Legacy dashboard route redirect */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Navigate to="/student/dashboard" replace />
                  {/* The ProtectedRoute logic will actually redirect based on role anyway */}
                </ProtectedRoute>
              } />

              {/* Placeholder routes for future pages */}
              <Route path="/student/courses" element={
                <ProtectedRoute>
                  <div className="p-8">Courses page coming soon</div>
                </ProtectedRoute>
              } />

              <Route path="/admin/course/quiz/new" element={
                <ProtectedRoute allowedRole="admin">
                  <QuizEditor />
                </ProtectedRoute>
              } />

              <Route path="/admin/settings" element={
                <ProtectedRoute allowedRole="admin">
                  <AdminSettings />
                </ProtectedRoute>
              } />

              <Route path="/admin/reporting" element={
                <ProtectedRoute allowedRole="admin">
                  <CourseReportingDashboard />
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
