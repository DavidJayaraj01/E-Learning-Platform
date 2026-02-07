# E-Learning Platform

A full-stack e-learning platform built with FastAPI backend and React frontend.

## Project Structure

```
E-Learning-Platform/
├── backend/                 # FastAPI backend application
│   ├── app/                # Main application code
│   │   ├── models/         # SQLAlchemy database models
│   │   ├── routes/         # API route handlers
│   │   ├── schemas/        # Pydantic models
│   │   └── main.py         # FastAPI application entry point
│   ├── migrations/         # Alembic database migrations
│   ├── scripts/           # Database setup scripts
│   ├── requirements.txt   # Python dependencies
│   ├── alembic.ini       # Alembic configuration
│   └── .env              # Environment variables
└── frontend/             # React frontend application
    ├── src/              # React source code
    ├── public/           # Static assets
    ├── package.json      # Node.js dependencies
    └── vite.config.ts    # Vite configuration
```

## Backend Setup (FastAPI)

### Prerequisites
- Python 3.8+
- PostgreSQL 12+

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. Set up the database:
```bash
# Create database and run migrations
python scripts/create_db.py
alembic upgrade head
```

6. Run the development server:
```bash
python -m app.main
```

The API will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

## Frontend Setup (React + Vite)

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Build for production:
```bash
npm run build
```

## Database Schema

The platform includes the following main entities:
- Users (students, instructors, admins)
- Courses and Lessons
- Quizzes and Assessments
- Progress Tracking
- Badge System
- Categories and Tags

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token

### Users
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update user profile
- `GET /users/{user_id}` - Get user by ID

### Courses
- `GET /courses` - List all courses
- `POST /courses` - Create new course (instructors only)
- `GET /courses/{course_id}` - Get course details
- `PUT /courses/{course_id}` - Update course
- `DELETE /courses/{course_id}` - Delete course

### Lessons
- `GET /courses/{course_id}/lessons` - Get course lessons
- `POST /courses/{course_id}/lessons` - Create lesson
- `GET /lessons/{lesson_id}` - Get lesson details
- `PUT /lessons/{lesson_id}` - Update lesson

## Features

### Backend Features
- ✅ User authentication and authorization
- ✅ Role-based access control (Student, Instructor, Admin)
- ✅ Course management
- ✅ Lesson content delivery
- ✅ Quiz and assessment system
- ✅ Progress tracking
- ✅ Badge and achievement system
- ✅ RESTful API with automatic documentation
- ✅ Database migrations with Alembic
- ✅ Async database operations

### Frontend Features
- ✅ Modern React with TypeScript
- ✅ Responsive design with Tailwind CSS
- ✅ React Query for API state management
- ✅ React Router for navigation
- ✅ Course browsing and filtering
- ✅ User-friendly interface
- 🚧 User authentication UI
- 🚧 Course enrollment
- 🚧 Lesson viewer
- 🚧 Quiz interface
- 🚧 Progress dashboard

## Development

### Running Tests
```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
cd frontend
npm run test
```

### Code Style
```bash
# Backend formatting
cd backend
black app/
isort app/

# Frontend formatting
cd frontend
npm run format
npm run lint
```

## Deployment

### Docker (Recommended)
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Build frontend assets
5. Deploy backend with gunicorn
6. Serve frontend with nginx

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

- **User Management**: Role-based access control (Admin, Instructor, Learner)
- **Course Management**: Create and organize courses with multiple lesson types
- **Lesson Types**: Support for videos, documents, images, and quizzes
- **Progress Tracking**: Monitor user progress through lessons and courses
- **Quiz System**: Interactive quizzes with multiple attempts and scoring
- **Badge System**: Reward users with badges based on points earned
- **Reviews & Ratings**: Course feedback and rating system
- **Analytics**: Course view tracking and completion analytics

## 🏗️ Database Architecture

### Core Entities

- **Users**: Authentication, roles, and point system
- **Courses**: Course metadata, visibility, and access control
- **Lessons**: Multiple content types (video, document, image, quiz)
- **Quizzes**: Interactive assessments with questions and options
- **Progress Tracking**: User progress through lessons and courses
- **Badges**: Achievement system based on earned points
- **Reviews**: Course ratings and feedback

### Database Schema

The database uses PostgreSQL with the following key tables:

- `users` - User accounts with role-based access
- `courses` - Course information and settings
- `lessons` - Individual lessons within courses
- `quizzes` - Quiz assessments
- `quiz_questions` - Questions within quizzes
- `question_options` - Multiple choice options
- `user_lesson_progress` - Progress tracking
- `course_enrollments` - User course enrollments
- `badges` - Achievement badges
- `course_reviews` - Course ratings and reviews

## 🛠️ Installation

### Prerequisites

- Python 3.8+
- PostgreSQL 12+
- pip (Python package manager)

### Quick Setup

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd E-Learning-Platform
   ```

2. **Run the setup script**:
   ```bash
   ./setup.sh
   ```

3. **Update environment variables**:
   Edit `.env` file with your database credentials:
   ```env
   DATABASE_URL=postgresql+asyncpg://username:password@localhost/elearning_db
   DATABASE_URL_SYNC=postgresql://username:password@localhost/elearning_db
   SECRET_KEY=your-secret-key-here
   ```

### Manual Setup

If you prefer manual setup:

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Run database setup**:
   ```bash
   python scripts/setup_database.py
   ```

## 🏃‍♂️ Running the Application

1. **Start the FastAPI server**:
   ```bash
   python -m app.main
   # or
   uvicorn app.main:app --reload
   ```

2. **Access the application**:
   - API Documentation: http://localhost:8000/docs
   - Alternative Docs: http://localhost:8000/redoc
   - Health Check: http://localhost:8000/health

## 🗃️ Database Management

### Migrations

Create a new migration:
```bash
alembic revision --autogenerate -m "Description of changes"
```

Apply migrations:
```bash
alembic upgrade head
```

Rollback migrations:
```bash
alembic downgrade -1
```

### Initialize Default Data

Run the initialization script to populate default badges:
```bash
python scripts/init_db.py
```

## 📊 Database Schema Details

### Enums Used

- `UserRole`: admin, instructor, learner
- `LessonType`: video, document, image, quiz
- `VisibilityType`: everyone, signed_in
- `AccessType`: open, invitation, payment
- `LessonStatus`: not_started, in_progress, completed
- `EnrollmentStatus`: yet_to_start, in_progress, completed
- `QuizAttemptStatus`: in_progress, completed

### Key Relationships

- Users can create multiple courses (as instructors/admins)
- Courses contain multiple lessons and quizzes
- Users can enroll in courses and track progress
- Lessons can have different content types (polymorphic design)
- Quizzes contain questions with multiple options
- Users earn points and badges based on course completion

## 🔧 Development

### Project Structure

```
E-Learning-Platform/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application
│   ├── enums.py               # Database enums
│   ├── database/
│   │   ├── __init__.py
│   │   └── config.py          # Database configuration
│   └── models/
│       ├── __init__.py
│       └── models.py          # SQLAlchemy models
├── migrations/
│   ├── env.py                 # Alembic environment
│   ├── script.py.mako        # Migration template
│   └── versions/             # Migration files
├── scripts/
│   ├── init_db.py           # Database initialization
│   └── setup_database.py    # Complete setup script
├── requirements.txt          # Python dependencies
├── alembic.ini              # Alembic configuration
├── .env.example             # Environment variables template
└── setup.sh                 # Automated setup script
```

### Adding New Features

1. **Database Changes**: Create migrations using Alembic
2. **Models**: Update SQLAlchemy models in `app/models/models.py`
3. **API Routes**: Add new endpoints in separate route files
4. **Enums**: Add new enums in `app/enums.py`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Ensure database exists

2. **Migration Issues**:
   - Check Alembic configuration
   - Verify database URL in `alembic.ini`
   - Run `alembic current` to check migration status

3. **Import Errors**:
   - Ensure all dependencies are installed
   - Check Python path configuration
   - Verify virtual environment is activated

For more help, check the logs or create an issue in the repository.