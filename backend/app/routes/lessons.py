from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from app.database.config import get_async_session
from app.models.models import Lesson, Course, UserLessonProgress, User
from app.schemas.lessons import (
    LessonCreate, LessonResponse, LessonUpdate,
    UserLessonProgressResponse
)
from app.enums import LessonStatus
from app.dependencies.auth import require_instructor_or_admin

router = APIRouter()


@router.post("/", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
async def create_lesson(
    lesson_data: LessonCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new lesson"""
    # Check if course exists
    course_result = await db.execute(
        select(Course).where(Course.id == lesson_data.course_id)
    )
    course = course_result.scalars().first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    lesson_dict = lesson_data.dict()
    
    db_lesson = Lesson(**lesson_dict)
    
    db.add(db_lesson)
    await db.commit()
    await db.refresh(db_lesson)
    
    # Update course lesson count
    course.total_lessons += 1
    await db.commit()
    
    return db_lesson


@router.get("/course/{course_id}", response_model=List[LessonResponse])
async def get_course_lessons(
    course_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get all lessons for a course, ordered by sequence"""
    result = await db.execute(
        select(Lesson)
        .where(Lesson.course_id == course_id)
        .order_by(Lesson.order_index.asc(), Lesson.created_at.asc())
    )
    lessons = result.scalars().all()
    
    return lessons


@router.get("/{lesson_id}")
async def get_lesson_with_content(
    lesson_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get lesson with content details"""
    result = await db.execute(
        select(Lesson)
        .options(
            selectinload(Lesson.video),
            selectinload(Lesson.document),
            selectinload(Lesson.image),
            selectinload(Lesson.attachments)
        )
        .where(Lesson.id == lesson_id)
    )
    lesson = result.scalars().first()
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Convert to dict format
    lesson_dict = lesson.__dict__.copy()
    
    # Add content based on lesson type
    if lesson.video:
        lesson_dict["video"] = {"url": lesson.video.url}
    if lesson.document:
        lesson_dict["document"] = {
            "file_url": lesson.document.file_url,
            "allow_download": lesson.document.allow_download
        }
    if lesson.image:
        lesson_dict["image"] = {
            "file_url": lesson.image.file_url,
            "allow_download": lesson.image.allow_download
        }
    if lesson.attachments:
        lesson_dict["attachments"] = [
            {
                "id": att.id,
                "file_url": att.file_url,
                "external_url": att.external_url,
                "description": att.description
            }
            for att in lesson.attachments
        ]
    
    return lesson_dict


@router.get("/{lesson_id}/basic", response_model=LessonResponse)
async def get_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get basic lesson information"""
    result = await db.execute(
        select(Lesson).where(Lesson.id == lesson_id)
    )
    lesson = result.scalars().first()
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    return lesson


@router.put("/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    lesson_id: int,
    lesson_update: LessonUpdate,
    db: AsyncSession = Depends(get_async_session)
):
    """Update lesson"""
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalars().first()
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Update fields
    update_data = lesson_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(lesson, field, value)
    
    await db.commit()
    await db.refresh(lesson)
    
    return lesson


@router.delete("/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(require_instructor_or_admin)
):
    """
    Delete lesson.
    Requires instructor/admin role and permission to manage the course.
    """
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalars().first()
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Check permissions
    from app.services.access_control_service import can_manage_course
    if not await can_manage_course(lesson.course_id, current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this lesson"
        )
    
    await db.delete(lesson)
    await db.commit()


@router.post("/{lesson_id}/complete", response_model=UserLessonProgressResponse)
async def complete_lesson(
    lesson_id: int,
    user_id: int,  # In production, get from authenticated user
    db: AsyncSession = Depends(get_async_session)
):
    """Mark lesson as completed for user"""
    # Check if lesson exists
    lesson_result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = lesson_result.scalars().first()
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Get or create progress record
    progress_result = await db.execute(
        select(UserLessonProgress)
        .where(UserLessonProgress.lesson_id == lesson_id)
        .where(UserLessonProgress.user_id == user_id)
    )
    progress = progress_result.scalars().first()
    
    if not progress:
        progress = UserLessonProgress(
            user_id=user_id,
            lesson_id=lesson_id,
            status=LessonStatus.COMPLETED
        )
        db.add(progress)
    else:
        progress.status = LessonStatus.COMPLETED
    
    await db.commit()
    await db.refresh(progress)
    
    return progress