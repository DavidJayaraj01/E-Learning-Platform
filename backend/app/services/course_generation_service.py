"""
Course Generation Service

Generates complete courses from uploaded documents using RAG and LLM.

Features:
- Analyze document structure
- Generate course outline
- Create lessons from document content
- Generate quizzes for each lesson
"""

import json
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.sql import func

from app.models.rag_models import (
    UploadedDocument, DocumentChunk, 
    CourseGenerationJob, RAGConfiguration
)
from app.models.models import Course, Lesson, Quiz, QuizQuestion, QuestionOption
from app.services.document_service import DocumentProcessingService
from app.enums import LessonType, VisibilityType, AccessType

logger = logging.getLogger(__name__)


# =============================================================================
# LLM CLIENT INTERFACE
# =============================================================================

class LLMClient:
    """
    Interface for LLM providers (Ollama, OpenAI, Gemini).
    
    Default: Ollama with Gemma 3 4B model for efficient local generation.
    """
    
    # Default model: Gemma 3 4B - Fast, efficient, great for course generation
    DEFAULT_MODEL = 'gemma3:4b'
    
    def __init__(self, provider: str = 'ollama', model: str = None, **kwargs):
        self.provider = provider
        self.model = model or self.DEFAULT_MODEL
        self.temperature = kwargs.get('temperature', 0.7)
        self.max_tokens = kwargs.get('max_tokens', 2000)
    
    async def generate(self, prompt: str, system_prompt: str = None) -> str:
        """Generate text from prompt"""
        if self.provider == 'ollama':
            return await self._generate_ollama(prompt, system_prompt)
        elif self.provider == 'openai':
            return await self._generate_openai(prompt, system_prompt)
        elif self.provider == 'gemini':
            return await self._generate_gemini(prompt, system_prompt)
        else:
            raise ValueError(f"Unknown provider: {self.provider}")
    
    async def _generate_ollama(self, prompt: str, system_prompt: str = None) -> str:
        """Generate using local Ollama"""
        import httpx
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    "http://localhost:11434/api/chat",
                    json={
                        "model": self.model,
                        "messages": messages,
                        "stream": False,
                        "options": {
                            "temperature": self.temperature,
                            "num_predict": self.max_tokens
                        }
                    }
                )
                response.raise_for_status()
                result = response.json()
                return result.get("message", {}).get("content", "")
        except Exception as e:
            logger.error(f"Ollama generation failed: {e}")
            raise
    
    async def _generate_openai(self, prompt: str, system_prompt: str = None) -> str:
        """Generate using OpenAI API"""
        import os
        import httpx
        
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": self.temperature,
                    "max_tokens": self.max_tokens
                }
            )
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]
    
    async def _generate_gemini(self, prompt: str, system_prompt: str = None) -> str:
        """Generate using Google Gemini API"""
        import os
        import httpx
        
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable not set")
        
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent",
                params={"key": api_key},
                json={
                    "contents": [{"parts": [{"text": full_prompt}]}],
                    "generationConfig": {
                        "temperature": self.temperature,
                        "maxOutputTokens": self.max_tokens
                    }
                }
            )
            response.raise_for_status()
            result = response.json()
            return result["candidates"][0]["content"]["parts"][0]["text"]


# =============================================================================
# COURSE GENERATION SERVICE
# =============================================================================

class CourseGenerationService:
    """Service for generating courses from documents"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.doc_service = DocumentProcessingService(db)
        self.llm = None
    
    async def _init_llm(self, user_id: int):
        """Initialize LLM client based on user configuration"""
        # Get config
        result = await self.db.execute(
            select(RAGConfiguration).where(RAGConfiguration.user_id == user_id)
        )
        config = result.scalars().first()
        
        if not config:
            # Use defaults: Ollama with Gemma 3 4B
            self.llm = LLMClient(provider='ollama', model='gemma3:4b')
        else:
            self.llm = LLMClient(
                provider=config.llm_provider,
                model=config.llm_model,
                temperature=config.temperature,
                max_tokens=config.max_tokens
            )
    
    async def start_generation(
        self, 
        document_id: int, 
        user_id: int,
        settings: Dict[str, Any] = None
    ) -> CourseGenerationJob:
        """
        Start a course generation job.
        
        Args:
            document_id: ID of the processed document
            user_id: ID of the user
            settings: Generation settings
            
        Returns:
            Created CourseGenerationJob
        """
        # Verify document exists and is processed
        result = await self.db.execute(
            select(UploadedDocument)
            .where(UploadedDocument.id == document_id)
            .where(UploadedDocument.user_id == user_id)
        )
        doc = result.scalars().first()
        
        if not doc:
            raise ValueError("Document not found")
        
        if doc.status != 'processed':
            raise ValueError(f"Document not ready for generation. Status: {doc.status}")
        
        # Create generation job
        job = CourseGenerationJob(
            document_id=document_id,
            user_id=user_id,
            status='pending',
            settings=settings or {}
        )
        
        self.db.add(job)
        await self.db.commit()
        await self.db.refresh(job)
        
        # Start async generation (in background)
        asyncio.create_task(self._run_generation(job.id))
        
        return job
    
    async def _run_generation(self, job_id: int):
        """Run the full generation pipeline"""
        # Get fresh session for background task
        from app.database.config import AsyncSessionLocal
        
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(CourseGenerationJob).where(CourseGenerationJob.id == job_id)
            )
            job = result.scalars().first()
            
            if not job:
                logger.error(f"Job {job_id} not found")
                return
            
            try:
                # Initialize LLM
                await self._init_llm(job.user_id)
                
                # Update status
                job.status = 'analyzing'
                job.started_at = func.current_timestamp()
                job.current_step = 'Analyzing document structure...'
                job.progress_percentage = 10
                await db.commit()
                
                # Get document chunks
                doc_service = DocumentProcessingService(db)
                chunks = await doc_service.get_document_chunks(job.document_id)
                
                if not chunks:
                    raise ValueError("No document chunks found")
                
                # Step 1: Generate course outline
                job.status = 'generating_structure'
                job.current_step = 'Generating course structure...'
                job.progress_percentage = 20
                await db.commit()
                
                outline = await self._generate_outline(chunks, job.settings)
                job.generated_outline = outline
                job.progress_percentage = 40
                await db.commit()
                
                # Step 2: Generate lesson content
                job.status = 'generating_content'
                job.current_step = 'Generating lesson content...'
                await db.commit()
                
                lessons = await self._generate_lessons(chunks, outline, job.settings)
                job.generated_lessons = lessons
                job.progress_percentage = 70
                await db.commit()
                
                # Step 3: Generate quizzes
                if job.settings.get('include_quizzes', True):
                    job.status = 'generating_quizzes'
                    job.current_step = 'Generating quizzes...'
                    await db.commit()
                    
                    quizzes = await self._generate_quizzes(lessons, job.settings)
                    job.generated_quizzes = quizzes
                    job.progress_percentage = 90
                    await db.commit()
                
                # Step 4: Create course in database
                job.current_step = 'Creating course...'
                await db.commit()
                
                course_id = await self._create_course(
                    db, job.user_id, outline, lessons, 
                    job.generated_quizzes if job.settings.get('include_quizzes', True) else None
                )
                
                job.generated_course_id = course_id
                job.status = 'completed'
                job.progress_percentage = 100
                job.current_step = 'Course generation completed!'
                job.completed_at = func.current_timestamp()
                await db.commit()
                
                logger.info(f"Course generation completed: Job {job_id} -> Course {course_id}")
                
            except Exception as e:
                job.status = 'failed'
                job.error_message = str(e)
                await db.commit()
                logger.error(f"Course generation failed for job {job_id}: {e}")
    
    async def _generate_outline(
        self, 
        chunks: List[DocumentChunk], 
        settings: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate course outline from document chunks"""
        
        # Sample chunks for analysis (first, middle, last sections)
        sample_chunks = []
        if len(chunks) > 0:
            sample_chunks.append(chunks[0].content[:2000])
        if len(chunks) > 2:
            mid = len(chunks) // 2
            sample_chunks.append(chunks[mid].content[:2000])
        if len(chunks) > 1:
            sample_chunks.append(chunks[-1].content[:2000])
        
        context = "\n\n---\n\n".join(sample_chunks)
        
        max_lessons = settings.get('max_lessons', 10)
        difficulty = settings.get('difficulty_level', 'intermediate')
        
        prompt = f"""Analyze this document content and create a course outline.

DOCUMENT EXCERPTS:
{context}

Create a course with up to {max_lessons} lessons at {difficulty} difficulty level.

Respond ONLY with valid JSON in this exact format:
{{
    "title": "Course Title",
    "description": "A comprehensive description of the course (2-3 sentences)",
    "difficulty": "{difficulty}",
    "estimated_hours": 5,
    "tags": ["tag1", "tag2", "tag3"],
    "lessons": [
        {{
            "title": "Lesson 1 Title",
            "description": "Brief lesson description",
            "topics": ["topic1", "topic2"],
            "estimated_minutes": 15
        }}
    ]
}}"""

        system_prompt = """You are an expert instructional designer. Create well-structured, 
educational course outlines. Always respond with valid JSON only, no additional text."""

        response = await self.llm.generate(prompt, system_prompt)
        
        # Parse JSON response
        try:
            # Clean response (remove markdown code blocks if present)
            response = response.strip()
            if response.startswith('```'):
                response = response.split('\n', 1)[1]
            if response.endswith('```'):
                response = response.rsplit('```', 1)[0]
            response = response.strip()
            
            outline = json.loads(response)
            return outline
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse outline JSON: {e}")
            logger.error(f"Response was: {response[:500]}")
            # Return a default outline
            return {
                "title": "Generated Course",
                "description": "Course generated from uploaded document",
                "difficulty": difficulty,
                "estimated_hours": 5,
                "tags": ["auto-generated"],
                "lessons": [
                    {"title": "Introduction", "description": "Course introduction", "topics": [], "estimated_minutes": 15}
                ]
            }
    
    async def _generate_lessons(
        self, 
        chunks: List[DocumentChunk], 
        outline: Dict[str, Any],
        settings: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate detailed lesson content for each lesson in outline"""
        
        lessons = []
        lesson_outlines = outline.get('lessons', [])
        chunks_per_lesson = max(1, len(chunks) // len(lesson_outlines)) if lesson_outlines else 1
        
        for i, lesson_outline in enumerate(lesson_outlines):
            # Get relevant chunks for this lesson
            start_idx = i * chunks_per_lesson
            end_idx = min(start_idx + chunks_per_lesson, len(chunks))
            relevant_chunks = chunks[start_idx:end_idx]
            
            # Build context from chunks
            context = "\n\n".join([c.content for c in relevant_chunks])[:4000]
            
            prompt = f"""Create detailed lesson content based on the following:

LESSON TITLE: {lesson_outline.get('title', f'Lesson {i+1}')}
LESSON DESCRIPTION: {lesson_outline.get('description', '')}
TOPICS TO COVER: {', '.join(lesson_outline.get('topics', []))}

SOURCE CONTENT:
{context}

Create comprehensive lesson content. Respond with JSON:
{{
    "title": "{lesson_outline.get('title', f'Lesson {i+1}')}",
    "content": "Full lesson content in markdown format (educational, clear, with examples)",
    "key_points": ["key point 1", "key point 2"],
    "summary": "Brief lesson summary"
}}"""

            system_prompt = """You are an expert educator. Create clear, engaging lesson content 
that is well-structured and easy to understand. Use markdown formatting. Respond with JSON only."""

            response = await self.llm.generate(prompt, system_prompt)
            
            try:
                response = response.strip()
                if response.startswith('```'):
                    response = response.split('\n', 1)[1]
                if response.endswith('```'):
                    response = response.rsplit('```', 1)[0]
                
                lesson_content = json.loads(response.strip())
                lesson_content['order_index'] = i
                lesson_content['duration_minutes'] = lesson_outline.get('estimated_minutes', 15)
                lessons.append(lesson_content)
                
            except json.JSONDecodeError:
                # Fallback
                lessons.append({
                    'title': lesson_outline.get('title', f'Lesson {i+1}'),
                    'content': context[:2000] if context else 'Content not generated',
                    'key_points': lesson_outline.get('topics', []),
                    'summary': lesson_outline.get('description', ''),
                    'order_index': i,
                    'duration_minutes': 15
                })
        
        return lessons
    
    async def _generate_quizzes(
        self, 
        lessons: List[Dict[str, Any]], 
        settings: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate quizzes for each lesson"""
        
        quizzes = []
        questions_per_lesson = settings.get('quiz_questions_per_lesson', 5)
        
        for lesson in lessons:
            prompt = f"""Create a quiz for this lesson:

LESSON TITLE: {lesson.get('title', 'Lesson')}
LESSON CONTENT: {lesson.get('content', '')[:2000]}
KEY POINTS: {', '.join(lesson.get('key_points', []))}

Create {questions_per_lesson} multiple choice questions. Respond with JSON:
{{
    "title": "Quiz: {lesson.get('title', 'Lesson')}",
    "questions": [
        {{
            "question": "Question text?",
            "options": [
                {{"text": "Option A", "is_correct": false}},
                {{"text": "Option B", "is_correct": true}},
                {{"text": "Option C", "is_correct": false}},
                {{"text": "Option D", "is_correct": false}}
            ]
        }}
    ]
}}"""

            system_prompt = """You are an expert quiz creator. Create challenging but fair 
multiple choice questions that test understanding. Each question must have exactly 4 options 
with only one correct answer. Respond with valid JSON only."""

            response = await self.llm.generate(prompt, system_prompt)
            
            try:
                response = response.strip()
                if response.startswith('```'):
                    response = response.split('\n', 1)[1]
                if response.endswith('```'):
                    response = response.rsplit('```', 1)[0]
                
                quiz = json.loads(response.strip())
                quiz['lesson_index'] = lesson.get('order_index', 0)
                quizzes.append(quiz)
                
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse quiz for lesson: {lesson.get('title')}")
                continue
        
        return quizzes
    
    async def _create_course(
        self,
        db: AsyncSession,
        user_id: int,
        outline: Dict[str, Any],
        lessons: List[Dict[str, Any]],
        quizzes: Optional[List[Dict[str, Any]]] = None
    ) -> int:
        """Create the course in the database"""
        
        # Create course
        course = Course(
            title=outline.get('title', 'Generated Course'),
            description=outline.get('description', ''),
            tags=outline.get('tags', []),
            published=False,  # Start as draft
            visibility=VisibilityType.EVERYONE,
            access_type=AccessType.OPEN,
            course_admin_id=user_id,
            total_lessons=len(lessons)
        )
        
        db.add(course)
        await db.commit()
        await db.refresh(course)
        
        # Create lessons
        for lesson_data in lessons:
            lesson = Lesson(
                course_id=course.id,
                title=lesson_data.get('title', 'Untitled Lesson'),
                lesson_type=LessonType.TEXT,  # Default to text
                description=lesson_data.get('content', '')[:5000],  # Store in description for now
                order_index=lesson_data.get('order_index', 0)
            )
            db.add(lesson)
        
        await db.commit()
        
        # Create quizzes
        if quizzes:
            for quiz_data in quizzes:
                quiz = Quiz(
                    course_id=course.id,
                    title=quiz_data.get('title', 'Quiz'),
                    order_index=quiz_data.get('lesson_index', 0)
                )
                db.add(quiz)
                await db.commit()
                await db.refresh(quiz)
                
                # Create questions
                for q_idx, q_data in enumerate(quiz_data.get('questions', [])):
                    question = QuizQuestion(
                        quiz_id=quiz.id,
                        question_text=q_data.get('question', ''),
                        order_index=q_idx
                    )
                    db.add(question)
                    await db.commit()
                    await db.refresh(question)
                    
                    # Create options
                    for o_idx, o_data in enumerate(q_data.get('options', [])):
                        option = QuestionOption(
                            question_id=question.id,
                            option_text=o_data.get('text', ''),
                            is_correct=o_data.get('is_correct', False),
                            order_index=o_idx
                        )
                        db.add(option)
                
                await db.commit()
        
        return course.id
    
    async def get_job_status(self, job_id: int, user_id: int) -> Optional[CourseGenerationJob]:
        """Get the status of a generation job"""
        result = await self.db.execute(
            select(CourseGenerationJob)
            .where(CourseGenerationJob.id == job_id)
            .where(CourseGenerationJob.user_id == user_id)
        )
        return result.scalars().first()
    
    async def get_user_jobs(self, user_id: int) -> List[CourseGenerationJob]:
        """Get all generation jobs for a user"""
        result = await self.db.execute(
            select(CourseGenerationJob)
            .where(CourseGenerationJob.user_id == user_id)
            .order_by(CourseGenerationJob.created_at.desc())
        )
        return result.scalars().all()
