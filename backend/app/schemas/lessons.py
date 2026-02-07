from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Union
from datetime import datetime, timedelta
from app.enums import LessonType, LessonStatus


class LessonBase(BaseModel):
    """Base lesson schema"""
    title: str
    lesson_type: LessonType
    description: Optional[str] = None
    order_index: int = 0
    duration: Optional[timedelta] = None


class LessonCreate(LessonBase):
    """Lesson creation schema"""
    course_id: int
    responsible_id: Optional[int] = None


class LessonUpdate(BaseModel):
    """Lesson update schema"""
    title: Optional[str] = None
    lesson_type: Optional[LessonType] = None
    description: Optional[str] = None
    order_index: Optional[int] = None
    duration: Optional[timedelta] = None


class LessonResponse(LessonBase):
    """Lesson response schema"""
    id: int
    course_id: int
    responsible_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# Content-specific schemas
class VideoContent(BaseModel):
    """Video lesson content"""
    url: HttpUrl


class DocumentContent(BaseModel):
    """Document lesson content"""
    file_url: HttpUrl
    allow_download: bool = True


class ImageContent(BaseModel):
    """Image lesson content"""
    file_url: HttpUrl
    allow_download: bool = True


class AttachmentSchema(BaseModel):
    """Lesson attachment schema"""
    id: int
    file_url: Optional[HttpUrl] = None
    external_url: Optional[HttpUrl] = None
    description: Optional[str] = None
    
    class Config:
        from_attributes = True


class LessonWithContent(LessonResponse):
    """Lesson with content details"""
    video: Optional[VideoContent] = None
    document: Optional[DocumentContent] = None
    image: Optional[ImageContent] = None
    attachments: List[AttachmentSchema] = []
    
    class Config:
        from_attributes = True


class UserLessonProgressResponse(BaseModel):
    """User lesson progress response"""
    id: int
    user_id: int
    lesson_id: int
    status: LessonStatus
    completed_at: Optional[datetime] = None
    time_spent: Optional[timedelta] = None
    
    class Config:
        from_attributes = True