"""
AI Content Generation Routes

Provides endpoints for generating content using local Ollama with Gemma model.
- Lesson content generation
- Quiz question generation
- Image descriptions
- Direct save to database
"""

from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
from pydantic import BaseModel, Field
from typing import List, Optional
import httpx
import logging
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import get_current_user, require_instructor_or_admin
from app.models.models import User, Lesson, Quiz, QuizQuestion, QuestionOption, Course
from app.database.config import get_async_session
from sqlalchemy import select

router = APIRouter(tags=["AI Content Generation"])
logger = logging.getLogger(__name__)

# Ollama configuration
OLLAMA_URL = "http://localhost:11434/api/chat"
# Common model names: gemma3:12b, gemma2:12b, gemma:12b, llama3:8b
DEFAULT_MODEL = "gemma3:4b"  # Using Gemma 4B as available


# =============================================================================
# CONTENT CLEANING FUNCTIONS
# =============================================================================

def clean_ai_content(content: str) -> str:
    """Clean AI-generated content by removing special symbols and meta phrases"""
    import re
    
    # Remove common intro phrases
    intro_patterns = [
        r'^(Okay,?\s*)?[Hh]ere\'?s\s+(a\s+)?(comprehensive\s+)?(lesson\s+on\s+|guide\s+to\s+|overview\s+of\s+)?',
        r'^(Alright,?\s*)?[Ll]et\'?s\s+(create\s+|start\s+with\s+|begin\s+with\s+)',
        r'^(Sure,?\s*)?[Ii]\'?ll\s+(create\s+|generate\s+|provide\s+)',
        r'^[Tt]his\s+lesson\s+(will\s+cover|covers)\s+',
        r'^[Tt]oday\s+we\'?ll\s+(learn\s+about|explore|discuss)\s+',
        r'^[Ii]n\s+this\s+(lesson|guide|tutorial),?\s+(we\'?ll|you\'?ll)\s+',
    ]
    
    for pattern in intro_patterns:
        content = re.sub(pattern, '', content, flags=re.IGNORECASE).strip()
    
    # Remove special formatting symbols
    content = re.sub(r'\*\*([^*]+)\*\*', r'\1', content)  # **bold** -> bold
    content = re.sub(r'\*([^*]+)\*', r'\1', content)      # *italic* -> italic
    content = re.sub(r'__([^_]+)__', r'\1', content)      # __underline__ -> underline
    content = re.sub(r'_([^_]+)_', r'\1', content)        # _italic_ -> italic
    
    # Remove multiple spaces and clean up
    content = re.sub(r'\s+', ' ', content).strip()
    
    return content


# =============================================================================
# REQUEST/RESPONSE SCHEMAS
# =============================================================================

class ContentGenerationRequest(BaseModel):
    """Request for generating lesson content"""
    topic: str = Field(..., description="Topic or prompt for content generation")
    content_type: str = Field(default="document", description="Type: document, video_script, image_description")
    additional_context: Optional[str] = Field(None, description="Additional context or requirements")


class ContentGenerationResponse(BaseModel):
    """Response with generated content"""
    content: str
    title_suggestion: Optional[str] = None


class QuizGenerationRequest(BaseModel):
    """Request for generating quiz questions"""
    topic: str = Field(..., description="Topic for quiz generation")
    num_questions: int = Field(default=5, ge=1, le=20, description="Number of questions to generate")
    difficulty: str = Field(default="medium", description="Difficulty: easy, medium, hard")
    question_types: List[str] = Field(
        default=["multiple_choice"],
        description="Types: multiple_choice, true_false, open_ended"
    )


class QuizQuestionGenerated(BaseModel):
    """A generated quiz question"""
    question_text: str
    question_type: str
    points: int = 10
    answers: List[dict]  # [{"answer_text": "...", "is_correct": True/False}]


class QuizGenerationResponse(BaseModel):
    """Response with generated quiz questions"""
    title_suggestion: str
    description_suggestion: str
    questions: List[QuizQuestionGenerated]


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

async def generate_with_ollama(prompt: str, system_prompt: str = None, model: str = DEFAULT_MODEL) -> str:
    """Generate content using local Ollama"""
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(180.0, connect=30.0)) as client:
            response = await client.post(
                OLLAMA_URL,
                json={
                    "model": model,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": 4000
                    }
                }
            )
            response.raise_for_status()
            result = response.json()
            content = result.get("message", {}).get("content", "")
            
            if not content:
                raise ValueError("Ollama returned empty response")
            
            return content
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Cannot connect to Ollama. Make sure Ollama is running with 'ollama serve'"
        )
    except Exception as e:
        logger.error(f"Ollama generation error: {e}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/generate-content", response_model=ContentGenerationResponse)
async def generate_content(
    request: ContentGenerationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate lesson content using AI.
    
    Supports:
    - document: Educational text content with markdown
    - video_script: Script for video lessons
    - image_description: Description for image-based lessons
    """
    
    system_prompts = {
        "document": """You are an expert educational content creator. Create comprehensive, well-structured lesson content.
Use markdown formatting with:
- Clear headings (## for sections)
- Bullet points for key concepts
- Code blocks if relevant
- Examples and explanations
Keep content engaging and educational.""",

        "video_script": """You are an expert video script writer for educational content.
Create an engaging video script that includes:
- Introduction hook
- Main content sections with clear transitions
- Examples and visual cues (in brackets)
- Summary and call to action
Format with timestamps and speaker notes.""",

        "image_description": """You are creating educational image lesson content.
Provide:
- A detailed description of what the image should convey
- Key visual elements to include
- Educational points the image illustrates
- Suggested captions or labels"""
    }
    
    content_type = request.content_type.lower()
    system_prompt = system_prompts.get(content_type, system_prompts["document"])
    
    prompt = f"""Create educational content about: {request.topic}

{f'Additional requirements: {request.additional_context}' if request.additional_context else ''}

Please provide comprehensive, well-organized content suitable for an e-learning lesson."""
    
    content = await generate_with_ollama(prompt, system_prompt)
    
    # Generate a title suggestion
    title_prompt = f"Suggest a concise, engaging title (max 10 words) for this lesson about: {request.topic}\nRespond with just the title, no quotes or extra text."
    title = await generate_with_ollama(title_prompt)
    title = title.strip().strip('"').strip("'")[:100]  # Clean and limit
    
    return ContentGenerationResponse(
        content=content,
        title_suggestion=title
    )


@router.post("/generate-quiz", response_model=QuizGenerationResponse)
async def generate_quiz(
    request: QuizGenerationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate quiz questions using AI.
    
    Creates complete quiz with questions and answers based on the topic.
    """
    
    system_prompt = """You are an expert quiz creator for educational platforms.
Create clear, well-structured quiz questions that test understanding.
Always respond in valid JSON format."""
    
    question_type_desc = {
        "multiple_choice": "multiple choice with 4 options",
        "true_false": "true/false",
        "open_ended": "open-ended (short answer)"
    }
    
    types_str = ", ".join([question_type_desc.get(t, t) for t in request.question_types])
    
    prompt = f"""Create a quiz about: {request.topic}

Requirements:
- Number of questions: {request.num_questions}
- Difficulty: {request.difficulty}
- Question types: {types_str}

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{{
    "title": "Quiz title here",
    "description": "Brief description of the quiz",
    "questions": [
        {{
            "question_text": "The question text",
            "question_type": "multiple_choice",
            "points": 10,
            "answers": [
                {{"answer_text": "Option A", "is_correct": true}},
                {{"answer_text": "Option B", "is_correct": false}},
                {{"answer_text": "Option C", "is_correct": false}},
                {{"answer_text": "Option D", "is_correct": false}}
            ]
        }}
    ]
}}

For true_false questions, provide exactly 2 answers (True and False).
For open_ended questions, provide 1 answer with the expected answer.
Make sure exactly one answer is marked as correct for each question."""
    
    response_text = await generate_with_ollama(prompt, system_prompt)
    
    # Parse the JSON response
    import json
    import re
    
    logger.info(f"Quiz generation - Raw response length: {len(response_text)}")
    
    try:
        clean_response = response_text.strip()
        
        # Remove markdown code blocks if present
        if "```json" in clean_response:
            match = re.search(r'```json\s*(.*?)\s*```', clean_response, re.DOTALL)
            if match:
                clean_response = match.group(1).strip()
        elif clean_response.startswith("```"):
            lines = clean_response.split("\n")
            clean_response = "\n".join(lines[1:-1] if len(lines) > 2 and lines[-1].strip() == "```" else lines[1:])
        
        # Try to extract JSON object if there's extra text
        if not clean_response.startswith("{"):
            match = re.search(r'\{.*\}', clean_response, re.DOTALL)
            if match:
                clean_response = match.group(0)
        
        data = json.loads(clean_response)
        logger.info(f"Successfully parsed quiz JSON with {len(data.get('questions', []))} questions")
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse quiz JSON: {e}")
        logger.error(f"Response preview: {response_text[:500]}")
        raise HTTPException(
            status_code=500,
            detail="Failed to parse AI response. Please try again."
        )
    
    # Validate and structure the response
    questions = []
    for q in data.get("questions", []):
        questions.append(QuizQuestionGenerated(
            question_text=q.get("question_text", ""),
            question_type=q.get("question_type", "multiple_choice"),
            points=q.get("points", 10),
            answers=q.get("answers", [])
        ))
    
    return QuizGenerationResponse(
        title_suggestion=data.get("title", f"Quiz: {request.topic}"),
        description_suggestion=data.get("description", f"Test your knowledge about {request.topic}"),
        questions=questions
    )


@router.get("/health")
async def ai_health_check():
    """Check if Ollama is available and the model is loaded"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Check Ollama is running
            response = await client.get("http://localhost:11434/api/tags")
            response.raise_for_status()
            models = response.json().get("models", [])
            
            model_names = [m.get("name", "") for m in models]
            has_gemma = any("gemma" in name.lower() for name in model_names)
            
            return {
                "ollama_running": True,
                "available_models": model_names,
                "gemma_available": has_gemma,
                "default_model": DEFAULT_MODEL
            }
    except Exception as e:
        return {
            "ollama_running": False,
            "error": str(e),
            "message": "Start Ollama with 'ollama serve' and pull the model with 'ollama pull gemma2:12b'"
        }


# =============================================================================
# GENERATE AND SAVE ENDPOINTS
# =============================================================================

class GenerateAndSaveLessonRequest(BaseModel):
    """Request to generate and save lesson directly"""
    course_id: int
    topic: str
    lesson_type: str = "DOCUMENT"
    additional_context: Optional[str] = None


class GenerateAndSaveQuizRequest(BaseModel):
    """Request to generate and save quiz directly"""
    course_id: int
    topic: str
    num_questions: int = 5
    difficulty: str = "medium"
    passing_score: int = 70
    time_limit: Optional[int] = None


@router.post("/generate-and-save-lesson")
async def generate_and_save_lesson(
    request: GenerateAndSaveLessonRequest,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(require_instructor_or_admin)
):
    """
    Generate lesson content with AI and save directly to database.
    Requires instructor or admin role.
    """
    # Verify course exists and user can manage it
    course_result = await db.execute(select(Course).where(Course.id == request.course_id))
    course = course_result.scalars().first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check permissions
    from app.services.access_control_service import can_manage_course
    if not await can_manage_course(request.course_id, current_user, db):
        raise HTTPException(status_code=403, detail="You don't have permission to manage this course")
    
    # Generate content using AI
    content_type = "document" if request.lesson_type == "DOCUMENT" else \
                   "video_script" if request.lesson_type == "VIDEO" else \
                   "image_description"
    
    system_prompt = """You are an expert educational content creator. Create comprehensive, well-structured lesson content.
Use markdown formatting with clear headings, bullet points, code blocks if relevant, examples and explanations.
Keep content engaging and educational."""
    
    prompt = f"""Create educational content about: {request.topic}
{f'Additional requirements: {request.additional_context}' if request.additional_context else ''}
Please provide comprehensive, well-organized content suitable for an e-learning lesson."""
    
    content = await generate_with_ollama(prompt, system_prompt)
    
    # Generate title
    title_prompt = f"Suggest a concise, engaging title (max 10 words) for this lesson about: {request.topic}\\nRespond with just the title, no quotes."
    title = await generate_with_ollama(title_prompt)
    title = title.strip().strip('"').strip("'")[:100]
    
    # Get next order index
    result = await db.execute(
        select(Lesson)
        .where(Lesson.course_id == request.course_id)
        .order_by(Lesson.order_index.desc())
    )
    last_lesson = result.scalars().first()
    next_order = (last_lesson.order_index + 1) if last_lesson else 0
    
    # Create lesson
    lesson = Lesson(
        course_id=request.course_id,
        title=title,
        lesson_type=request.lesson_type,
        description=content,
        order_index=next_order,
        duration=None
    )
    
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    
    return {
        "success": True,
        "lesson_id": lesson.id,
        "title": lesson.title,
        "message": "Lesson generated and saved successfully"
    }


@router.post("/generate-and-save-quiz")
async def generate_and_save_quiz(
    request: GenerateAndSaveQuizRequest,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(require_instructor_or_admin)
):
    """
    Generate quiz with AI and save directly to database.
    Requires instructor or admin role.
    """
    # Verify course exists and user can manage it
    course_result = await db.execute(select(Course).where(Course.id == request.course_id))
    course = course_result.scalars().first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check permissions
    from app.services.access_control_service import can_manage_course
    logger.info(f"Quiz permission check - User ID: {current_user.id}, Role: {current_user.role}, Course ID: {request.course_id}, Course Admin: {course.course_admin_id}")
    can_manage = await can_manage_course(request.course_id, current_user, db)
    logger.info(f"Can manage result: {can_manage}")
    if not can_manage:
        raise HTTPException(status_code=403, detail="You don't have permission to manage this course")
    
    # Generate quiz using AI
    system_prompt = """You are an expert quiz creator for educational platforms.
Create clear, well-structured quiz questions that test understanding.
Always respond in valid JSON format."""
    
    prompt = f"""Create a quiz about: {request.topic}

Requirements:
- Number of questions: {request.num_questions}
- Difficulty: {request.difficulty}
- Question types: multiple choice with 4 options

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{{
    "title": "Quiz title here",
    "description": "Brief description of the quiz",
    "questions": [
        {{
            "question_text": "The question text",
            "question_type": "multiple_choice",
            "points": 10,
            "answers": [
                {{"answer_text": "Option A", "is_correct": true}},
                {{"answer_text": "Option B", "is_correct": false}},
                {{"answer_text": "Option C", "is_correct": false}},
                {{"answer_text": "Option D", "is_correct": false}}
            ]
        }}
    ]
}}

Make sure exactly one answer is marked as correct for each question."""
    
    response_text = await generate_with_ollama(prompt, system_prompt)
    
    # Parse JSON response
    import json
    import re
    
    logger.info(f"Raw AI response length: {len(response_text)}")
    logger.debug(f"First 500 chars: {response_text[:500]}")
    
    try:
        clean_response = response_text.strip()
        
        # Remove markdown code blocks if present
        if "```json" in clean_response:
            # Extract content between ```json and ```
            match = re.search(r'```json\s*(.*?)\s*```', clean_response, re.DOTALL)
            if match:
                clean_response = match.group(1).strip()
        elif clean_response.startswith("```"):
            # Generic code block
            lines = clean_response.split("\n")
            clean_response = "\n".join(lines[1:-1] if len(lines) > 2 and lines[-1].strip() == "```" else lines[1:])
        
        # Try to find JSON object if there's extra text
        if not clean_response.startswith("{"):
            match = re.search(r'\{.*\}', clean_response, re.DOTALL)
            if match:
                clean_response = match.group(0)
        
        logger.info(f"Cleaned response length: {len(clean_response)}")
        data = json.loads(clean_response)
        logger.info(f"Successfully parsed JSON with {len(data.get('questions', []))} questions")
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse quiz JSON: {str(e)}")
        logger.error(f"Cleaned response: {clean_response[:1000]}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response. Please try again.")
    
    # Get next order index
    result = await db.execute(
        select(Quiz)
        .where(Quiz.course_id == request.course_id)
        .order_by(Quiz.order_index.desc())
    )
    last_quiz = result.scalars().first()
    next_order = (last_quiz.order_index + 1) if last_quiz else 0
    
    # Create quiz (only use fields that exist in the model)
    quiz = Quiz(
        course_id=request.course_id,
        title=data.get("title", f"Quiz: {request.topic}"),
        order_index=next_order
    )
    
    db.add(quiz)
    await db.flush()  # Get quiz.id before adding questions
    
    # Create questions (map AI response to database schema)
    for q_idx, q_data in enumerate(data.get("questions", [])):
        question = QuizQuestion(
            quiz_id=quiz.id,
            question_text=q_data.get("question_text", ""),
            order_index=q_idx,
            points_first=q_data.get("points", 10),
            points_second=max(1, int(q_data.get("points", 10) * 0.7)),
            points_third=max(1, int(q_data.get("points", 10) * 0.5)),
            points_more=max(1, int(q_data.get("points", 10) * 0.2))
        )
        db.add(question)
        await db.flush()  # Get question.id before adding options
        
        # Create answer options (map 'answers' to options with correct field names)
        for opt_idx, opt_data in enumerate(q_data.get("answers", [])):
            option = QuestionOption(
                question_id=question.id,
                option_text=opt_data.get("answer_text", ""),
                is_correct=opt_data.get("is_correct", False),
                order_index=opt_idx
            )
            db.add(option)
    
    await db.commit()
    await db.refresh(quiz)
    
    return {
        "success": True,
        "quiz_id": quiz.id,
        "title": quiz.title,
        "num_questions": len(data.get("questions", [])),
        "message": "Quiz generated and saved successfully"
    }


@router.post("/generate-from-document", response_model=ContentGenerationResponse)
async def generate_from_document(
    file: UploadFile = File(...),
    extraction_type: str = Form("lesson"),
    topic_focus: Optional[str] = Form(None),
    content_requirements: Optional[str] = Form(None),
    difficulty_level: Optional[str] = Form("intermediate"),
    lesson_count: Optional[int] = Form(1),
    include_examples: Optional[bool] = Form(True),
    current_user: User = Depends(require_instructor_or_admin)
):
    """
    Generate lesson content from uploaded documents using RAG with Gemma 3 4B.
    
    This endpoint:
    1. Accepts document uploads (TXT, MD, PDF, DOC, DOCX)
    2. Extracts relevant content based on topic focus
    3. Uses Gemma 3 4B to generate structured lesson content
    4. Returns formatted lesson content with title suggestions
    """
    
    # Validate file type
    allowed_extensions = {".txt", ".md", ".pdf", ".doc", ".docx"}
    file_extension = f".{file.filename.split('.')[-1].lower()}" if '.' in file.filename else ""
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Process based on file type
        if file_extension == ".pdf":
            # For PDF files, we'll need to extract text
            # For now, we'll use a simple text extraction
            # In production, you might want to use PyPDF2, pdfplumber, or similar
            text_content = "PDF processing not fully implemented in this demo. Please use TXT or MD files."
        elif file_extension in [".doc", ".docx"]:
            # For Word documents, we'll need to extract text
            # For now, we'll use a simple approach
            # In production, you might want to use python-docx
            text_content = "Word document processing not fully implemented in this demo. Please use TXT or MD files."
        else:
            # For TXT and MD files
            try:
                text_content = content.decode('utf-8')
            except UnicodeDecodeError:
                try:
                    text_content = content.decode('latin-1')
                except:
                    raise HTTPException(status_code=400, detail="Could not decode file content")
        
        # Truncate content if too long (Ollama has token limits)
        max_chars = 8000  # Approximate limit for context
        if len(text_content) > max_chars:
            text_content = text_content[:max_chars] + "..."
        
        # Prepare RAG prompt based on extraction requirements
        topic_instruction = f"\n\nFocus specifically on: {topic_focus}" if topic_focus else ""
        requirements_instruction = f"\n\nContent requirements: {content_requirements}" if content_requirements else ""
        
        system_prompt = f"""You are an expert educational content creator. Generate clean, direct lesson content without any introductory phrases or meta-commentary.

IMPORTANT RULES:
- Do NOT start with phrases like "Here's a lesson on..." or "Okay, here's..."
- Do NOT use special formatting symbols like ** or __ 
- Do NOT include any commentary about what you're doing
- Start directly with the lesson content
- Use simple text formatting only
- Be concise and educational

Extraction Type: {extraction_type}
Difficulty Level: {difficulty_level}
Include Examples: {include_examples}
{topic_instruction}
{requirements_instruction}

Generate clean, structured lesson content that starts immediately with the topic."""

        user_prompt = f"""Based on this book/document content:

{text_content}

{topic_instruction}
{requirements_instruction}

Generate clean lesson content about the requested topic. Start directly with the lesson content without any introductory phrases. Use simple formatting without special symbols."""

        # Generate content using Ollama with Gemma 3 4B
        generated_content = await generate_with_ollama(user_prompt, system_prompt, "gemma3:4b")
        
        # Clean the generated content
        generated_content = clean_ai_content(generated_content)
        
        # Generate title suggestion
        title_prompt = f"Generate only a simple lesson title (5-8 words maximum) for this content:\n\n{generated_content[:300]}..."
        title_suggestion = await generate_with_ollama(
            title_prompt,
            "Generate only the title text without any formatting or extra words.",
            "gemma3:4b"
        )
        
        # Clean up title suggestion
        title_suggestion = title_suggestion.strip().strip('"').strip("'")
        if len(title_suggestion) > 100:
            title_suggestion = title_suggestion[:97] + "..."
        
        return ContentGenerationResponse(
            content=generated_content,
            title_suggestion=title_suggestion
        )
        
    except Exception as e:
        logger.error(f"Document processing error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process document and generate content: {str(e)}"
        )

