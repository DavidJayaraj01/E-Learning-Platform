import type {
  User,
  Course,
  CourseCreate,
  CourseUpdate,
  Lesson,
  LessonCreate,
  LessonUpdate,
  Quiz,
  QuizCreate,
  QuizUpdate,
  QuizQuestion,
  QuizAttempt,
  CourseEnrollment,
  CourseProgress,
  UserLessonProgress,
  CourseReview,
  CourseReviewCreate,
  Badge,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  CourseFilters,
  UserFilters,
  UploadedDocument,
  CourseGenerationJob,
  RAGConfiguration,
} from '../types/api';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class ApiError extends Error {
  status: number;
  data?: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

// Helper function for API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('access_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    cache: 'no-store', // Disable browser caching for fresh data
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.detail || errorData.message || 'An error occurred',
      errorData
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// File upload helper
async function uploadFile(
  endpoint: string,
  file: File,
  additionalData?: Record<string, string>
): Promise<any> {
  const token = localStorage.getItem('access_token');
  const formData = new FormData();
  formData.append('file', file);

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.detail || 'Upload failed',
      errorData
    );
  }

  return response.json();
}

// Authentication API
export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    localStorage.setItem('access_token', response.access_token);
    return response;
  },

  async register(userData: RegisterRequest): Promise<User> {
    return apiRequest<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async getProfile(): Promise<User> {
    return apiRequest<User>('/auth/profile');
  },

  logout(): void {
    localStorage.removeItem('access_token');
  },
};

// Users API
export const usersApi = {
  async getAll(filters?: UserFilters): Promise<User[]> {
    const params = new URLSearchParams();
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.role) params.append('role', filters.role);
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    return apiRequest<User[]>(`/users${queryString ? `?${queryString}` : ''}`);
  },

  async list(filters?: UserFilters): Promise<User[]> {
    return this.getAll(filters);
  },

  async get(userId: number): Promise<User> {
    return apiRequest<User>(`/users/${userId}`);
  },

  async create(data: { email: string; password: string; full_name?: string; role?: string }): Promise<User> {
    return apiRequest<User>('/users/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(userId: number, data: Partial<User>): Promise<User> {
    return apiRequest<User>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(userId: number): Promise<void> {
    return apiRequest<void>(`/users/${userId}`, {
      method: 'DELETE',
    });
  },

  async updateProfile(data: { full_name?: string }): Promise<User> {
    return apiRequest<User>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return apiRequest<void>('/users/me/password', {
      method: 'PUT',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  },

  async getBadges(userId: number): Promise<Badge[]> {
    return apiRequest<Badge[]>(`/users/${userId}/badges`);
  },

  async searchLearners(query: string, limit: number = 10): Promise<User[]> {
    if (!query || query.length < 2) return [];
    return apiRequest<User[]>(`/users/search/learners?q=${encodeURIComponent(query)}&limit=${limit}`);
  },
};

// Courses API
export const coursesApi = {
  async list(filters?: CourseFilters): Promise<Course[]> {
    const params = new URLSearchParams();
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.published_only !== undefined)
      params.append('published_only', filters.published_only.toString());
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    return apiRequest<Course[]>(`/courses${queryString ? `?${queryString}` : ''}`);
  },

  async get(courseId: number): Promise<Course> {
    return apiRequest<Course>(`/courses/${courseId}`);
  },

  async getDetails(courseId: number): Promise<any> {
    return apiRequest<any>(`/courses/${courseId}/details`);
  },

  async create(data: CourseCreate): Promise<Course> {
    return apiRequest<Course>('/courses/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(courseId: number, data: CourseUpdate): Promise<Course> {
    return apiRequest<Course>(`/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(courseId: number): Promise<void> {
    return apiRequest<void>(`/courses/${courseId}`, {
      method: 'DELETE',
    });
  },

  async enroll(courseId: number, userId: number): Promise<any> {
    return apiRequest<any>(`/courses/${courseId}/enroll?user_id=${userId}`, {
      method: 'POST',
    });
  },

  async getEnrollments(courseId: number): Promise<CourseEnrollment[]> {
    return apiRequest<CourseEnrollment[]>(`/courses/${courseId}/enrollments`);
  },

  async getMyCourses(): Promise<Course[]> {
    return apiRequest<Course[]>('/courses/my-courses');
  },

  async enrollInCourse(courseId: number): Promise<void> {
    return apiRequest<void>(`/courses/${courseId}/enroll`, {
      method: 'POST',
    });
  },

  async getProgress(courseId: number): Promise<CourseProgress> {
    return apiRequest<CourseProgress>(`/courses/${courseId}/progress`);
  },
};

// Lessons API
export const lessonsApi = {
  async getByCourse(courseId: number): Promise<Lesson[]> {
    return apiRequest<Lesson[]>(`/lessons/course/${courseId}`);
  },

  async get(lessonId: number): Promise<Lesson> {
    return apiRequest<Lesson>(`/lessons/${lessonId}`);
  },

  async getWithContent(lessonId: number): Promise<Lesson> {
    return apiRequest<Lesson>(`/lessons/${lessonId}`);
  },

  async create(data: LessonCreate): Promise<Lesson> {
    return apiRequest<Lesson>('/lessons/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(lessonId: number, data: LessonUpdate): Promise<Lesson> {
    return apiRequest<Lesson>(`/lessons/${lessonId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(lessonId: number): Promise<void> {
    return apiRequest<void>(`/lessons/${lessonId}`, {
      method: 'DELETE',
    });
  },

  async complete(lessonId: number, userId: number): Promise<UserLessonProgress> {
    return apiRequest<UserLessonProgress>(
      `/lessons/${lessonId}/complete?user_id=${userId}`,
      {
        method: 'POST',
      }
    );
  },

  async setVideo(lessonId: number, videoUrl: string): Promise<{message: string; url: string}> {
    return apiRequest<{message: string; url: string}>(
      `/lessons/${lessonId}/video?video_url=${encodeURIComponent(videoUrl)}`,
      {
        method: 'POST',
      }
    );
  },

  async deleteVideo(lessonId: number): Promise<void> {
    return apiRequest<void>(`/lessons/${lessonId}/video`, {
      method: 'DELETE',
    });
  },
};

// Quizzes API
export const quizzesApi = {
  async getByCourse(courseId: number): Promise<Quiz[]> {
    return apiRequest<Quiz[]>(`/quizzes/course/${courseId}`);
  },

  async get(quizId: number): Promise<Quiz> {
    return apiRequest<Quiz>(`/quizzes/${quizId}`);
  },

  async create(data: QuizCreate): Promise<Quiz> {
    return apiRequest<Quiz>('/quizzes/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(quizId: number, data: QuizUpdate): Promise<Quiz> {
    return apiRequest<Quiz>(`/quizzes/${quizId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(quizId: number): Promise<void> {
    return apiRequest<void>(`/quizzes/${quizId}`, {
      method: 'DELETE',
    });
  },

  async addQuestion(
    quizId: number,
    data: Partial<QuizQuestion>
  ): Promise<QuizQuestion> {
    return apiRequest<QuizQuestion>(`/quizzes/${quizId}/questions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateQuestion(
    questionId: number,
    data: Partial<QuizQuestion>
  ): Promise<QuizQuestion> {
    return apiRequest<QuizQuestion>(`/quizzes/questions/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteQuestion(questionId: number): Promise<void> {
    return apiRequest<void>(`/quizzes/questions/${questionId}`, {
      method: 'DELETE',
    });
  },

  async startAttempt(quizId: number): Promise<QuizAttempt> {
    return apiRequest<QuizAttempt>(`/quizzes/${quizId}/start`, {
      method: 'POST',
    });
  },

  async submitAnswer(
    attemptId: number,
    questionId: number,
    selectedOptionId: number
  ): Promise<any> {
    return apiRequest<any>(`/quizzes/attempts/${attemptId}/answer`, {
      method: 'POST',
      body: JSON.stringify({
        question_id: questionId,
        selected_option_id: selectedOptionId,
      }),
    });
  },

  async completeAttempt(attemptId: number): Promise<any> {
    return apiRequest<any>(`/quizzes/attempts/${attemptId}/complete`, {
      method: 'POST',
    });
  },

  async reportTabSwitch(attemptId: number): Promise<any> {
    return apiRequest<any>(`/quizzes/attempts/${attemptId}/tab-switch`, {
      method: 'POST',
    });
  },

  async getAttempts(quizId: number): Promise<QuizAttempt[]> {
    return apiRequest<QuizAttempt[]>(`/quizzes/${quizId}/attempts`);
  },
};

// Reviews API
export const reviewsApi = {
  async getByCourse(courseId: number): Promise<CourseReview[]> {
    return apiRequest<CourseReview[]>(`/courses/${courseId}/reviews`);
  },

  async create(courseId: number, data: Omit<CourseReviewCreate, 'course_id'>): Promise<CourseReview> {
    return apiRequest<CourseReview>(`/courses/${courseId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(
    courseId: number,
    data: Partial<CourseReviewCreate>
  ): Promise<CourseReview> {
    return apiRequest<CourseReview>(`/courses/${courseId}/reviews`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(courseId: number): Promise<void> {
    return apiRequest<void>(`/courses/${courseId}/reviews`, {
      method: 'DELETE',
    });
  },

  async getRating(courseId: number): Promise<{ course_id: number; average_rating: number; total_reviews: number }> {
    return apiRequest<{ course_id: number; average_rating: number; total_reviews: number }>(
      `/courses/${courseId}/rating`
    );
  },
};

// RAG Generation API
export const ragApi = {
  async uploadDocument(file: File): Promise<UploadedDocument> {
    return uploadFile('/rag/documents/upload', file);
  },

  async listDocuments(
    skip = 0,
    limit = 50,
    statusFilter?: string
  ): Promise<{ documents: UploadedDocument[]; total_count: number }> {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (statusFilter) params.append('status_filter', statusFilter);

    return apiRequest<{ documents: UploadedDocument[]; total_count: number }>(
      `/rag/documents?${params.toString()}`
    );
  },

  async getDocument(documentId: number): Promise<UploadedDocument> {
    return apiRequest<UploadedDocument>(`/rag/documents/${documentId}`);
  },

  async processDocument(documentId: number): Promise<any> {
    return apiRequest<any>(`/rag/documents/${documentId}/process`, {
      method: 'POST',
    });
  },

  async deleteDocument(documentId: number): Promise<void> {
    return apiRequest<void>(`/rag/documents/${documentId}`, {
      method: 'DELETE',
    });
  },

  async startGeneration(
    options: {
      document_id?: number;
      document_ids?: number[];
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
  ): Promise<CourseGenerationJob> {
    // Support both single and multiple documents
    const documentId = options.document_id || (options.document_ids?.[0]);
    const settings = {
      course_title: options.course_title,
      course_description: options.course_description,
      max_lessons: options.max_lessons || options.target_lessons,
      include_quizzes: options.include_quizzes,
      quiz_questions_per_lesson: options.quiz_questions_per_lesson,
      lesson_duration_minutes: options.lesson_duration_minutes,
      difficulty_level: options.difficulty_level,
    };
    
    return apiRequest<CourseGenerationJob>('/rag/generate', {
      method: 'POST',
      body: JSON.stringify({
        document_id: documentId,
        settings,
      }),
    });
  },

  async getJob(jobId: number): Promise<CourseGenerationJob> {
    return apiRequest<CourseGenerationJob>(`/rag/generate/${jobId}`);
  },

  async listJobs(): Promise<CourseGenerationJob[]> {
    return apiRequest<CourseGenerationJob[]>('/rag/generate/jobs');
  },

  async cancelJob(jobId: number): Promise<void> {
    return apiRequest<void>(`/rag/generate/${jobId}`, {
      method: 'DELETE',
    });
  },

  async getConfiguration(): Promise<RAGConfiguration> {
    return apiRequest<RAGConfiguration>('/rag/config');
  },

  async createConfiguration(
    config: Partial<RAGConfiguration>
  ): Promise<RAGConfiguration> {
    return apiRequest<RAGConfiguration>('/rag/config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  async updateConfiguration(
    config: Partial<RAGConfiguration>
  ): Promise<RAGConfiguration> {
    return apiRequest<RAGConfiguration>('/rag/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  },
};

// AI Content Generation API
export interface ContentGenerationRequest {
  topic: string;
  content_type: 'document' | 'video_script' | 'image_description';
  additional_context?: string;
}

export interface ContentGenerationResponse {
  content: string;
  title_suggestion?: string;
}

export interface QuizGenerationRequest {
  topic: string;
  num_questions?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  question_types?: ('multiple_choice' | 'true_false' | 'open_ended')[];
}

export interface GeneratedQuizQuestion {
  question_text: string;
  question_type: string;
  points: number;
  answers: { answer_text: string; is_correct: boolean }[];
}

export interface QuizGenerationResponse {
  title_suggestion: string;
  description_suggestion: string;
  questions: GeneratedQuizQuestion[];
}

export interface AIHealthResponse {
  ollama_running: boolean;
  available_models?: string[];
  gemma_available?: boolean;
  default_model?: string;
  error?: string;
  message?: string;
}

export interface GenerateAndSaveLessonRequest {
  course_id: number;
  topic: string;
  lesson_type?: string;
  additional_context?: string;
}

export interface GenerateAndSaveLessonResponse {
  success: boolean;
  lesson_id: number;
  title: string;
  message: string;
}

export interface GenerateAndSaveQuizRequest {
  course_id: number;
  topic: string;
  num_questions?: number;
  difficulty?: string;
  passing_score?: number;
  time_limit?: number;
}

export interface GenerateAndSaveQuizResponse {
  success: boolean;
  quiz_id: number;
  title: string;
  num_questions: number;
  message: string;
}

export const aiApi = {
  async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
    return apiRequest<ContentGenerationResponse>('/ai/generate-content', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async generateQuiz(request: QuizGenerationRequest): Promise<QuizGenerationResponse> {
    return apiRequest<QuizGenerationResponse>('/ai/generate-quiz', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async generateAndSaveLesson(request: GenerateAndSaveLessonRequest): Promise<GenerateAndSaveLessonResponse> {
    return apiRequest<GenerateAndSaveLessonResponse>('/ai/generate-and-save-lesson', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async generateAndSaveQuiz(request: GenerateAndSaveQuizRequest): Promise<GenerateAndSaveQuizResponse> {
    return apiRequest<GenerateAndSaveQuizResponse>('/ai/generate-and-save-quiz', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async generateFromDocument(
    file: File,
    request: {
      extraction_type: 'lesson' | 'course' | 'quiz';
      topic_focus?: string;
      content_requirements?: string;
      difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
      lesson_count?: number;
      include_examples?: boolean;
    }
  ): Promise<ContentGenerationResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('extraction_type', request.extraction_type);
    if (request.topic_focus) formData.append('topic_focus', request.topic_focus);
    if (request.content_requirements) formData.append('content_requirements', request.content_requirements);
    if (request.difficulty_level) formData.append('difficulty_level', request.difficulty_level);
    if (request.lesson_count) formData.append('lesson_count', request.lesson_count.toString());
    if (request.include_examples) formData.append('include_examples', request.include_examples.toString());

    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/ai/generate-from-document`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.detail || errorData.message || 'Document processing failed',
        errorData
      );
    }

    return response.json();
  },

  async checkHealth(): Promise<AIHealthResponse> {
    return apiRequest<AIHealthResponse>('/ai/health');
  },
};

// Invitations API
export interface CourseInvitation {
  id: number;
  course_id: number;
  course_title: string;
  inviter_name: string;
  invitee_email: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'requested';
  message?: string;
  created_at: string;
  responded_at?: string;
}

export interface InvitationListResponse {
  invitations: CourseInvitation[];
  total: number;
}

export const invitationsApi = {
  // Admin: Send invitation
  async sendInvitation(courseId: number, email: string, message?: string): Promise<CourseInvitation> {
    return apiRequest<CourseInvitation>(`/invitations/courses/${courseId}/invitations`, {
      method: 'POST',
      body: JSON.stringify({ course_id: courseId, email, message }),
    });
  },

  // Admin: Get course invitations
  async getCourseInvitations(courseId: number, statusFilter?: string): Promise<InvitationListResponse> {
    const params = statusFilter ? `?status_filter=${statusFilter}` : '';
    return apiRequest<InvitationListResponse>(`/invitations/courses/${courseId}/invitations${params}`);
  },

  // Admin: Cancel invitation
  async cancelInvitation(invitationId: number): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/invitations/invitations/${invitationId}`, {
      method: 'DELETE',
    });
  },

  // Admin: Approve invitation request
  async approveRequest(invitationId: number): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/invitations/invitations/${invitationId}/approve`, {
      method: 'POST',
    });
  },

  // Admin: Reject invitation request
  async rejectRequest(invitationId: number): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/invitations/invitations/${invitationId}/reject`, {
      method: 'POST',
    });
  },

  // Learner: Request invitation
  async requestInvitation(courseId: number, message?: string): Promise<{ message: string; invitation_id: number }> {
    return apiRequest<{ message: string; invitation_id: number }>(`/invitations/request/${courseId}`, {
      method: 'POST',
      body: JSON.stringify({ message: message || undefined }),
    });
  },

  // Learner: Get my invitations
  async getMyInvitations(statusFilter?: string): Promise<InvitationListResponse> {
    const params = statusFilter ? `?status_filter=${statusFilter}` : '';
    return apiRequest<InvitationListResponse>(`/invitations/my-invitations${params}`);
  },

  // Admin: Get all course requests
  async getAllCourseRequests(statusFilter?: string): Promise<InvitationListResponse> {
    const params = statusFilter ? `?status_filter=${statusFilter}` : '';
    return apiRequest<InvitationListResponse>(`/invitations/requests/all${params}`);
  },

  // Learner: Accept invitation
  async acceptInvitation(invitationId: number): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/invitations/invitations/${invitationId}/accept`, {
      method: 'POST',
    });
  },

  // Learner: Decline invitation
  async declineInvitation(invitationId: number): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/invitations/invitations/${invitationId}/decline`, {
      method: 'POST',
    });
  },

  // Payment: Process payment
  async processPayment(courseId: number, paymentMethod: string = 'card'): Promise<{ success: boolean; message: string; enrollment_id?: number; transaction_id?: string }> {
    return apiRequest<{ success: boolean; message: string; enrollment_id?: number; transaction_id?: string }>(`/invitations/payment/process`, {
      method: 'POST',
      body: JSON.stringify({ course_id: courseId, payment_method: paymentMethod }),
    });
  },

  // Payment: Create Stripe checkout session
  async createCheckoutSession(courseId: number): Promise<{ session_id: string; url: string }> {
    return apiRequest<{ session_id: string; url: string }>(`/invitations/payment/create-checkout-session`, {
      method: 'POST',
      body: JSON.stringify({ course_id: courseId }),
    });
  },
};

export { ApiError };