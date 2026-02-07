"""
Pydantic Schemas for RAG-based Course Generation

Schemas for:
- Document upload
- Course generation requests/responses
- RAG configuration
"""

from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# =============================================================================
# ENUMS
# =============================================================================

class DocumentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"


class GenerationStatus(str, Enum):
    PENDING = "pending"
    ANALYZING = "analyzing"
    GENERATING_STRUCTURE = "generating_structure"
    GENERATING_CONTENT = "generating_content"
    GENERATING_QUIZZES = "generating_quizzes"
    COMPLETED = "completed"
    FAILED = "failed"


class DifficultyLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


# =============================================================================
# DOCUMENT SCHEMAS
# =============================================================================

class DocumentUploadResponse(BaseModel):
    """Response after uploading a document"""
    id: int
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    status: DocumentStatus
    uploaded_at: datetime
    
    class Config:
        from_attributes = True


class DocumentDetails(DocumentUploadResponse):
    """Detailed document information after processing"""
    title: Optional[str] = None
    author: Optional[str] = None
    total_pages: Optional[int] = None
    total_chunks: int = 0
    processed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    
    class Config:
        from_attributes = True


class DocumentChunkResponse(BaseModel):
    """Response for a document chunk"""
    id: int
    chunk_index: int
    content: str
    page_number: Optional[int] = None
    chapter: Optional[str] = None
    section: Optional[str] = None
    token_count: Optional[int] = None
    
    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    """List of user's uploaded documents"""
    documents: List[DocumentDetails]
    total_count: int


# =============================================================================
# COURSE GENERATION SCHEMAS
# =============================================================================

class GenerationSettings(BaseModel):
    """Settings for course generation"""
    max_lessons: int = Field(default=10, ge=1, le=50, description="Maximum number of lessons to generate")
    include_quizzes: bool = Field(default=True, description="Generate quizzes for each lesson")
    quiz_questions_per_lesson: int = Field(default=5, ge=1, le=20, description="Questions per quiz")
    lesson_duration_minutes: int = Field(default=15, ge=5, le=60, description="Target lesson duration")
    difficulty_level: DifficultyLevel = Field(default=DifficultyLevel.INTERMEDIATE)
    include_summaries: bool = Field(default=True, description="Generate lesson summaries")
    generate_tags: bool = Field(default=True, description="Auto-generate course tags")
    language: str = Field(default="english", description="Target language for content")


class StartGenerationRequest(BaseModel):
    """Request to start course generation from a document"""
    document_id: int
    course_title: Optional[str] = None  # If None, will be generated from document
    course_description: Optional[str] = None
    settings: Optional[GenerationSettings] = None


class GenerationJobResponse(BaseModel):
    """Response for a generation job"""
    id: int
    document_id: int
    status: GenerationStatus
    progress_percentage: int
    current_step: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    generated_course_id: Optional[int] = None
    
    class Config:
        from_attributes = True


class GenerationJobDetails(GenerationJobResponse):
    """Detailed generation job with generated content"""
    settings: Optional[Dict[str, Any]] = None
    generated_outline: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True


class CourseOutline(BaseModel):
    """Generated course outline for preview"""
    title: str
    description: str
    estimated_duration: str
    difficulty_level: str
    tags: List[str]
    lessons: List[Dict[str, Any]]  # List of lesson previews
    quiz_count: int


class GenerationPreviewResponse(BaseModel):
    """Preview of what will be generated"""
    job_id: int
    document_title: str
    outline: CourseOutline
    estimated_generation_time: str


# =============================================================================
# RAG CONFIGURATION SCHEMAS
# =============================================================================

class RAGConfigurationBase(BaseModel):
    """Base RAG configuration schema"""
    embedding_model: str = "all-MiniLM-L6-v2"
    chunk_size: int = Field(default=1000, ge=100, le=5000)
    chunk_overlap: int = Field(default=200, ge=0, le=1000)
    llm_provider: str = "ollama"
    llm_model: str = "gemma3:4b"  # Gemma 3 4B - fast and efficient
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=2000, ge=100, le=8000)
    top_k_chunks: int = Field(default=5, ge=1, le=20)
    similarity_threshold: float = Field(default=0.7, ge=0.0, le=1.0)
    default_lessons_per_course: int = Field(default=10, ge=1, le=50)
    default_quiz_questions: int = Field(default=5, ge=1, le=20)


class RAGConfigurationCreate(RAGConfigurationBase):
    """Create RAG configuration"""
    pass


class RAGConfigurationUpdate(BaseModel):
    """Update RAG configuration (all fields optional)"""
    embedding_model: Optional[str] = None
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    top_k_chunks: Optional[int] = None
    similarity_threshold: Optional[float] = None
    default_lessons_per_course: Optional[int] = None
    default_quiz_questions: Optional[int] = None


class RAGConfigurationResponse(RAGConfigurationBase):
    """RAG configuration response"""
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# =============================================================================
# SEARCH & QUERY SCHEMAS
# =============================================================================

class DocumentSearchQuery(BaseModel):
    """Query to search within a document"""
    query: str
    document_id: int
    top_k: int = Field(default=5, ge=1, le=20)


class DocumentSearchResult(BaseModel):
    """Search result from document"""
    chunk_id: int
    content: str
    page_number: Optional[int] = None
    chapter: Optional[str] = None
    similarity_score: float


class DocumentSearchResponse(BaseModel):
    """Response for document search"""
    query: str
    results: List[DocumentSearchResult]
    total_results: int


# =============================================================================
# PROGRESS & STATUS SCHEMAS
# =============================================================================

class GenerationProgress(BaseModel):
    """Real-time generation progress update"""
    job_id: int
    status: GenerationStatus
    progress_percentage: int
    current_step: str
    steps_completed: List[str]
    estimated_time_remaining: Optional[str] = None


class ProcessingStats(BaseModel):
    """Document processing statistics"""
    document_id: int
    total_pages: int
    total_chunks: int
    average_chunk_size: int
    processing_time_seconds: float
