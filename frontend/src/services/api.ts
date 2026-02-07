import { 
  Course, CourseCreate, CourseFilters, CourseUpdate, 
  Lesson, LessonCreate, LessonUpdate,
  User, UserCreate, UserUpdate, UserFilters,
  Quiz, QuizCreate, QuizQuestion,
  CourseEnrollment, UserLessonProgress, QuizAttempt,
  Badge, UserBadge, CourseReview, CourseReviewCreate,
  LoginRequest, LoginResponse, RegisterRequest,
  DashboardStats, AdminStats
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new ApiError(response.status, error.detail || 'Request failed');
  }
  return response.json();
};

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Authentication API
export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse<LoginResponse>(response);
  },

  async register(userData: RegisterRequest): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse<User>(response);
  },

  async getProfile(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<User>(response);
  },
};

export { ApiError };