React + Vite Frontend Template for E-Learning Platform

This frontend will be built using React + Vite for the E-Learning Platform.

## Setup Instructions

1. Install Node.js (version 18 or higher)
2. Navigate to the frontend directory
3. Run the following commands:

```bash
# Initialize Vite React project
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install

# Install additional dependencies for the E-Learning Platform
npm install @tanstack/react-query axios react-router-dom @headlessui/react @heroicons/react tailwindcss

# Install dev dependencies
npm install -D @types/react @types/react-dom eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser

# Start development server
npm run dev
```

## Project Structure (After setup)

```
frontend/
├── public/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API service functions
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── App.tsx             # Main App component
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Features to Implement

### Core Pages
- [ ] Landing page
- [ ] User authentication (login/register)
- [ ] Dashboard
- [ ] Course catalog
- [ ] Course detail view
- [ ] Lesson player
- [ ] Quiz interface
- [ ] User profile
- [ ] Progress tracking

### Components
- [ ] Course cards
- [ ] Lesson navigation
- [ ] Video player
- [ ] Quiz components
- [ ] Progress bars
- [ ] Badge display
- [ ] Navigation header
- [ ] Footer

### API Integration
- [ ] User management endpoints
- [ ] Course CRUD operations
- [ ] Lesson content delivery
- [ ] Progress tracking
- [ ] Quiz submission
- [ ] Badge system

## Backend API Endpoints

The backend API will be available at: http://localhost:8000

- Users: `/api/v1/users`
- Courses: `/api/v1/courses`
- Lessons: `/api/v1/lessons`
- API Documentation: `/docs`

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Query** - Server state management
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Headless UI** - Accessible UI components
- **Heroicons** - Icon library

## Development Workflow

1. Start backend server: `cd backend && python -m app.main`
2. Start frontend dev server: `cd frontend && npm run dev`
3. Access the application at: http://localhost:5173
4. API documentation at: http://localhost:8000/docs