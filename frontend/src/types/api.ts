// User types
export interface User {
  id: number;
  email: string;
  full_name?: string;
  name?: string; // Legacy support
  role: 'ADMIN' | 'INSTRUCTOR' | 'LEARNER';
  is_active: boolean;
  total_points?: number;
  enrolled_courses?: number;
  completed_courses?: number;
  created_at: string;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name?: string;
  role?: 'ADMIN' | 'INSTRUCTOR' | 'LEARNER';
}

export interface UserUpdate {
  full_name?: string;
  password?: string;
  role?: 'ADMIN' | 'INSTRUCTOR' | 'LEARNER';
  is_active?: boolean;
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
  visibility: 'EVERYONE' | 'SIGNED_IN';
  access_type: 'OPEN' | 'INVITATION' | 'PAYMENT';
  price: number;
  course_admin_id?: number;
  total_lessons: number;
  total_duration?: string;
  duration?: string;
  enrollments_count?: number;
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
  visibility?: 'EVERYONE' | 'SIGNED_IN';
  access_type?: 'OPEN' | 'INVITATION' | 'PAYMENT';
  price?: number;
  course_admin_id?: number;
}

export interface CourseUpdate extends Partial<CourseCreate> { }

// Lesson types
export interface Lesson {
  id: number;
  course_id: number;
  title: string;
  lesson_type: 'VIDEO' | 'DOCUMENT' | 'IMAGE' | 'QUIZ';
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
  lesson_type: 'VIDEO' | 'DOCUMENT' | 'IMAGE' | 'QUIZ';
  description?: string;
  responsible_id?: number;
  order_index?: number;
  duration?: string;
}

export interface LessonUpdate {
  title?: string;
  lesson_type?: 'VIDEO' | 'DOCUMENT' | 'IMAGE' | 'QUIZ';
  description?: string;
  order_index?: number;
  duration?: string;
}

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
  description?: string;
  order_index: number;
  time_limit?: number;
  passing_score: number;
  is_active: boolean;
  questions?: QuizQuestion[];
}

export interface QuizCreate {
  course_id: number;
  title: string;
  description?: string;
  order_index?: number;
  time_limit?: number;
  passing_score?: number;
  is_active?: boolean;
}

export interface QuizUpdate {
  title?: string;
  description?: string;
  order_index?: number;
  time_limit?: number;
  passing_score?: number;
  is_active?: boolean;
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'open_ended';
  order_index: number;
  points: number;
  answers?: QuestionAnswer[];
  // Legacy support
  points_first?: number;
  points_second?: number;
  points_third?: number;
  points_more?: number;
  options?: QuestionOption[];
}

export interface QuestionAnswer {
  id?: number;
  question_id?: number;
  answer_text: string;
  is_correct: boolean;
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
  status: 'YET_TO_START' | 'IN_PROGRESS' | 'COMPLETED';
  time_spent: string;
  completion_percentage: number;
}

export interface UserLessonProgress {
  id: number;
  user_id: number;
  lesson_id: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  completed_at?: string;
  time_spent: string;
}

export interface QuizAttempt {
  id: number;
  user_id: number;
  quiz_id: number;
  attempt_number: number;
  status: 'IN_PROGRESS' | 'COMPLETED';
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
  visibility?: 'EVERYONE' | 'SIGNED_IN';
  access_type?: 'OPEN' | 'INVITATION' | 'PAYMENT';
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
  role?: 'admin' | 'instructor' | 'learner';
}

// Error types
export interface ApiError {
  detail: string;
  field?: string;
  code?: string;
}

// RAG Document types
export interface UploadedDocument {
  id: number;
  user_id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_type: string;
  file_size: number;
  status: 'pending' | 'processing' | 'processed' | 'failed';
  error_message?: string;
  title?: string;
  author?: string;
  total_pages?: number;
  total_chunks: number;
  uploaded_at: string;
  processed_at?: string;
}

export interface DocumentChunk {
  id: number;
  document_id: number;
  chunk_index: number;
  content: string;
  page_number?: number;
  chapter?: string;
  section?: string;
  token_count?: number;
}

// Course Generation types
export interface CourseGenerationJob {
  id: number;
  document_id: number;
  user_id: number;
  status: 'pending' | 'analyzing' | 'generating_structure' | 'generating_content' | 'generating_quizzes' | 'completed' | 'failed';
  progress_percentage: number;
  current_step?: string;
  error_message?: string;
  settings: GenerationSettings;
  generated_outline?: any;
  generated_lessons?: any;
  generated_quizzes?: any;
  generated_course_id?: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface GenerationSettings {
  course_title?: string;
  course_description?: string;
  max_lessons?: number;
  target_lessons?: number;
  include_quizzes?: boolean;
  quiz_questions_per_lesson?: number;
  lesson_duration_minutes?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  llm_provider?: 'ollama' | 'openai' | 'gemini';
}

// RAG Configuration types
export interface RAGConfiguration {
  id: number;
  user_id?: number;
  embedding_model: string;
  chunk_size: number;
  chunk_overlap: number;
  llm_provider: 'ollama' | 'openai' | 'gemini';
  llm_model: string;
  temperature: number;
  max_tokens: number;
  top_k_chunks: number;
  similarity_threshold: number;
  default_lessons_per_course: number;
  default_quiz_questions: number;
  created_at: string;
  updated_at: string;
}