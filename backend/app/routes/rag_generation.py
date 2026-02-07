"""
RAG Course Generation Routes

Endpoints for:
- Document upload
- Course generation from documents
- Generation job status
- RAG configuration
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.database.config import get_async_session
from app.models.rag_models import UploadedDocument, DocumentChunk, CourseGenerationJob, RAGConfiguration
from app.models.models import User
from app.schemas.rag_schemas import (
    DocumentUploadResponse, DocumentDetails, DocumentListResponse,
    DocumentChunkResponse, StartGenerationRequest, GenerationJobResponse,
    GenerationJobDetails, GenerationSettings, RAGConfigurationCreate,
    RAGConfigurationUpdate, RAGConfigurationResponse, DocumentSearchQuery,
    DocumentSearchResponse, DocumentSearchResult
)
from app.services.document_service import DocumentProcessingService
from app.services.course_generation_service import CourseGenerationService

router = APIRouter()


# =============================================================================
# HELPER: Get current user (simplified for now)
# =============================================================================

async def get_current_user_id(db: AsyncSession = Depends(get_async_session)) -> int:
    """
    Get current user ID. 
    In production, this should use proper JWT authentication.
    For now, we'll use a placeholder or query param.
    """
    # TODO: Implement proper JWT authentication
    # For development, return user ID 1
    return 1


# =============================================================================
# DOCUMENT UPLOAD ENDPOINTS
# =============================================================================

@router.post("/documents/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    db: AsyncSession = Depends(get_async_session),
    user_id: int = Depends(get_current_user_id)
):
    """
    Upload a document (PDF, TXT, DOCX, EPUB) for course generation.
    
    The document will be processed asynchronously:
    1. Text extraction
    2. Chunking for RAG
    3. Embedding generation
    
    Check document status with GET /documents/{document_id}
    """
    # Read file content
    content = await file.read()
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file uploaded"
        )
    
    # Save document
    doc_service = DocumentProcessingService(db)
    
    try:
        doc = await doc_service.save_uploaded_file(
            file_content=content,
            filename=file.filename,
            user_id=user_id
        )
        
        # Process document in background
        if background_tasks:
            background_tasks.add_task(doc_service.process_document, doc.id)
        
        return doc
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/documents/{document_id}/process")
async def process_document(
    document_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_async_session),
    user_id: int = Depends(get_current_user_id)
):
    """
    Manually trigger document processing.
    
    Use this if automatic processing failed or wasn't triggered.
    """
    # Verify document exists and belongs to user
    result = await db.execute(
        select(UploadedDocument)
        .where(UploadedDocument.id == document_id)
        .where(UploadedDocument.user_id == user_id)
    )
    doc = result.scalars().first()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    if doc.status == 'processing':
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Document is already being processed"
        )
    
    # Process in background
    doc_service = DocumentProcessingService(db)
    background_tasks.add_task(doc_service.process_document, document_id)
    
    return {"message": "Document processing started", "document_id": document_id}


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents(
    skip: int = 0,
    limit: int = 50,
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_async_session),
    user_id: int = Depends(get_current_user_id)
):
    """
    Get list of user's uploaded documents.
    
    Optional status filter: pending, processing, processed, failed
    """
    query = select(UploadedDocument).where(UploadedDocument.user_id == user_id)
    
    if status_filter:
        query = query.where(UploadedDocument.status == status_filter)
    
    query = query.order_by(UploadedDocument.uploaded_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    documents = result.scalars().all()
    
    # Get total count
    count_result = await db.execute(
        select(UploadedDocument).where(UploadedDocument.user_id == user_id)
    )
    total = len(count_result.scalars().all())
    
    return DocumentListResponse(documents=documents, total_count=total)


@router.get("/documents/{document_id}", response_model=DocumentDetails)
async def get_document(
    document_id: int,
    db: AsyncSession = Depends(get_async_session),
    user_id: int = Depends(get_current_user_id)
):
    """
    Get detailed information about an uploaded document.
    """
    result = await db.execute(
        select(UploadedDocument)
        .where(UploadedDocument.id == document_id)
        .where(UploadedDocument.user_id == user_id)
    )
    doc = result.scalars().first()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    return doc


@router.get("/documents/{document_id}/chunks", response_model=List[DocumentChunkResponse])
async def get_document_chunks(
    document_id: int,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_async_session),
    user_id: int = Depends(get_current_user_id)
):
    """
    Get chunks from a processed document.
    
    Useful for previewing how the document was split for RAG.
    """
    # Verify ownership
    result = await db.execute(
        select(UploadedDocument)
        .where(UploadedDocument.id == document_id)
        .where(UploadedDocument.user_id == user_id)
    )
    if not result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    doc_service = DocumentProcessingService(db)
    chunks = await doc_service.get_document_chunks(document_id, skip, limit)
    
    return chunks


@router.post("/documents/{document_id}/search", response_model=DocumentSearchResponse)
async def search_document(
    document_id: int,
    query: DocumentSearchQuery,
    db: AsyncSession = Depends(get_async_session),
    user_id: int = Depends(get_current_user_id)
):
    """
    Search within a document using semantic similarity.
    
    Returns the most relevant chunks for the given query.
    """
    # Verify ownership
    result = await db.execute(
        select(UploadedDocument)
        .where(UploadedDocument.id == document_id)
        .where(UploadedDocument.user_id == user_id)
    )
    if not result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    doc_service = DocumentProcessingService(db)
    
    try:
        results = await doc_service.search_document(
            document_id=document_id,
            query=query.query,
            top_k=query.top_k
        )
        
        search_results = [
            DocumentSearchResult(
                chunk_id=chunk.id,
                content=chunk.content,
                page_number=chunk.page_number,
                chapter=chunk.chapter,
                similarity_score=score
            )
            for chunk, score in results
        ]
        
        return DocumentSearchResponse(
            query=query.query,
            results=search_results,
            total_results=len(search_results)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_async_session),
    user_id: int = Depends(get_current_user_id)
):
    """
    Delete an uploaded document and all its chunks.
    """
    doc_service = DocumentProcessingService(db)
    deleted = await doc_service.delete_document(document_id, user_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )


# =============================================================================
# COURSE GENERATION ENDPOINTS
# =============================================================================

@router.post("/generate", response_model=GenerationJobResponse, status_code=status.HTTP_201_CREATED)
async def start_course_generation(
    request: StartGenerationRequest,
    db: AsyncSession = Depends(get_async_session),
    user_id: int = Depends(get_current_user_id)
):
    """
    Start generating a course from an uploaded document.
    
    The generation process runs in the background and includes:
    1. Document analysis
    2. Course structure generation
    3. Lesson content generation
    4. Quiz generation (if enabled)
    
    Monitor progress with GET /generate/{job_id}
    """
    gen_service = CourseGenerationService(db)
    
    # Build settings dict
    settings = {}
    if request.settings:
        settings = request.settings.dict()
    if request.course_title:
        settings['course_title'] = request.course_title
    if request.course_description:
        settings['course_description'] = request.course_description
    
    try:
        job = await gen_service.start_generation(
            document_id=request.document_id,
            user_id=user_id,
            settings=settings
        )
        return job
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/generate/jobs", response_model=List[GenerationJobResponse])
async def list_generation_jobs(
    db: AsyncSession = Depends(get_async_session),
    user_id: int = Depends(get_current_user_id)
):
    """
    Get all course generation jobs for the current user.
    """
    gen_service = CourseGenerationService(db)
    jobs = await gen_service.get_user_jobs(user_id)
    return jobs


@router.get("/generate/{job_id}", response_model=GenerationJobDetails)
async def get_generation_job(
    job_id: int,
    db: AsyncSession = Depends(get_async_session),
    user_id: int = Depends(get_current_user_id)
):
    """
    Get the status and details of a course generation job.
    
    Includes progress percentage, current step, and generated content outline.
    """
    gen_service = CourseGenerationService(db)
    job = await gen_service.get_job_status(job_id, user_id)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Generation job not found"
        )
    
    return job


@router.delete("/generate/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_generation_job(
    job_id: int,
    db: AsyncSession = Depends(get_async_session),
    user_id: int = Depends(get_current_user_id)
):
    """
    Cancel a pending or in-progress generation job.
    
    Note: Already completed jobs cannot be cancelled.
    """
    result = await db.execute(
        select(CourseGenerationJob)
        .where(CourseGenerationJob.id == job_id)
        .where(CourseGenerationJob.user_id == user_id)
    )
    job = result.scalars().first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Generation job not found"
        )
    
    if job.status in ['completed', 'failed']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel {job.status} job"
        )
    
    job.status = 'failed'
    job.error_message = 'Cancelled by user'
    await db.commit()


# =============================================================================
# RAG CONFIGURATION ENDPOINTS
# =============================================================================

@router.get("/config", response_model=RAGConfigurationResponse)
async def get_rag_config(
    db: AsyncSession = Depends(get_async_session),
    user_id: int = Depends(get_current_user_id)
):
    """
    Get the RAG configuration for the current user.
    
    Returns user-specific config if exists, otherwise global defaults.
    """
    # Try user config first
    result = await db.execute(
        select(RAGConfiguration).where(RAGConfiguration.user_id == user_id)
    )
    config = result.scalars().first()
    
    if config:
        return config
    
    # Try global config
    result = await db.execute(
        select(RAGConfiguration).where(RAGConfiguration.user_id == None)
    )
    config = result.scalars().first()
    
    if config:
        return config
    
    # Return default values
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="No configuration found. Create one with POST /config"
    )


@router.post("/config", response_model=RAGConfigurationResponse, status_code=status.HTTP_201_CREATED)
async def create_rag_config(
    config_data: RAGConfigurationCreate,
    db: AsyncSession = Depends(get_async_session),
    user_id: int = Depends(get_current_user_id)
):
    """
    Create or update RAG configuration for the current user.
    """
    # Check if config already exists
    result = await db.execute(
        select(RAGConfiguration).where(RAGConfiguration.user_id == user_id)
    )
    existing = result.scalars().first()
    
    if existing:
        # Update existing
        for field, value in config_data.dict().items():
            setattr(existing, field, value)
        await db.commit()
        await db.refresh(existing)
        return existing
    
    # Create new
    config = RAGConfiguration(user_id=user_id, **config_data.dict())
    db.add(config)
    await db.commit()
    await db.refresh(config)
    
    return config


@router.put("/config", response_model=RAGConfigurationResponse)
async def update_rag_config(
    config_data: RAGConfigurationUpdate,
    db: AsyncSession = Depends(get_async_session),
    user_id: int = Depends(get_current_user_id)
):
    """
    Update RAG configuration for the current user.
    
    Only provided fields will be updated.
    """
    result = await db.execute(
        select(RAGConfiguration).where(RAGConfiguration.user_id == user_id)
    )
    config = result.scalars().first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration not found. Create one with POST /config first."
        )
    
    # Update only provided fields
    update_data = config_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)
    
    await db.commit()
    await db.refresh(config)
    
    return config


# =============================================================================
# UTILITY ENDPOINTS
# =============================================================================

@router.get("/supported-formats")
async def get_supported_formats():
    """
    Get list of supported document formats for upload.
    """
    return {
        "supported_formats": [
            {"extension": "pdf", "description": "PDF documents", "max_size_mb": 50},
            {"extension": "txt", "description": "Plain text files", "max_size_mb": 50},
            {"extension": "md", "description": "Markdown files", "max_size_mb": 50},
            {"extension": "docx", "description": "Microsoft Word documents", "max_size_mb": 50},
            {"extension": "epub", "description": "EPUB e-books", "max_size_mb": 50}
        ],
        "max_file_size_mb": 50,
        "note": "DOCX and EPUB support requires additional libraries"
    }


@router.get("/llm-providers")
async def get_llm_providers():
    """
    Get list of supported LLM providers for course generation.
    """
    return {
        "default_model": "gemma3:4b",
        "providers": [
            {
                "name": "ollama",
                "description": "Local LLM using Ollama",
                "models": ["gemma3:4b", "gemma3:12b", "gemma3:27b", "llama3", "mistral", "codellama"],
                "default_model": "gemma3:4b",
                "requires_api_key": False,
                "default": True,
                "note": "Gemma 3 4B is recommended for fast, efficient course generation"
            },
            {
                "name": "openai",
                "description": "OpenAI GPT models",
                "models": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
                "requires_api_key": True,
                "env_var": "OPENAI_API_KEY"
            },
            {
                "name": "gemini",
                "description": "Google Gemini models",
                "models": ["gemini-pro", "gemini-1.5-pro", "gemini-2.0-flash"],
                "requires_api_key": True,
                "env_var": "GOOGLE_API_KEY"
            }
        ]
    }
