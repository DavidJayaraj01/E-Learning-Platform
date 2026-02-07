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
from sqlalchemy.orm import selectinload
from typing import List

from app.database.config import get_async_session
from app.models.models import Quiz, QuizAttempt, Course, User, QuizQuestion, QuestionOption
from app.schemas.quizzes import (
    QuizCreate, QuizResponse, QuizWithQuestions, QuizUpdate,
    QuizAttemptResponse, AnswerSubmit, AttemptResultResponse,
    QuestionCreate, QuestionResponse, QuestionUpdate, QuestionOptionCreate
)
from app.dependencies.auth import get_current_active_user, require_instructor_or_admin
from app.services.quiz_service import (
    start_quiz_attempt, submit_quiz_answer, complete_quiz_attempt,
    get_quiz_attempts, get_attempt_results
)
from app.services.access_control_service import can_access_course

router = APIRouter()


# =============================================================================
# QUIZ CRUD ENDPOINTS
# =============================================================================

@router.get("/course/{course_id}", response_model=List[QuizResponse])
async def get_course_quizzes(
    course_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """
    Get all quizzes for a specific course.
    """
    # Verify course exists
    course_result = await db.execute(select(Course).where(Course.id == course_id))
    if not course_result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    result = await db.execute(
        select(Quiz)
        .where(Quiz.course_id == course_id)
        .options(selectinload(Quiz.questions).selectinload(QuizQuestion.options))
        .order_by(Quiz.order_index)
    )
    quizzes = result.scalars().all()
    
    return quizzes


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
    db_quiz = Quiz(**quiz_data.dict(exclude={"questions"}))
    db.add(db_quiz)
    await db.commit()
    
    # Eagerly load the questions relationship for the response
    result = await db.execute(
        select(Quiz)
        .where(Quiz.id == db_quiz.id)
        .options(selectinload(Quiz.questions).selectinload(QuizQuestion.options))
    )
    db_quiz = result.scalars().first()
    
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
    # Get quiz with eager loading
    quiz_result = await db.execute(
        select(Quiz)
        .where(Quiz.id == quiz_id)
        .options(selectinload(Quiz.questions).selectinload(QuizQuestion.options))
    )
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


# =============================================================================
# QUIZ UPDATE/DELETE ENDPOINTS
# =============================================================================

@router.put("/{quiz_id}", response_model=QuizResponse)
async def update_quiz(
    quiz_id: int,
    quiz_update: QuizUpdate,
    db: AsyncSession = Depends(get_async_session)
):
    """
    Update a quiz.
    """
    result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
    quiz = result.scalars().first()
    
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    # Update fields
    update_data = quiz_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(quiz, field, value)
    
    await db.commit()
    
    # Re-fetch with eager loading
    result = await db.execute(
        select(Quiz)
        .where(Quiz.id == quiz_id)
        .options(selectinload(Quiz.questions).selectinload(QuizQuestion.options))
    )
    quiz = result.scalars().first()
    
    return quiz


@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quiz(
    quiz_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(require_instructor_or_admin)
):
    """
    Delete a quiz and all its questions.
    Requires instructor/admin role and permission to manage the course.
    """
    result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
    quiz = result.scalars().first()
    
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    # Check permissions
    from app.services.access_control_service import can_manage_course
    if not await can_manage_course(quiz.course_id, current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this quiz"
        )
    
    await db.delete(quiz)
    await db.commit()


# =============================================================================
# QUESTION CRUD ENDPOINTS
# =============================================================================

@router.post("/{quiz_id}/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def add_question(
    quiz_id: int,
    question_data: QuestionCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """
    Add a question to a quiz.
    """
    # Verify quiz exists
    quiz_result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
    quiz = quiz_result.scalars().first()
    
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    # Create question without options first
    question_dict = question_data.dict(exclude={'options'})
    db_question = QuizQuestion(quiz_id=quiz_id, **question_dict)
    db.add(db_question)
    await db.commit()
    await db.refresh(db_question)
    
    # Add options
    for option_data in question_data.options:
        db_option = QuestionOption(
            question_id=db_question.id,
            **option_data.dict()
        )
        db.add(db_option)
    
    await db.commit()
    
    # Re-fetch with eager loading
    result = await db.execute(
        select(QuizQuestion)
        .where(QuizQuestion.id == db_question.id)
        .options(selectinload(QuizQuestion.options))
    )
    db_question = result.scalars().first()
    
    return db_question


@router.put("/questions/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: int,
    question_update: QuestionUpdate,
    db: AsyncSession = Depends(get_async_session)
):
    """
    Update a quiz question.
    """
    result = await db.execute(select(QuizQuestion).where(QuizQuestion.id == question_id))
    question = result.scalars().first()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Update question fields (excluding options)
    update_data = question_update.dict(exclude_unset=True, exclude={'options'})
    for field, value in update_data.items():
        setattr(question, field, value)
    
    # If options are provided, replace all options
    if question_update.options is not None:
        # Delete existing options
        existing_options = await db.execute(
            select(QuestionOption).where(QuestionOption.question_id == question_id)
        )
        for option in existing_options.scalars().all():
            await db.delete(option)
        
        # Add new options
        for option_data in question_update.options:
            db_option = QuestionOption(
                question_id=question_id,
                **option_data.dict()
            )
            db.add(db_option)
    
    await db.commit()
    
    # Re-fetch with eager loading
    result = await db.execute(
        select(QuizQuestion)
        .where(QuizQuestion.id == question_id)
        .options(selectinload(QuizQuestion.options))
    )
    question = result.scalars().first()
    
    return question


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """
    Delete a quiz question and all its options.
    """
    result = await db.execute(select(QuizQuestion).where(QuizQuestion.id == question_id))
    question = result.scalars().first()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    await db.delete(question)
    await db.commit()
