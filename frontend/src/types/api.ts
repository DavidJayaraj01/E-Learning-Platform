// User types
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'instructor' | 'learner';
  total_points: number;
  created_at: string;
}

export interface UserCreate {
  email: string;
  name: string;
  password: string;
  role?: 'admin' | 'instructor' | 'learner';
}

export interface UserUpdate {
  email?: string;
  name?: string;
  role?: 'admin' | 'instructor' | 'learner';
}

// Course types
export interface Course {
  id: number;
  title: string;
  description?: string;
  image_url?: string;
  tags?: string[];
  website_url?: string;
  published: boolean;
  visibility: 'everyone' | 'signed_in';
  access_type: 'open' | 'invitation' | 'payment';
  price: number;
  course_admin_id?: number;
  total_lessons: number;
  total_duration?: string;
  created_at: string;
  updated_at: string;
}

export interface CourseCreate {
  title: string;
  description?: string;
  image_url?: string;
  tags?: string[];
  website_url?: string;
  published?: boolean;
  visibility?: 'everyone' | 'signed_in';
  access_type?: 'open' | 'invitation' | 'payment';
  price?: number;
  course_admin_id?: number;
}

export interface CourseUpdate extends Partial<CourseCreate> {}

// Lesson types
export interface Lesson {
  id: number;
  course_id: number;
  title: string;
  lesson_type: 'video' | 'document' | 'image' | 'quiz';
  description?: string;
  responsible_id?: number;
  order_index: number;
  duration?: string;
  created_at: string;
  // Content based on lesson type
  video?: LessonVideo;
  document?: LessonDocument;
  image?: LessonImage;
  attachments?: LessonAttachment[];
}

export interface LessonCreate {
  course_id: number;
  title: string;
  lesson_type: 'video' | 'document' | 'image' | 'quiz';
  description?: string;
  responsible_id?: number;
  order_index: number;
  duration?: string;
}

export interface LessonUpdate extends Partial<LessonCreate> {}

// Lesson content types
export interface LessonVideo {
  lesson_id: number;
  url: string;
}

export interface LessonDocument {
  lesson_id: number;
  file_url: string;
  allow_download: boolean;
}

export interface LessonImage {
  lesson_id: number;
  file_url: string;
  allow_download: boolean;
}

export interface LessonAttachment {
  id: number;
  lesson_id: number;
  file_url?: string;
  external_url?: string;
  description?: string;
}

// Quiz types
export interface Quiz {
  id: number;
  course_id: number;
  title: string;
  order_index: number;
  questions?: QuizQuestion[];
}

export interface QuizCreate {
  course_id: number;
  title: string;
  order_index: number;
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question_text: string;
  order_index: number;
  points_first: number;
  points_second: number;
  points_third: number;
  points_more: number;
  options: QuestionOption[];
}

export interface QuestionOption {
  id: number;
  question_id: number;
  option_text: string;
  is_correct: boolean;
  order_index?: number;
}

// Progress and Enrollment types
export interface CourseEnrollment {
  id: number;
  course_id: number;
  user_id: number;
  enrolled_at: string;
  started_at?: string;
  completed_at?: string;
  status: 'yet_to_start' | 'in_progress' | 'completed';
  time_spent: string;
  completion_percentage: number;
}

export interface UserLessonProgress {
  id: number;
  user_id: number;
  lesson_id: number;
  status: 'not_started' | 'in_progress' | 'completed';
  completed_at?: string;
  time_spent: string;
}

export interface QuizAttempt {
  id: number;
  user_id: number;
  quiz_id: number;
  attempt_number: number;
  status: 'in_progress' | 'completed';
  started_at: string;
  completed_at?: string;
  earned_points: number;
  answers?: QuizAttemptAnswer[];
}

export interface QuizAttemptAnswer {
  id: number;
  attempt_id: number;
  question_id: number;
  selected_option_id: number;
  is_correct: boolean;
}

// Badge types
export interface Badge {
  id: number;
  name: string;
  required_points: number;
  description?: string;
}

export interface UserBadge {
  id: number;
  user_id: number;
  badge_id: number;
  awarded_at: string;
  badge: Badge;
}

// Review types
export interface CourseReview {
  id: number;
  course_id: number;
  user_id: number;
  rating: number;
  review_text?: string;
  created_at: string;
  user?: User;
}

export interface CourseReviewCreate {
  course_id: number;
  rating: number;
  review_text?: string;
}

// Analytics types
export interface CourseView {
  id: number;
  course_id: number;
  viewed_at: string;
}

export interface DashboardStats {
  total_courses: number;
  enrolled_courses: number;
  completed_courses: number;
  total_points: number;
  badges_earned: number;
  time_spent: string;
}

export interface AdminStats {
  total_users: number;
  total_courses: number;
  total_lessons: number;
  total_enrollments: number;
  recent_activities: Activity[];
}

export interface Activity {
  id: string;
  type: 'enrollment' | 'completion' | 'course_created' | 'user_registered';
  user?: User;
  course?: Course;
  timestamp: string;
  description: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface CourseFilters {
  skip?: number;
  limit?: number;
  published_only?: boolean;
  visibility?: 'everyone' | 'signed_in';
  access_type?: 'open' | 'invitation' | 'payment';
  search?: string;
  tags?: string[];
}

export interface UserFilters {
  skip?: number;
  limit?: number;
  role?: 'admin' | 'instructor' | 'learner';
  search?: string;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
  role?: 'instructor' | 'learner';
}

// Error types
export interface ApiError {
  detail: string;
  field?: string;
  code?: string;
}