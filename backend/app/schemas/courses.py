from pydantic import BaseModel, HttpUrl
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime, timedelta
from decimal import Decimal
from app.enums import VisibilityType, AccessType

if TYPE_CHECKING:
    from app.schemas.lessons import LessonResponse
    from app.schemas.quizzes import QuizResponse


class CourseBase(BaseModel):
    """Base course schema"""
    title: str
    description: Optional[str] = None
    image_url: Optional[HttpUrl] = None
    tags: Optional[List[str]] = []
    website_url: Optional[HttpUrl] = None
    published: bool = False
    visibility: VisibilityType = VisibilityType.EVERYONE
    access_type: AccessType = AccessType.OPEN
    price: Decimal = Decimal('0.00')


class CourseCreate(CourseBase):
    """Course creation schema"""
    course_admin_id: Optional[int] = None


class CourseUpdate(BaseModel):
    """Course update schema"""
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[HttpUrl] = None
    tags: Optional[List[str]] = None
    website_url: Optional[HttpUrl] = None
    published: Optional[bool] = None
    visibility: Optional[VisibilityType] = None
    access_type: Optional[AccessType] = None
    price: Optional[Decimal] = None


class CourseResponse(CourseBase):
    """Course response schema"""
    id: int
    total_lessons: int
    total_duration: Optional[timedelta] = None
    course_admin_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CourseWithDetails(CourseResponse):
    """Course with detailed information"""
    lessons: List['LessonResponse'] = []
    quizzes: List['QuizResponse'] = []
    enrollments_count: Optional[int] = None
    average_rating: Optional[float] = None
    
    class Config:
        from_attributes = True