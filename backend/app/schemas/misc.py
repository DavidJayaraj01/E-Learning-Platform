from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from app.enums import EnrollmentStatus


class BadgeBase(BaseModel):
    """Base badge schema"""
    name: str
    required_points: int
    description: Optional[str] = None


class BadgeCreate(BadgeBase):
    """Badge creation schema"""
    pass


class BadgeResponse(BadgeBase):
    """Badge response schema"""
    id: int
    
    class Config:
        from_attributes = True


class UserBadgeResponse(BaseModel):
    """User badge response schema"""
    id: int
    user_id: int
    badge_id: int
    awarded_at: datetime
    badge: BadgeResponse
    
    class Config:
        from_attributes = True


class EnrollmentCreate(BaseModel):
    """Course enrollment creation schema"""
    course_id: int


class EnrollmentResponse(BaseModel):
    """Course enrollment response schema"""
    id: int
    course_id: int
    user_id: int
    enrolled_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: EnrollmentStatus
    time_spent: Optional[timedelta] = None
    completion_percentage: int
    
    class Config:
        from_attributes = True


class ReviewCreate(BaseModel):
    """Course review creation schema"""
    course_id: int
    rating: int  # 1-5
    review_text: Optional[str] = None


class ReviewResponse(BaseModel):
    """Course review response schema"""
    id: int
    course_id: int
    user_id: int
    rating: int
    review_text: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True