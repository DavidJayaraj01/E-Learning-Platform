"""
E-Learning Platform API
=======================

A comprehensive REST API for online education with AI-powered course generation.

Features:
- User authentication and authorization
- Course creation and management (manual & AI-generated)
- Lesson content delivery
- Quiz and assessment system
- Progress tracking and gamification
- RAG-based automatic course generation from documents

Author: E-Learning Platform Team
Version: 1.0.0
License: MIT
"""

import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.database.config import settings, async_engine
from app.routes import (
    auth,
    users,
    courses,
    lessons,
    quizzes,
    reviews,
    rag_generation,
    ai_content,
)


# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================

logging.basicConfig(
    level=logging.INFO if settings.environment == "production" else logging.DEBUG,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger("e_learning_api")


# =============================================================================
# APPLICATION LIFESPAN
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    
    Handles startup and shutdown events for:
    - Database connections
    - Background task cleanup
    - Resource initialization
    """
    # Startup
    logger.info("🚀 Starting E-Learning Platform API...")
    logger.info(f"📌 Environment: {settings.environment}")
    logger.info(f"📦 API Version: 1.0.0")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down E-Learning Platform API...")
    await async_engine.dispose()
    logger.info("✅ Cleanup complete. Goodbye!")


# =============================================================================
# OPENAPI TAGS METADATA
# =============================================================================

OPENAPI_TAGS = [
    {
        "name": "🔐 Authentication",
        "description": "User authentication and registration endpoints.",
    },
    {
        "name": "👤 Users",
        "description": "User profile management and badge system.",
    },
    {
        "name": "📚 Courses",
        "description": "Course catalog, enrollment, and management.",
    },
    {
        "name": "📖 Lessons",
        "description": "Lesson content delivery and progress tracking.",
    },
    {
        "name": "📝 Quizzes",
        "description": "Quiz creation, attempts, and scoring system.",
    },
    {
        "name": "⭐ Reviews",
        "description": "Course reviews and ratings.",
    },
    {
        "name": "🤖 RAG Generation",
        "description": "AI-powered course generation from uploaded documents.",
    },
    {
        "name": "🔧 System",
        "description": "Health checks, system info, and utilities.",
    },
]


# =============================================================================
# FASTAPI APPLICATION
# =============================================================================

app = FastAPI(
    title="E-Learning Platform API",
    description="""
## 📚 E-Learning Platform

A comprehensive REST API for managing online courses with **AI-powered course generation**.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **Authentication** | JWT-based secure authentication |
| 📚 **Course Management** | Create and manage courses manually |
| 🤖 **AI Generation** | Upload books → Auto-generate courses |
| 📊 **Progress Tracking** | Track lesson completion and quiz scores |
| 🏆 **Gamification** | Points and badges for engagement |
| ⭐ **Reviews** | Course ratings and feedback |

### 🤖 AI Course Generation

Upload any document (PDF, TXT, DOCX) and let AI create complete courses:
1. **Course Structure** - Logical outline from content
2. **Lessons** - Detailed educational content
3. **Quizzes** - Auto-generated assessments

### 🔗 Quick Links

- [API Documentation](/docs)
- [ReDoc](/redoc)
- [OpenAPI Schema](/openapi.json)
    """,
    version="1.0.0",
    terms_of_service="https://example.com/terms",
    contact={
        "name": "E-Learning Platform Support",
        "url": "https://example.com/support",
        "email": "support@example.com",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    openapi_tags=OPENAPI_TAGS,
    lifespan=lifespan,
)


# =============================================================================
# MIDDLEWARE
# =============================================================================

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.environment == "development" else [
        "https://yourdomain.com",
        "https://www.yourdomain.com",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-Page", "X-Per-Page"],
)


# =============================================================================
# EXCEPTION HANDLERS
# =============================================================================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, 
    exc: RequestValidationError
) -> JSONResponse:
    """Handle validation errors with detailed messages."""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": " → ".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"],
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "status": "error",
            "code": 422,
            "message": "Validation failed",
            "errors": errors,
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(
    request: Request, 
    exc: Exception
) -> JSONResponse:
    """Handle unexpected errors gracefully."""
    logger.exception(f"Unhandled exception: {exc}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "code": 500,
            "message": "An unexpected error occurred",
            "detail": str(exc) if settings.environment == "development" else None,
        },
    )


# =============================================================================
# ROUTERS
# =============================================================================

# API Version 1
API_V1_PREFIX = "/api/v1"

app.include_router(
    auth.router,
    prefix=f"{API_V1_PREFIX}/auth",
    tags=["🔐 Authentication"],
)

app.include_router(
    users.router,
    prefix=f"{API_V1_PREFIX}/users",
    tags=["👤 Users"],
)

app.include_router(
    courses.router,
    prefix=f"{API_V1_PREFIX}/courses",
    tags=["📚 Courses"],
)

app.include_router(
    lessons.router,
    prefix=f"{API_V1_PREFIX}/lessons",
    tags=["📖 Lessons"],
)

app.include_router(
    quizzes.router,
    prefix=f"{API_V1_PREFIX}/quizzes",
    tags=["📝 Quizzes"],
)

app.include_router(
    reviews.router,
    prefix=API_V1_PREFIX,
    tags=["⭐ Reviews"],
)

app.include_router(
    rag_generation.router,
    prefix=f"{API_V1_PREFIX}/rag",
    tags=["🤖 RAG Generation"],
)

app.include_router(
    ai_content.router,
    prefix=f"{API_V1_PREFIX}/ai",
    tags=["🧠 AI Content"],
)


# =============================================================================
# SYSTEM ENDPOINTS
# =============================================================================

@app.get(
    "/",
    tags=["🔧 System"],
    summary="API Root",
    response_description="API welcome message and navigation",
)
async def root() -> Dict[str, Any]:
    """
    ## Welcome to E-Learning Platform API
    
    Returns API information and available endpoints for navigation.
    """
    return {
        "name": "E-Learning Platform API",
        "version": "1.0.0",
        "status": "operational",
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc",
            "openapi": "/openapi.json",
        },
        "endpoints": {
            "authentication": f"{API_V1_PREFIX}/auth",
            "users": f"{API_V1_PREFIX}/users",
            "courses": f"{API_V1_PREFIX}/courses",
            "lessons": f"{API_V1_PREFIX}/lessons",
            "quizzes": f"{API_V1_PREFIX}/quizzes",
            "reviews": f"{API_V1_PREFIX}/courses/{{course_id}}/reviews",
            "rag_generation": f"{API_V1_PREFIX}/rag",
        },
        "features": {
            "manual_courses": "Create courses with full manual control",
            "ai_generation": "Upload documents → Auto-generate courses",
            "progress_tracking": "Track learning progress and completion",
            "gamification": "Earn points and badges",
        },
    }


@app.get(
    "/health",
    tags=["🔧 System"],
    summary="Health Check",
    response_description="System health status",
)
async def health_check() -> Dict[str, Any]:
    """
    ## System Health Check
    
    Returns the current health status of the API and its dependencies.
    
    Used by orchestration tools (Kubernetes, Docker) for liveness probes.
    """
    return {
        "status": "healthy",
        "version": "1.0.0",
        "environment": settings.environment,
        "services": {
            "api": "operational",
            "database": "connected",
        },
    }


@app.get(
    "/ready",
    tags=["🔧 System"],
    summary="Readiness Check",
    response_description="System readiness status",
)
async def readiness_check() -> Dict[str, Any]:
    """
    ## System Readiness Check
    
    Returns whether the API is ready to accept traffic.
    
    Used by load balancers for readiness probes.
    """
    # TODO: Add actual database connectivity check
    return {
        "ready": True,
        "checks": {
            "database": "ready",
            "cache": "ready",
        },
    }


@app.get(
    f"{API_V1_PREFIX}/info",
    tags=["🔧 System"],
    summary="API Information",
    response_description="Detailed API information",
)
async def api_info() -> Dict[str, Any]:
    """
    ## API Information
    
    Returns detailed information about the API including:
    - Version information
    - Available features
    - Supported file formats
    - Rate limiting info
    """
    return {
        "api": {
            "name": "E-Learning Platform API",
            "version": "1.0.0",
            "api_version": "v1",
            "environment": settings.environment,
        },
        "features": {
            "authentication": {
                "type": "JWT",
                "token_expiry_minutes": settings.access_token_expire_minutes,
            },
            "courses": {
                "creation_methods": ["manual", "ai_generated"],
                "visibility_options": ["everyone", "enrolled_only"],
                "access_types": ["open", "paid", "invite_only"],
            },
            "rag_generation": {
                "supported_formats": ["pdf", "txt", "md", "docx"],
                "max_file_size_mb": 50,
                "llm_providers": ["ollama", "openai", "gemini"],
                "default_model": "gemma3:4b",
                "note": "Uses Gemma 3 4B via Ollama by default",
            },
            "quizzes": {
                "question_types": ["multiple_choice"],
                "scoring": "points_based",
            },
        },
        "rate_limits": {
            "requests_per_minute": 100,
            "upload_size_limit_mb": 50,
        },
    }


@app.get(
    f"{API_V1_PREFIX}/schema",
    tags=["🔧 System"],
    summary="Database Schema",
    response_description="Complete database schema reference",
)
async def database_schema() -> Dict[str, Any]:
    """
    ## Database Schema Reference
    
    Returns a complete overview of all database tables organized by feature.
    
    Useful for:
    - Understanding data relationships
    - API integration development
    - Documentation purposes
    """
    return {
        "schema_version": "1.0.0",
        "tables": {
            "authentication": {
                "users": {
                    "columns": ["id", "email", "password_hash", "name", "role", "total_points", "created_at"],
                    "primary_key": "id",
                    "indexes": ["email"],
                },
            },
            "gamification": {
                "badges": {
                    "columns": ["id", "name", "required_points", "description"],
                    "primary_key": "id",
                },
                "user_badges": {
                    "columns": ["id", "user_id", "badge_id", "awarded_at"],
                    "foreign_keys": ["users.id", "badges.id"],
                },
            },
            "courses": {
                "courses": {
                    "columns": ["id", "title", "description", "image_url", "tags", "published", "visibility", "access_type", "price", "course_admin_id", "total_lessons", "total_duration", "created_at", "updated_at"],
                    "primary_key": "id",
                    "foreign_keys": ["users.id"],
                },
                "course_enrollments": {
                    "columns": ["id", "course_id", "user_id", "enrolled_at", "started_at", "completed_at", "status", "time_spent", "completion_percentage"],
                    "foreign_keys": ["courses.id", "users.id"],
                },
                "course_reviews": {
                    "columns": ["id", "course_id", "user_id", "rating", "review_text", "created_at"],
                    "foreign_keys": ["courses.id", "users.id"],
                },
            },
            "lessons": {
                "lessons": {
                    "columns": ["id", "course_id", "title", "lesson_type", "description", "responsible_id", "order_index", "duration", "created_at"],
                    "foreign_keys": ["courses.id", "users.id"],
                },
                "lesson_videos": {"columns": ["lesson_id", "url"]},
                "lesson_documents": {"columns": ["lesson_id", "file_url", "allow_download"]},
                "lesson_images": {"columns": ["lesson_id", "file_url", "allow_download"]},
                "lesson_attachments": {"columns": ["id", "lesson_id", "file_url", "external_url", "description"]},
                "user_lesson_progress": {
                    "columns": ["id", "user_id", "lesson_id", "status", "completed_at", "time_spent"],
                    "foreign_keys": ["users.id", "lessons.id"],
                },
            },
            "quizzes": {
                "quizzes": {
                    "columns": ["id", "course_id", "title", "order_index"],
                    "foreign_keys": ["courses.id"],
                },
                "quiz_questions": {
                    "columns": ["id", "quiz_id", "question_text", "order_index", "points_first", "points_second", "points_third", "points_more"],
                    "foreign_keys": ["quizzes.id"],
                },
                "question_options": {
                    "columns": ["id", "question_id", "option_text", "is_correct", "order_index"],
                    "foreign_keys": ["quiz_questions.id"],
                },
                "quiz_attempts": {
                    "columns": ["id", "user_id", "quiz_id", "attempt_number", "status", "started_at", "completed_at", "earned_points"],
                    "foreign_keys": ["users.id", "quizzes.id"],
                },
                "quiz_attempt_answers": {
                    "columns": ["id", "attempt_id", "question_id", "selected_option_id", "is_correct"],
                    "foreign_keys": ["quiz_attempts.id", "quiz_questions.id", "question_options.id"],
                },
            },
            "rag_generation": {
                "uploaded_documents": {
                    "columns": ["id", "user_id", "filename", "original_filename", "file_path", "file_type", "file_size", "status", "title", "author", "total_pages", "total_chunks", "uploaded_at", "processed_at"],
                    "foreign_keys": ["users.id"],
                },
                "document_chunks": {
                    "columns": ["id", "document_id", "chunk_index", "content", "content_hash", "page_number", "chapter", "section", "embedding", "embedding_model", "token_count", "created_at"],
                    "foreign_keys": ["uploaded_documents.id"],
                },
                "course_generation_jobs": {
                    "columns": ["id", "document_id", "user_id", "status", "progress_percentage", "current_step", "error_message", "settings", "generated_outline", "generated_lessons", "generated_quizzes", "generated_course_id", "created_at", "started_at", "completed_at"],
                    "foreign_keys": ["uploaded_documents.id", "users.id", "courses.id"],
                },
                "rag_configurations": {
                    "columns": ["id", "user_id", "embedding_model", "chunk_size", "chunk_overlap", "llm_provider", "llm_model", "temperature", "max_tokens", "top_k_chunks", "similarity_threshold", "default_lessons_per_course", "default_quiz_questions", "created_at", "updated_at"],
                    "foreign_keys": ["users.id"],
                },
            },
        },
        "enums": {
            "UserRole": ["learner", "instructor", "admin"],
            "LessonType": ["video", "document", "image", "text"],
            "VisibilityType": ["everyone", "enrolled_only"],
            "AccessType": ["open", "paid", "invite_only"],
            "LessonStatus": ["not_started", "in_progress", "completed"],
            "EnrollmentStatus": ["yet_to_start", "in_progress", "completed"],
            "QuizAttemptStatus": ["in_progress", "completed"],
            "DocumentStatus": ["pending", "processing", "processed", "failed"],
            "GenerationStatus": ["pending", "analyzing", "generating_structure", "generating_content", "generating_quizzes", "completed", "failed"],
        },
    }


# =============================================================================
# MAIN ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.environment == "development",
        log_level="info",
        access_log=True,
    )