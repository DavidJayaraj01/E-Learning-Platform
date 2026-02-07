from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReviewCreate(BaseModel):
    """Review creation schema"""
    rating: int  # 1-5
    review_text: Optional[str] = None


class ReviewUpdate(BaseModel):
    """Review update schema"""
    rating: Optional[int] = None
    review_text: Optional[str] = None


class ReviewResponse(BaseModel):
    """Review response schema"""
    id: int
    course_id: int
    user_id: int
    rating: int
    review_text: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class ReviewWithUser(ReviewResponse):
    """Review with user information"""
    user_name: str
    user_email: str
