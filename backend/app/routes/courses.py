from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from app.database.config import get_async_session
from app.models.models import Course, Lesson, Quiz, CourseEnrollment, CourseReview
from app.schemas.courses import CourseCreate, CourseResponse, CourseUpdate

router = APIRouter()


@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: CourseCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new course"""
    db_course = Course(**course_data.dict())
    
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
    """Get all courses"""
    query = select(Course)
    
    if published_only:
        query = query.where(Course.published == True)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    courses = result.scalars().all()
    
    return courses


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
    for field, value in course_update.dict(exclude_unset=True).items():
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
    user_id: int,  # In production, get from authenticated user
    db: AsyncSession = Depends(get_async_session)
):
    """Enroll user in course"""
    # Check if course exists
    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalars().first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
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