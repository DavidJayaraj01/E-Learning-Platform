from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.config import settings
from app.routes import users, courses, lessons

# Create FastAPI app
app = FastAPI(
    title="E-Learning Platform API",
    description="A comprehensive e-learning platform with courses, lessons, quizzes, and progress tracking",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this based on your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(courses.router, prefix="/api/v1/courses", tags=["courses"])
app.include_router(lessons.router, prefix="/api/v1/lessons", tags=["lessons"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to E-Learning Platform API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "users": "/api/v1/users",
            "courses": "/api/v1/courses", 
            "lessons": "/api/v1/lessons"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.environment,
        "database": "connected"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)