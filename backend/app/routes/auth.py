from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database.config import get_async_session
from app.models.models import User, CourseEnrollment, UserLessonProgress, Lesson
from app.schemas.users import UserCreate, UserResponse
from app.dependencies.auth import create_access_token, get_current_user
from pydantic import BaseModel
from datetime import timedelta

router = APIRouter()
security = HTTPBearer(auto_error=False)


async def get_user_stats(db: AsyncSession, user_id: int) -> dict:
    """Get enrollment and completion stats for a user"""
    # Count enrolled courses
    enrolled_result = await db.execute(
        select(func.count(CourseEnrollment.id))
        .where(CourseEnrollment.user_id == user_id)
    )
    enrolled_count = enrolled_result.scalar() or 0
    
    # Count completed courses based on lesson progress
    # A course is considered complete if ALL lessons have COMPLETED status
    from app.enums import LessonStatus
    
    # Subquery: for each enrollment, check if all lessons are completed
    completed_count = 0
    enrollments_result = await db.execute(
        select(CourseEnrollment.course_id)
        .where(CourseEnrollment.user_id == user_id)
    )
    enrolled_course_ids = [row[0] for row in enrollments_result.fetchall()]
    
    for course_id in enrolled_course_ids:
        # Get total lessons in course
        total_lessons_result = await db.execute(
            select(func.count(Lesson.id))
            .where(Lesson.course_id == course_id)
        )
        total_lessons = total_lessons_result.scalar() or 0
        
        if total_lessons == 0:
            continue  # Skip courses with no lessons
        
        # Get completed lessons for this user in this course
        completed_lessons_result = await db.execute(
            select(func.count(UserLessonProgress.id))
            .join(Lesson, Lesson.id == UserLessonProgress.lesson_id)
            .where(Lesson.course_id == course_id)
            .where(UserLessonProgress.user_id == user_id)
            .where(UserLessonProgress.status == LessonStatus.COMPLETED)
        )
        completed_lessons = completed_lessons_result.scalar() or 0
        
        if completed_lessons >= total_lessons:
            completed_count += 1
    
    return {
        "enrolled_courses": enrolled_count,
        "completed_courses": completed_count
    }


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str = "learner"


@router.post("/login", response_model=LoginResponse)
async def login(
    credentials: LoginRequest,
    db: AsyncSession = Depends(get_async_session)
):
    """Login user and return access token"""
    # Find user by email
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # In production, you should verify the hashed password
    # For now, we'll do a simple comparison
    if user.password_hash != credentials.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Generate proper JWT token
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=30)
    )
    
    # Get user stats
    stats = await get_user_stats(db, user.id)
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            full_name=user.name,
            role=user.role,
            total_points=user.total_points,
            enrolled_courses=stats["enrolled_courses"],
            completed_courses=stats["completed_courses"],
            created_at=user.created_at
        )
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: RegisterRequest,
    db: AsyncSession = Depends(get_async_session)
):
    """Register a new user"""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user (password should be hashed in production)
    db_user = User(
        email=user_data.email,
        password_hash=user_data.password,  # Hash this in production!
        name=user_data.name,
        role=user_data.role.lower()  # Ensure lowercase for enum consistency
    )
    
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    return UserResponse(
        id=db_user.id,
        email=db_user.email,
        name=db_user.name,
        full_name=db_user.name,
        role=db_user.role,
        total_points=db_user.total_points,
        enrolled_courses=0,
        completed_courses=0,
        created_at=db_user.created_at
    )


@router.get("/profile", response_model=UserResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Get current user profile"""
    # Get user stats
    stats = await get_user_stats(db, current_user.id)
    
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        full_name=current_user.name,
        role=current_user.role,
        total_points=current_user.total_points,
        enrolled_courses=stats["enrolled_courses"],
        completed_courses=stats["completed_courses"],
        created_at=current_user.created_at
    )