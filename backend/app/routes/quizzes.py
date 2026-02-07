"""
Quiz Routes - Complete quiz functionality with attempt tracking and scoring.

Endpoints:
- POST /quizzes/ - Create quiz (instructor/admin only)
- GET /quizzes/{quiz_id} - Get quiz details
- POST /quizzes/{quiz_id}/start - Start new attempt
- POST /attempts/{attempt_id}/answer - Submit answer
- POST /attempts/{attempt_id}/complete - Complete attempt and calculate score
- GET /quizzes/{quiz_id}/attempts - Get user's attempts for a quiz
- GET /attempts/{attempt_id} - Get attempt details
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database.config import get_async_session
from app.models.models import Quiz, QuizAttempt, Course, User
from app.schemas.quizzes import (
    QuizCreate, QuizResponse, QuizWithQuestions,
    QuizAttemptResponse, AnswerSubmit, AttemptResultResponse
)
from app.dependencies.auth import get_current_active_user, require_instructor_or_admin
from app.services.quiz_service import (
    start_quiz_attempt, submit_quiz_answer, complete_quiz_attempt,
    get_quiz_attempts, get_attempt_results
)
from app.services.access_control_service import can_access_course

router = APIRouter()


@router.post("/", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
async def create_quiz(
    quiz_data: QuizCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(require_instructor_or_admin)
):
    """
    Create a new quiz in a course.
    Only instructors/admins can create quizzes.
    """
    # Verify course exists
    course_result = await db.execute(select(Course).where(Course.id == quiz_data.course_id))
    course = course_result.scalars().first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Verify user can manage this course
    from app.services.access_control_service import can_manage_course
    if not await can_manage_course(quiz_data.course_id, current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to create quizzes in this course"
        )
    
    # Create quiz
    db_quiz = Quiz(**quiz_data.dict())
    db.add(db_quiz)
    await db.commit()
    await db.refresh(db_quiz)
    
    return db_quiz


@router.get("/{quiz_id}", response_model=QuizWithQuestions)
async def get_quiz(
    quiz_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get quiz with all questions and options.
    User must have access to the course.
    """
    # Get quiz
    quiz_result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
    quiz = quiz_result.scalars().first()
    
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    # Check if user can access the course
    can_access, reason = await can_access_course(quiz.course_id, current_user, db)
    if not can_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cannot access this quiz: {reason}"
        )
    
    return quiz


@router.post("/{quiz_id}/start", response_model=QuizAttemptResponse)
async def start_quiz(
    quiz_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Start a new quiz attempt.
    """
    # Verify quiz exists
    quiz_result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
    quiz = quiz_result.scalars().first()
    
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    # Check if user can access the course
    can_access, reason = await can_access_course(quiz.course_id, current_user, db)
    if not can_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cannot access this quiz: {reason}"
        )
    
    # Start attempt
    attempt = await start_quiz_attempt(quiz_id, current_user.id, db)
    
    return attempt


@router.post("/attempts/{attempt_id}/answer")
async def submit_answer(
    attempt_id: int,
    answer_data: AnswerSubmit,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Submit an answer for a quiz question.
    """
    # Verify attempt belongs to current user
    attempt_result = await db.execute(select(QuizAttempt).where(QuizAttempt.id == attempt_id))
    attempt = attempt_result.scalars().first()
    
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz attempt not found"
        )
    
    if attempt.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This attempt doesn't belong to you"
        )
    
    # Submit answer
    try:
        answer = await submit_quiz_answer(
            attempt_id,
            answer_data.question_id,
            answer_data.selected_option_id,
            db
        )
        
        return {"message": "Answer submitted successfully", "answer_id": answer.id}
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/attempts/{attempt_id}/complete", response_model=AttemptResultResponse)
async def complete_attempt(
    attempt_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Complete a quiz attempt and calculate score.
    This triggers point calculation and badge updates.
    """
    # Verify attempt belongs to current user
    attempt_result = await db.execute(select(QuizAttempt).where(QuizAttempt.id == attempt_id))
    attempt = attempt_result.scalars().first()
    
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz attempt not found"
        )
    
    if attempt.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This attempt doesn't belong to you"
        )
    
    # Complete attempt
    try:
        result = await complete_quiz_attempt(attempt_id, db)
        return result
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{quiz_id}/attempts", response_model=List[QuizAttemptResponse])
async def get_my_attempts(
    quiz_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user's attempts for a quiz.
    """
    attempts = await get_quiz_attempts(quiz_id, current_user.id, db)
    return attempts


@router.get("/attempts/{attempt_id}/results")
async def get_attempt_details(
    attempt_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get detailed results for a specific attempt.
    """
    # Verify attempt belongs to current user
    attempt_result = await db.execute(select(QuizAttempt).where(QuizAttempt.id == attempt_id))
    attempt = attempt_result.scalars().first()
    
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz attempt not found"
        )
    
    if attempt.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This attempt doesn't belong to you"
        )
    
    # Get results
    results = await get_attempt_results(attempt_id, db)
    
    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt results not found"
        )
    
    return results
