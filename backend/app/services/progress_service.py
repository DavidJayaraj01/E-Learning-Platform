"""
Progress Tracking Service - Manages user progress in courses.

Business Rules:
- Course completion % = (completed lessons + completed quizzes) / total items * 100
- Course status:
  - YET_TO_START: Enrolled but no lessons started
  - IN_PROGRESS: Progress between 1%-99%
  - COMPLETED: 100% progress
- started_at: Set when user completes first lesson
- completed_at: Set when user reaches 100%
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime
from typing import Dict, List

from app.models.models import (
    CourseEnrollment, UserLessonProgress, QuizAttempt,
    Lesson, Quiz, User
)
from app.enums import EnrollmentStatus, LessonStatus, QuizAttemptStatus


async def calculate_course_progress(course_id: int, user_id: int, db: AsyncSession) -> Dict:
    """
    Calculate user's progress in a specific course.
    
    Args:
        course_id: ID of the course
        user_id: ID of the user
        db: Database session
        
    Returns:
        Dictionary with progress metrics:
        - completion_percentage: int (0-100)
        - completed_lessons: int
        - total_lessons: int
        - completed_quizzes: int
        - total_quizzes: int
        - status: EnrollmentStatus
    """
    # Count total lessons in course
    total_lessons_result = await db.execute(
        select(func.count(Lesson.id)).where(Lesson.course_id == course_id)
    )
    total_lessons = total_lessons_result.scalar() or 0
    
    # Count completed lessons by user
    completed_lessons_result = await db.execute(
        select(func.count(UserLessonProgress.id))
        .join(Lesson, UserLessonProgress.lesson_id == Lesson.id)
        .where(
            and_(
                Lesson.course_id == course_id,
                UserLessonProgress.user_id == user_id,
                UserLessonProgress.status == LessonStatus.COMPLETED
            )
        )
    )
    completed_lessons = completed_lessons_result.scalar() or 0
    
    # Count total quizzes in course
    total_quizzes_result = await db.execute(
        select(func.count(Quiz.id)).where(Quiz.course_id == course_id)
    )
    total_quizzes = total_quizzes_result.scalar() or 0
    
    # Count completed quizzes by user (at least one completed attempt)
    completed_quizzes_result = await db.execute(
        select(func.count(func.distinct(QuizAttempt.quiz_id)))
        .join(Quiz, QuizAttempt.quiz_id == Quiz.id)
        .where(
            and_(
                Quiz.course_id == course_id,
                QuizAttempt.user_id == user_id,
                QuizAttempt.status == QuizAttemptStatus.COMPLETED
            )
        )
    )
    completed_quizzes = completed_quizzes_result.scalar() or 0
    
    # Calculate total items and completed items
    total_items = total_lessons + total_quizzes
    completed_items = completed_lessons + completed_quizzes
    
    # Calculate completion percentage
    if total_items > 0:
        completion_percentage = int((completed_items / total_items) * 100)
    else:
        completion_percentage = 0
    
    # Determine status based on progress
    if completion_percentage == 0:
        status = EnrollmentStatus.YET_TO_START
    elif completion_percentage == 100:
        status = EnrollmentStatus.COMPLETED
    else:
        status = EnrollmentStatus.IN_PROGRESS
    
    return {
        "completion_percentage": completion_percentage,
        "completed_lessons": completed_lessons,
        "total_lessons": total_lessons,
        "completed_quizzes": completed_quizzes,
        "total_quizzes": total_quizzes,
        "status": status
    }


async def update_enrollment_progress(course_id: int, user_id: int, db: AsyncSession) -> CourseEnrollment:
    """
    Update the course enrollment record with current progress.
    This should be called after any lesson completion or quiz completion.
    
    Args:
        course_id: ID of the course
        user_id: ID of the user
        db: Database session
        
    Returns:
        Updated CourseEnrollment record
    """
    # Get enrollment record
    enrollment_result = await db.execute(
        select(CourseEnrollment).where(
            and_(
                CourseEnrollment.course_id == course_id,
                CourseEnrollment.user_id == user_id
            )
        )
    )
    enrollment = enrollment_result.scalars().first()
    
    if not enrollment:
        raise ValueError(f"No enrollment found for user {user_id} in course {course_id}")
    
    # Calculate current progress
    progress = await calculate_course_progress(course_id, user_id, db)
    
    # Update enrollment record
    old_status = enrollment.status
    enrollment.completion_percentage = progress["completion_percentage"]
    enrollment.status = progress["status"]
    
    # Set started_at if transitioning from YET_TO_START
    if old_status == EnrollmentStatus.YET_TO_START and progress["status"] != EnrollmentStatus.YET_TO_START:
        enrollment.started_at = datetime.utcnow()
    
    # Set completed_at if reaching 100%
    if progress["status"] == EnrollmentStatus.COMPLETED and old_status != EnrollmentStatus.COMPLETED:
        enrollment.completed_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(enrollment)
    
    return enrollment


async def mark_lesson_completed(lesson_id: int, user_id: int, db: AsyncSession) -> UserLessonProgress:
    """
    Mark a lesson as completed for a user and update course progress.
    
    Args:
        lesson_id: ID of the lesson
        user_id: ID of the user
        db: Database session
        
    Returns:
        UserLessonProgress record
    """
    # Check if progress record exists
    progress_result = await db.execute(
        select(UserLessonProgress).where(
            and_(
                UserLessonProgress.lesson_id == lesson_id,
                UserLessonProgress.user_id == user_id
            )
        )
    )
    progress = progress_result.scalars().first()
    
    if not progress:
        # Create new progress record
        progress = UserLessonProgress(
            lesson_id=lesson_id,
            user_id=user_id,
            status=LessonStatus.COMPLETED,
            completed_at=datetime.utcnow()
        )
        db.add(progress)
    else:
        # Update existing record
        progress.status = LessonStatus.COMPLETED
        if not progress.completed_at:
            progress.completed_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(progress)
    
    # Get course_id from lesson
    lesson_result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = lesson_result.scalars().first()
    
    if lesson:
        # Update course enrollment progress
        await update_enrollment_progress(lesson.course_id, user_id, db)
    
    return progress


async def get_user_course_report(course_id: int, user_id: int, db: AsyncSession) -> Dict:
    """
    Get detailed progress report for a user in a course.
    Used for reporting endpoints.
    
    Args:
        course_id: ID of the course
        user_id: ID of the user
        db: Database session
        
    Returns:
        Detailed report dictionary
    """
    # Get enrollment
    enrollment_result = await db.execute(
        select(CourseEnrollment).where(
            and_(
                CourseEnrollment.course_id == course_id,
                CourseEnrollment.user_id == user_id
            )
        )
    )
    enrollment = enrollment_result.scalars().first()
    
    if not enrollment:
        return None
    
    # Get progress metrics
    progress = await calculate_course_progress(course_id, user_id, db)
    
    # Get user information
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalars().first()
    
    return {
        "user_id": user_id,
        "user_name": user.name if user else None,
        "user_email": user.email if user else None,
        "enrolled_at": enrollment.enrolled_at,
        "started_at": enrollment.started_at,
        "completed_at": enrollment.completed_at,
        "status": enrollment.status.value,
        "completion_percentage": progress["completion_percentage"],
        "completed_lessons": progress["completed_lessons"],
        "total_lessons": progress["total_lessons"],
        "completed_quizzes": progress["completed_quizzes"],
        "total_quizzes": progress["total_quizzes"],
        "time_spent": str(enrollment.time_spent) if enrollment.time_spent else "0:00:00"
    }


async def get_course_progress_report(course_id: int, db: AsyncSession) -> List[Dict]:
    """
    Get progress report for all learners in a course.
    Used by instructors/admins to monitor course progress.
    
    Args:
        course_id: ID of the course
        db: Database session
        
    Returns:
        List of progress reports for all enrolled users
    """
    # Get all enrollments for the course
    enrollments_result = await db.execute(
        select(CourseEnrollment).where(CourseEnrollment.course_id == course_id)
    )
    enrollments = enrollments_result.scalars().all()
    
    reports = []
    for enrollment in enrollments:
        report = await get_user_course_report(course_id, enrollment.user_id, db)
        if report:
            reports.append(report)
    
    return reports
