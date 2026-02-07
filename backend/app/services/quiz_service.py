"""
Quiz Scoring Service - Handles quiz attempts and point calculation.

Business Rules:
- Points awarded based on attempt number:
  - 1st attempt → points_first (from question)
  - 2nd attempt → points_second (from question)
  - 3rd attempt → points_third (from question)
  - 4th+ attempts → points_more (from question)
- Points must NOT be awarded twice for the same attempt
- Quiz completion updates course progress
- User's total points must be updated atomically
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime
from typing import Dict, List

from app.models.models import (
    QuizAttempt, QuizAttemptAnswer, Quiz, QuizQuestion,
    QuestionOption, User
)
from app.enums import QuizAttemptStatus
from app.services.badge_service import update_user_badges
from app.services.progress_service import update_enrollment_progress


async def start_quiz_attempt(
    quiz_id: int,
    user_id: int,
    db: AsyncSession
) -> QuizAttempt:
    """
    Start a new quiz attempt for a user.
    
    Args:
        quiz_id: ID of the quiz
        user_id: ID of the user
        db: Database session
        
    Returns:
        QuizAttempt record
    """
    # Count existing attempts for this user/quiz
    attempts_count_result = await db.execute(
        select(func.count(QuizAttempt.id)).where(
            and_(
                QuizAttempt.quiz_id == quiz_id,
                QuizAttempt.user_id == user_id
            )
        )
    )
    attempts_count = attempts_count_result.scalar() or 0
    
    # Create new attempt
    attempt = QuizAttempt(
        quiz_id=quiz_id,
        user_id=user_id,
        attempt_number=attempts_count + 1,
        status=QuizAttemptStatus.IN_PROGRESS
    )
    
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)
    
    return attempt


async def submit_quiz_answer(
    attempt_id: int,
    question_id: int,
    selected_option_id: int,
    db: AsyncSession
) -> QuizAttemptAnswer:
    """
    Submit an answer for a quiz question.
    
    Args:
        attempt_id: ID of the quiz attempt
        question_id: ID of the question
        selected_option_id: ID of the selected option
        db: Database session
        
    Returns:
        QuizAttemptAnswer record
    """
    # Get the selected option to check if it's correct
    option_result = await db.execute(
        select(QuestionOption).where(QuestionOption.id == selected_option_id)
    )
    option = option_result.scalars().first()
    
    if not option:
        raise ValueError("Invalid option selected")
    
    # Check if answer already exists for this question in this attempt
    existing_answer_result = await db.execute(
        select(QuizAttemptAnswer).where(
            and_(
                QuizAttemptAnswer.attempt_id == attempt_id,
                QuizAttemptAnswer.question_id == question_id
            )
        )
    )
    existing_answer = existing_answer_result.scalars().first()
    
    if existing_answer:
        # Update existing answer
        existing_answer.selected_option_id = selected_option_id
        existing_answer.is_correct = option.is_correct
        answer = existing_answer
    else:
        # Create new answer
        answer = QuizAttemptAnswer(
            attempt_id=attempt_id,
            question_id=question_id,
            selected_option_id=selected_option_id,
            is_correct=option.is_correct
        )
        db.add(answer)
    
    await db.commit()
    await db.refresh(answer)
    
    return answer


async def complete_quiz_attempt(
    attempt_id: int,
    db: AsyncSession
) -> Dict:
    """
    Complete a quiz attempt and calculate score.
    This is a critical business transaction that must be atomic.
    
    Args:
        attempt_id: ID of the quiz attempt
        db: Database session
        
    Returns:
        Dictionary with attempt results and points earned
        
    Business Logic:
        - Calculate total points based on attempt number and correct answers
        - Update quiz attempt status to COMPLETED
        - Add earned points to user's total_points (atomic update)
        - Trigger badge update
        - Update course progress
    """
    # Get attempt with all relationships
    attempt_result = await db.execute(
        select(QuizAttempt)
        .where(QuizAttempt.id == attempt_id)
    )
    attempt = attempt_result.scalars().first()
    
    if not attempt:
        raise ValueError("Quiz attempt not found")
    
    if attempt.status == QuizAttemptStatus.COMPLETED:
        raise ValueError("Quiz attempt already completed")
    
    # Get all answers for this attempt
    answers_result = await db.execute(
        select(QuizAttemptAnswer)
        .where(QuizAttemptAnswer.attempt_id == attempt_id)
    )
    answers = answers_result.scalars().all()
    
    # Get quiz and its questions
    quiz_result = await db.execute(
        select(Quiz).where(Quiz.id == attempt.quiz_id)
    )
    quiz = quiz_result.scalars().first()
    
    questions_result = await db.execute(
        select(QuizQuestion).where(QuizQuestion.quiz_id == quiz.id)
    )
    questions = questions_result.scalars().all()
    
    # Calculate points
    total_points = 0
    correct_count = 0
    
    for answer in answers:
        if answer.is_correct:
            correct_count += 1
            
            # Find the question to get point values
            question = next((q for q in questions if q.id == answer.question_id), None)
            
            if question:
                # Determine points based on attempt number
                if attempt.attempt_number == 1:
                    points = question.points_first
                elif attempt.attempt_number == 2:
                    points = question.points_second
                elif attempt.attempt_number == 3:
                    points = question.points_third
                else:
                    points = question.points_more
                
                total_points += points
    
    # Update attempt record atomically
    attempt.status = QuizAttemptStatus.COMPLETED
    attempt.completed_at = datetime.utcnow()
    attempt.earned_points = total_points
    
    # Update user's total points atomically
    user_result = await db.execute(select(User).where(User.id == attempt.user_id))
    user = user_result.scalars().first()
    
    if user:
        user.total_points += total_points
    
    # Commit all changes in single transaction
    await db.commit()
    
    # Refresh to get updated values
    await db.refresh(attempt)
    if user:
        await db.refresh(user)
    
    # Update badges based on new point total
    if user:
        await update_user_badges(user.id, db)
    
    # Update course progress
    if quiz:
        await update_enrollment_progress(quiz.course_id, attempt.user_id, db)
    
    return {
        "attempt_id": attempt.id,
        "quiz_id": attempt.quiz_id,
        "attempt_number": attempt.attempt_number,
        "total_questions": len(questions),
        "correct_answers": correct_count,
        "earned_points": total_points,
        "user_total_points": user.total_points if user else 0,
        "completed_at": attempt.completed_at
    }


async def get_quiz_attempts(
    quiz_id: int,
    user_id: int,
    db: AsyncSession
) -> List[QuizAttempt]:
    """
    Get all attempts for a quiz by a user.
    
    Args:
        quiz_id: ID of the quiz
        user_id: ID of the user
        db: Database session
        
    Returns:
        List of QuizAttempt records ordered by attempt number
    """
    result = await db.execute(
        select(QuizAttempt)
        .where(
            and_(
                QuizAttempt.quiz_id == quiz_id,
                QuizAttempt.user_id == user_id
            )
        )
        .order_by(QuizAttempt.attempt_number)
    )
    
    return result.scalars().all()


async def get_attempt_results(
    attempt_id: int,
    db: AsyncSession
) -> Dict:
    """
    Get detailed results for a specific attempt.
    
    Args:
        attempt_id: ID of the attempt
        db: Database session
        
    Returns:
        Dictionary with attempt details and answer breakdown
    """
    # Get attempt
    attempt_result = await db.execute(
        select(QuizAttempt).where(QuizAttempt.id == attempt_id)
    )
    attempt = attempt_result.scalars().first()
    
    if not attempt:
        return None
    
    # Get answers with question and option details
    answers_result = await db.execute(
        select(QuizAttemptAnswer)
        .where(QuizAttemptAnswer.attempt_id == attempt_id)
    )
    answers = answers_result.scalars().all()
    
    answer_details = []
    for answer in answers:
        # Get question
        question_result = await db.execute(
            select(QuizQuestion).where(QuizQuestion.id == answer.question_id)
        )
        question = question_result.scalars().first()
        
        # Get selected option
        option_result = await db.execute(
            select(QuestionOption).where(QuestionOption.id == answer.selected_option_id)
        )
        option = option_result.scalars().first()
        
        answer_details.append({
            "question_id": answer.question_id,
            "question_text": question.question_text if question else None,
            "selected_option_id": answer.selected_option_id,
            "selected_option_text": option.option_text if option else None,
            "is_correct": answer.is_correct
        })
    
    return {
        "attempt_id": attempt.id,
        "quiz_id": attempt.quiz_id,
        "attempt_number": attempt.attempt_number,
        "status": attempt.status.value,
        "started_at": attempt.started_at,
        "completed_at": attempt.completed_at,
        "earned_points": attempt.earned_points,
        "answers": answer_details
    }
