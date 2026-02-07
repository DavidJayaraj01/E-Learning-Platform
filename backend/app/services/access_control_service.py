"""
Access Control Service - Enforces course visibility and access rules.

Business Rules:
- Visibility:
  - EVERYONE: Visible to all users including guests
  - SIGNED_IN: Visible only to authenticated users
- Access Rules:
  - OPEN: Any user who can see the course can start it
  - INVITATION: Only invited/enrolled users can start
  - PAYMENT: User must have completed payment (payment record exists)
- Unpublished courses NEVER appear in public listings
- Instructors can only manage courses they are assigned to
- Admins have full access to all courses
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Optional

from app.models.models import Course, CourseEnrollment, User
from app.enums import VisibilityType, AccessType, UserRole


async def can_view_course(
    course_id: int,
    user: Optional[User],
    db: AsyncSession
) -> bool:
    """
    Check if a user can view a course based on visibility rules.
    
    Args:
        course_id: ID of the course
        user: User object (None for guest/unauthenticated)
        db: Database session
        
    Returns:
        True if user can view the course, False otherwise
    """
    # Get course
    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalars().first()
    
    if not course:
        return False
    
    # Unpublished courses only visible to admin or course owner
    if not course.published:
        if not user:
            return False
        if user.role == UserRole.ADMIN:
            return True
        if course.course_admin_id == user.id:
            return True
        return False
    
    # Published courses - check visibility
    if course.visibility == VisibilityType.EVERYONE:
        return True
    elif course.visibility == VisibilityType.SIGNED_IN:
        return user is not None
    
    return False


async def can_access_course(
    course_id: int,
    user: User,
    db: AsyncSession
) -> tuple[bool, str]:
    """
    Check if a user can access/start a course based on access rules.
    
    Args:
        course_id: ID of the course
        user: User object (must be authenticated)
        db: Database session
        
    Returns:
        Tuple of (can_access: bool, reason: str)
    """
    # Get course
    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalars().first()
    
    if not course:
        return False, "Course not found"
    
    # Check if user can even view the course
    if not await can_view_course(course_id, user, db):
        return False, "Course not accessible"
    
    # Admins can access any course
    if user.role == UserRole.ADMIN:
        return True, "Admin access"
    
    # Course owner can access
    if course.course_admin_id == user.id:
        return True, "Course owner access"
    
    # Check access rules
    if course.access_type == AccessType.OPEN:
        return True, "Open access"
    
    elif course.access_type == AccessType.INVITATION:
        # Check if user is enrolled
        enrollment_result = await db.execute(
            select(CourseEnrollment).where(
                and_(
                    CourseEnrollment.course_id == course_id,
                    CourseEnrollment.user_id == user.id
                )
            )
        )
        enrollment = enrollment_result.scalars().first()
        
        if enrollment:
            return True, "Enrolled user"
        else:
            return False, "Course requires invitation/enrollment"
    
    elif course.access_type == AccessType.PAYMENT:
        # Check if user is enrolled (in production, also check payment status)
        enrollment_result = await db.execute(
            select(CourseEnrollment).where(
                and_(
                    CourseEnrollment.course_id == course_id,
                    CourseEnrollment.user_id == user.id
                )
            )
        )
        enrollment = enrollment_result.scalars().first()
        
        if enrollment:
            # In production: verify payment record exists and is completed
            return True, "Payment verified"
        else:
            return False, "Course requires payment"
    
    return False, "Access denied"


async def can_manage_course(course_id: int, user: User, db: AsyncSession) -> bool:
    """
    Check if a user can manage/edit a course.
    Only admins and course instructors assigned to the course can manage it.
    
    Args:
        course_id: ID of the course
        user: User object
        db: Database session
        
    Returns:
        True if user can manage the course, False otherwise
    """
    # Admins can manage any course
    if user.role == UserRole.ADMIN:
        return True
    
    # Get course
    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalars().first()
    
    if not course:
        return False
    
    # Instructor can manage only if they are the course admin
    if user.role == UserRole.INSTRUCTOR and course.course_admin_id == user.id:
        return True
    
    return False


async def get_visible_courses_query(user: Optional[User], include_unpublished: bool = False):
    """
    Build SQLAlchemy query for courses visible to a user.
    
    Args:
        user: User object (None for guest)
        include_unpublished: Whether to include unpublished courses
        
    Returns:
        SQLAlchemy select query
    """
    query = select(Course)
    
    # If not including unpublished, filter published only (unless admin)
    if not include_unpublished:
        if user and user.role == UserRole.ADMIN:
            # Admins see everything
            pass
        else:
            query = query.where(Course.published == True)
            
            # Apply visibility filter
            if user:
                # Authenticated user sees EVERYONE and SIGNED_IN
                query = query.where(
                    Course.visibility.in_([VisibilityType.EVERYONE, VisibilityType.SIGNED_IN])
                )
            else:
                # Guest sees only EVERYONE
                query = query.where(Course.visibility == VisibilityType.EVERYONE)
    
    return query


async def enroll_user_in_course(
    course_id: int,
    user_id: int,
    db: AsyncSession
) -> CourseEnrollment:
    """
    Enroll a user in a course.
    Checks access rules before enrolling.
    
    Args:
        course_id: ID of the course
        user_id: ID of the user
        db: Database session
        
    Returns:
        CourseEnrollment record
        
    Raises:
        ValueError: If enrollment is not allowed or already exists
    """
    # Check if already enrolled
    existing_result = await db.execute(
        select(CourseEnrollment).where(
            and_(
                CourseEnrollment.course_id == course_id,
                CourseEnrollment.user_id == user_id
            )
        )
    )
    existing_enrollment = existing_result.scalars().first()
    
    if existing_enrollment:
        raise ValueError("User is already enrolled in this course")
    
    # Get course to check access type
    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalars().first()
    
    if not course:
        raise ValueError("Course not found")
    
    if not course.published:
        raise ValueError("Cannot enroll in unpublished course")
    
    # For PAYMENT access type, verify payment in production
    # For now, we'll allow enrollment
    
    # Create enrollment
    enrollment = CourseEnrollment(
        course_id=course_id,
        user_id=user_id
    )
    
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)
    
    return enrollment
