from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from app.database.config import get_async_session
from app.models.models import Course, Lesson, Quiz, CourseEnrollment, CourseReview, User, UserLessonProgress, QuizAttempt
from app.schemas.courses import CourseCreate, CourseResponse, CourseUpdate
from app.dependencies.auth import get_current_active_user
from app.enums import LessonStatus, QuizAttemptStatus

router = APIRouter()


@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: CourseCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new course"""
    course_dict = course_data.dict()
    
    # Convert Pydantic URL objects to strings for database storage
    if course_dict.get('image_url'):
        course_dict['image_url'] = str(course_dict['image_url'])
    if course_dict.get('website_url'):
        course_dict['website_url'] = str(course_dict['website_url'])
    
    # Handle course_admin_id validation
    if course_dict.get('course_admin_id') is not None:
        admin_id = course_dict['course_admin_id']
        
        # If admin_id is 0, treat it as None (no admin assigned)
        if admin_id == 0:
            course_dict['course_admin_id'] = None
        else:
            # Verify that the user exists
            user_result = await db.execute(select(User).where(User.id == admin_id))
            user = user_result.scalars().first()
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"User with ID {admin_id} does not exist"
                )
    
    db_course = Course(**course_dict)
    
    db.add(db_course)
    await db.commit()
    await db.refresh(db_course)
    
    return db_course


@router.get("/", response_model=List[CourseResponse])
async def get_courses(
    skip: int = 0,
    limit: int = 100,
    published_only: bool = True,
    db: AsyncSession = Depends(get_async_session)
):
    """Get all courses with fresh data (no caching)"""
    query = select(Course).order_by(Course.created_at.desc())
    
    if published_only:
        query = query.where(Course.published == True)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    courses = result.scalars().all()
    
    return courses


@router.get("/my-courses", response_model=List[CourseResponse])
async def get_my_courses(
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all courses the current user is enrolled in.
    Returns list of courses with enrollment information.
    """
    # Get all enrollments for the current user
    result = await db.execute(
        select(Course)
        .join(CourseEnrollment, Course.id == CourseEnrollment.course_id)
        .where(CourseEnrollment.user_id == current_user.id)
        .where(Course.published == True)
    )
    courses = result.scalars().all()
    
    return courses


@router.get("/{course_id}/progress")
async def get_course_progress(
    course_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user's progress for a specific course.
    Returns completion percentage, completed lessons, completed quizzes.
    """
    # Verify course exists
    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalars().first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
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
                UserLessonProgress.user_id == current_user.id,
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
                QuizAttempt.user_id == current_user.id,
                QuizAttempt.status == QuizAttemptStatus.COMPLETED
            )
        )
    )
    completed_quizzes = completed_quizzes_result.scalar() or 0
    
    # Calculate totals
    total_items = total_lessons + total_quizzes
    completed_items = completed_lessons + completed_quizzes
    
    # Calculate completion percentage
    if total_items > 0:
        completion_percentage = int((completed_items / total_items) * 100)
    else:
        completion_percentage = 0
    
    return {
        "course_id": course_id,
        "user_id": current_user.id,
        "total_lessons": total_lessons,
        "completed_lessons": completed_lessons,
        "total_quizzes": total_quizzes,
        "completed_quizzes": completed_quizzes,
        "total_items": total_items,
        "completed_items": completed_items,
        "completion_percentage": completion_percentage
    }


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get course by ID"""
    result = await db.execute(
        select(Course).where(Course.id == course_id)
    )
    course = result.scalars().first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    return course


@router.get("/{course_id}/details")
async def get_course_details(
    course_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get course with detailed information"""
    result = await db.execute(
        select(Course)
        .options(
            selectinload(Course.lessons),
            selectinload(Course.quizzes)
        )
        .where(Course.id == course_id)
    )
    course = result.scalars().first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Get enrollment count
    enrollment_result = await db.execute(
        select(func.count(CourseEnrollment.id))
        .where(CourseEnrollment.course_id == course_id)
    )
    enrollments_count = enrollment_result.scalar()
    
    # Get average rating
    rating_result = await db.execute(
        select(func.avg(CourseReview.rating))
        .where(CourseReview.course_id == course_id)
    )
    average_rating = rating_result.scalar()
    
    # Convert to response format
    return {
        **course.__dict__,
        "lessons": [lesson.__dict__ for lesson in course.lessons],
        "quizzes": [quiz.__dict__ for quiz in course.quizzes],
        "enrollments_count": enrollments_count,
        "average_rating": float(average_rating) if average_rating else None
    }


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: int,
    course_update: CourseUpdate,
    db: AsyncSession = Depends(get_async_session)
):
    """Update course"""
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalars().first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Update fields
    update_data = course_update.dict(exclude_unset=True)
    
    # Convert Pydantic URL objects to strings for database storage
    if 'image_url' in update_data and update_data['image_url']:
        update_data['image_url'] = str(update_data['image_url'])
    if 'website_url' in update_data and update_data['website_url']:
        update_data['website_url'] = str(update_data['website_url'])
    
    # Handle course_admin_id validation for updates
    if 'course_admin_id' in update_data:
        admin_id = update_data['course_admin_id']
        
        if admin_id == 0:
            update_data['course_admin_id'] = None
        elif admin_id is not None:
            # Verify that the user exists
            user_result = await db.execute(select(User).where(User.id == admin_id))
            user = user_result.scalars().first()
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"User with ID {admin_id} does not exist"
                )
    
    for field, value in update_data.items():
        setattr(course, field, value)
    
    await db.commit()
    await db.refresh(course)
    
    return course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Delete course"""
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalars().first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    await db.delete(course)
    await db.commit()


@router.post("/{course_id}/enroll", status_code=status.HTTP_201_CREATED)
async def enroll_in_course(
    course_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_active_user)
):
    """Enroll current user in course"""
    user_id = current_user.id
    
    # Check if course exists
    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalars().first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check access type restrictions
    if course.access_type == "INVITATION":
        # Check if user has an accepted invitation
        from app.models.models import CourseInvitation
        invitation_result = await db.execute(
            select(CourseInvitation)
            .where(CourseInvitation.course_id == course_id)
            .where(CourseInvitation.invitee_email == current_user.email)
            .where(CourseInvitation.status == "accepted")
        )
        if not invitation_result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This course requires an invitation. Please request access from the course administrator."
            )
    
    if course.access_type == "PAYMENT":
        # For now, just block payment-based courses
        # In production, you would integrate with a payment provider
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="This course requires payment. Please complete the payment process first."
        )
    
    # Check if already enrolled
    enrollment_result = await db.execute(
        select(CourseEnrollment)
        .where(CourseEnrollment.course_id == course_id)
        .where(CourseEnrollment.user_id == user_id)
    )
    
    if enrollment_result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already enrolled in this course"
        )
    
    # Create enrollment
    enrollment = CourseEnrollment(course_id=course_id, user_id=user_id)
    db.add(enrollment)
    await db.commit()
    
    return {"message": "Successfully enrolled in course"}


@router.get("/{course_id}/enrollments")
async def get_course_enrollments(
    course_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all enrollments for a course (admin/instructor only).
    Returns list of enrolled users with their enrollment details.
    """
    # Check if course exists
    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalars().first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check if user is admin or course admin
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    if user_role != "ADMIN" and current_user.id != course.course_admin_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view enrollments for this course"
        )
    
    # Get all enrollments with user details
    enrollments_result = await db.execute(
        select(CourseEnrollment)
        .options(selectinload(CourseEnrollment.user))
        .where(CourseEnrollment.course_id == course_id)
        .order_by(CourseEnrollment.enrolled_at.desc())
    )
    enrollments = enrollments_result.scalars().all()
    
    # Format response with user details
    return [
        {
            "id": enrollment.id,
            "user_id": enrollment.user_id,
            "user_name": enrollment.user.name if enrollment.user else "Unknown",
            "user_email": enrollment.user.email if enrollment.user else "Unknown",
            "enrolled_at": enrollment.enrolled_at,
            "started_at": enrollment.started_at,
            "completed_at": enrollment.completed_at,
            "status": enrollment.status.value if enrollment.status else "YET_TO_START",
            "completion_percentage": enrollment.completion_percentage or 0,
        }
        for enrollment in enrollments
    ]