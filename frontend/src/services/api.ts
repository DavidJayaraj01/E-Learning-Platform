import type {
  User,
  LoginRequest, LoginResponse, RegisterRequest
} from '../types/api';

// MOCK API IMPLEMENTATION
// We use localStorage to simulate a persistent database for the frontend
const DB_KEY = 'edu_platform_users_db';
const SESSION_KEY = 'edu_platform_current_session';

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Helper to get DB
const getDb = (): User[] => {
  const db = localStorage.getItem(DB_KEY);
  return db ? JSON.parse(db) : [];
};

// Helper to save DB
const saveDb = (users: User[]) => {
  localStorage.setItem(DB_KEY, JSON.stringify(users));
};

// Authentication API (Mocked)
export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const db = getDb();
    let user = db.find(u => u.email.toLowerCase() === credentials.email.toLowerCase());

    if (!user) {
      // For demo purposes, if user doesn't exist, create one ad-hoc based on email pattern
      // This allows direct login without registration for testing
      const isAdmin = credentials.email.toLowerCase().includes('admin');

      user = {
        id: Math.floor(Math.random() * 10000),
        email: credentials.email,
        name: credentials.email.split('@')[0],
        role: isAdmin ? 'admin' : 'learner',
        total_points: isAdmin ? 9999 : 0,
        created_at: new Date().toISOString()
      };

      // Save this ad-hoc user to DB so they persist
      const newDb = [...db, user];
      saveDb(newDb);
    }

    // Create session
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));

    return {
      access_token: 'mock_jwt_' + Date.now(),
      token_type: 'bearer',
      user: user
    };
  },

  async register(userData: RegisterRequest): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const db = getDb();
    if (db.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new ApiError(400, 'User with this email already exists');
    }

    const newUser: User = {
      id: Math.floor(Math.random() * 10000),
      email: userData.email,
      name: userData.name,
      role: userData.role || 'learner', // Respect the selected role
      total_points: 0,
      created_at: new Date().toISOString()
    };

    // Save to DB
    saveDb([...db, newUser]);

    return newUser;
  },

  async getProfile(): Promise<User> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Get from session
    const sessionUser = localStorage.getItem(SESSION_KEY);
    if (!sessionUser) {
      throw new ApiError(401, 'Unauthorized');
    }

    // Refresh from DB to get latest state (points, etc)
    const user = JSON.parse(sessionUser);
    const db = getDb();
    const freshUser = db.find(u => u.id === user.id) || user;

    return freshUser;
  }
};

export { ApiError };