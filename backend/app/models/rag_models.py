"""
Document Models for RAG-based Course Generation

This module contains models for:
- Document uploads (books, PDFs, etc.)
- Document chunks for vector storage
- Course generation jobs
"""

from sqlalchemy import (
    Column, Integer, String, Boolean, TIMESTAMP, TEXT, 
    ForeignKey, Float, JSON, LargeBinary
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import ENUM, ARRAY
from app.database.config import Base


class UploadedDocument(Base):
    """
    Stores uploaded documents (books, PDFs) for course generation.
    
    Table: uploaded_documents
    """
    __tablename__ = "uploaded_documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # File information
    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False)
    file_type = Column(String(50), nullable=False)  # pdf, epub, docx, txt
    file_size = Column(Integer)  # in bytes
    
    # Processing status
    status = Column(
        ENUM('pending', 'processing', 'processed', 'failed', name='document_status'),
        default='pending'
    )
    error_message = Column(TEXT, nullable=True)
    
    # Extracted metadata
    title = Column(String(500), nullable=True)
    author = Column(String(255), nullable=True)
    total_pages = Column(Integer, nullable=True)
    total_chunks = Column(Integer, default=0)
    
    # Timestamps
    uploaded_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    processed_at = Column(TIMESTAMP, nullable=True)
    
    # Relationships
    user = relationship("User", backref="uploaded_documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    generation_jobs = relationship("CourseGenerationJob", back_populates="document")


class DocumentChunk(Base):
    """
    Stores chunked text from documents with embeddings for RAG.
    
    Table: document_chunks
    """
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("uploaded_documents.id", ondelete="CASCADE"), nullable=False)
    
    # Chunk content
    chunk_index = Column(Integer, nullable=False)  # Order in document
    content = Column(TEXT, nullable=False)
    content_hash = Column(String(64), nullable=True)  # For deduplication
    
    # Metadata
    page_number = Column(Integer, nullable=True)
    chapter = Column(String(255), nullable=True)
    section = Column(String(255), nullable=True)
    
    # Embedding vector (stored as array of floats)
    embedding = Column(ARRAY(Float), nullable=True)
    embedding_model = Column(String(100), default='all-MiniLM-L6-v2')
    
    # Token count for context management
    token_count = Column(Integer, nullable=True)
    
    # Timestamps
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relationships
    document = relationship("UploadedDocument", back_populates="chunks")


class CourseGenerationJob(Base):
    """
    Tracks course generation jobs from documents.
    
    Table: course_generation_jobs
    """
    __tablename__ = "course_generation_jobs"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("uploaded_documents.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Job status
    status = Column(
        ENUM('pending', 'analyzing', 'generating_structure', 'generating_content', 
             'generating_quizzes', 'completed', 'failed', name='generation_status'),
        default='pending'
    )
    progress_percentage = Column(Integer, default=0)
    current_step = Column(String(255), nullable=True)
    error_message = Column(TEXT, nullable=True)
    
    # Generation settings
    settings = Column(JSON, default={})  # Customization options
    # Example settings:
    # {
    #     "max_lessons": 20,
    #     "include_quizzes": true,
    #     "quiz_questions_per_lesson": 5,
    #     "lesson_duration_minutes": 15,
    #     "difficulty_level": "intermediate"
    # }
    
    # Generated content (before final course creation)
    generated_outline = Column(JSON, nullable=True)
    generated_lessons = Column(JSON, nullable=True)
    generated_quizzes = Column(JSON, nullable=True)
    
    # Result
    generated_course_id = Column(Integer, ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    
    # Timestamps
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    started_at = Column(TIMESTAMP, nullable=True)
    completed_at = Column(TIMESTAMP, nullable=True)
    
    # Relationships
    document = relationship("UploadedDocument", back_populates="generation_jobs")
    user = relationship("User", backref="generation_jobs")
    generated_course = relationship("Course", backref="generation_job")


class RAGConfiguration(Base):
    """
    Stores RAG configuration settings per user or globally.
    
    Table: rag_configurations
    """
    __tablename__ = "rag_configurations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)  # NULL = global config
    
    # Embedding settings
    embedding_model = Column(String(100), default='all-MiniLM-L6-v2')
    chunk_size = Column(Integer, default=1000)  # characters
    chunk_overlap = Column(Integer, default=200)  # characters
    
    # LLM settings
    llm_provider = Column(String(50), default='ollama')  # ollama, openai, gemini
    llm_model = Column(String(100), default='gemma3:4b')  # Gemma 3 4B - fast and efficient
    temperature = Column(Float, default=0.7)
    max_tokens = Column(Integer, default=2000)
    
    # RAG settings
    top_k_chunks = Column(Integer, default=5)  # Number of chunks to retrieve
    similarity_threshold = Column(Float, default=0.7)
    
    # Course generation defaults
    default_lessons_per_course = Column(Integer, default=10)
    default_quiz_questions = Column(Integer, default=5)
    
    # Timestamps
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    user = relationship("User", backref="rag_config")
