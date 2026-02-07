from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta


class ProgressReport(BaseModel):
    """User progress report for a course"""
    user_id: int
    user_name: Optional[str]
    user_email: Optional[str]
    enrolled_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    status: str
    completion_percentage: int
    completed_lessons: int
    total_lessons: int
    completed_quizzes: int
    total_quizzes: int
    time_spent: str


class EnrollmentStatusResponse(BaseModel):
    """Enrollment status response"""
    course_id: int
    user_id: int
    status: str
    completion_percentage: int
    enrolled_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True
