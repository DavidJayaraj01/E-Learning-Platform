"""
Review and Rating Routes - Course reviews with constraints.

Business Rules:
- Only learners who started a course can review
- One review per user per course
- Rating must be between 1-5
- Reviews can be updated by the author
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List

from app.database.config import get_async_session
from app.models.models import CourseReview, CourseEnrollment, User, Course
from app.schemas.reviews import ReviewCreate, ReviewUpdate, ReviewResponse, ReviewWithUser
from app.dependencies.auth import get_current_active_user
from app.enums import EnrollmentStatus

router = APIRouter()


@router.post("/courses/{course_id}/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    course_id: int,
    review_data: ReviewCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a review for a course.
    User must have started the course to review it.
    """
    # Validate rating
    if review_data.rating < 1 or review_data.rating > 5:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Rating must be between 1 and 5"
        )
    
    # Check if course exists
    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalars().first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check if user has started the course (enrolled and started_at is not null)
    enrollment_result = await db.execute(
        select(CourseEnrollment).where(
            and_(
                CourseEnrollment.course_id == course_id,
                CourseEnrollment.user_id == current_user.id
            )
        )
    )
    enrollment = enrollment_result.scalars().first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be enrolled in the course to review it"
        )
    
    if not enrollment.started_at:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must start the course before reviewing it"
        )
    
    # Check if user already reviewed this course
    existing_review_result = await db.execute(
        select(CourseReview).where(
            and_(
                CourseReview.course_id == course_id,
                CourseReview.user_id == current_user.id
            )
        )
    )
    existing_review = existing_review_result.scalars().first()
    
    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this course. Use PUT to update your review."
        )
    
    # Create review
    db_review = CourseReview(
        course_id=course_id,
        user_id=current_user.id,
        rating=review_data.rating,
        review_text=review_data.review_text
    )
    
    db.add(db_review)
    await db.commit()
    await db.refresh(db_review)
    
    return db_review


@router.put("/courses/{course_id}/reviews", response_model=ReviewResponse)
async def update_review(
    course_id: int,
    review_data: ReviewUpdate,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update user's review for a course.
    """
    # Get existing review
    review_result = await db.execute(
        select(CourseReview).where(
            and_(
                CourseReview.course_id == course_id,
                CourseReview.user_id == current_user.id
            )
        )
    )
    review = review_result.scalars().first()
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You haven't reviewed this course yet. Use POST to create a review."
        )
    
    # Update fields
    if review_data.rating is not None:
        if review_data.rating < 1 or review_data.rating > 5:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Rating must be between 1 and 5"
            )
        review.rating = review_data.rating
    
    if review_data.review_text is not None:
        review.review_text = review_data.review_text
    
    await db.commit()
    await db.refresh(review)
    
    return review


@router.delete("/courses/{course_id}/reviews", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    course_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete user's review for a course.
    """
    # Get review
    review_result = await db.execute(
        select(CourseReview).where(
            and_(
                CourseReview.course_id == course_id,
                CourseReview.user_id == current_user.id
            )
        )
    )
    review = review_result.scalars().first()
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    await db.delete(review)
    await db.commit()


@router.get("/courses/{course_id}/reviews", response_model=List[ReviewWithUser])
async def get_course_reviews(
    course_id: int,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_async_session)
):
    """
    Get all reviews for a course.
    """
    # Get reviews with user information
    reviews_result = await db.execute(
        select(CourseReview, User)
        .join(User, CourseReview.user_id == User.id)
        .where(CourseReview.course_id == course_id)
        .offset(skip)
        .limit(limit)
    )
    
    reviews_with_users = reviews_result.all()
    
    return [
        ReviewWithUser(
            id=review.id,
            course_id=review.course_id,
            user_id=review.user_id,
            rating=review.rating,
            review_text=review.review_text,
            created_at=review.created_at,
            user_name=user.name,
            user_email=user.email
        )
        for review, user in reviews_with_users
    ]


@router.get("/courses/{course_id}/rating")
async def get_course_rating(
    course_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """
    Get average rating and total reviews for a course.
    """
    # Calculate average rating
    rating_result = await db.execute(
        select(
            func.avg(CourseReview.rating).label("average_rating"),
            func.count(CourseReview.id).label("total_reviews")
        ).where(CourseReview.course_id == course_id)
    )
    
    rating_data = rating_result.first()
    
    return {
        "course_id": course_id,
        "average_rating": float(rating_data.average_rating) if rating_data.average_rating else 0.0,
        "total_reviews": rating_data.total_reviews
    }
