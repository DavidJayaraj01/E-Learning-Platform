from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.enums import QuizAttemptStatus


class QuestionOptionBase(BaseModel):
    """Base question option schema"""
    option_text: str
    is_correct: bool = False
    order_index: Optional[int] = None


class QuestionOptionCreate(QuestionOptionBase):
    """Question option creation schema"""
    pass


class QuestionOptionResponse(QuestionOptionBase):
    """Question option response schema"""
    id: int
    question_id: int
    
    class Config:
        from_attributes = True


class QuestionBase(BaseModel):
    """Base quiz question schema"""
    question_text: str
    order_index: int
    points_first: int = 10
    points_second: int = 7
    points_third: int = 5
    points_more: int = 2


class QuestionCreate(QuestionBase):
    """Quiz question creation schema"""
    options: List[QuestionOptionCreate]


class QuestionResponse(QuestionBase):
    """Quiz question response schema"""
    id: int
    quiz_id: int
    options: List[QuestionOptionResponse] = []
    
    class Config:
        from_attributes = True


class QuizBase(BaseModel):
    """Base quiz schema"""
    title: str
    order_index: int = 0


class QuizCreate(QuizBase):
    """Quiz creation schema"""
    course_id: int
    questions: List[QuestionCreate] = []


class QuizResponse(QuizBase):
    """Quiz response schema"""
    id: int
    course_id: int
    questions: List[QuestionResponse] = []
    
    class Config:
        from_attributes = True


class QuizAttemptCreate(BaseModel):
    """Quiz attempt creation schema"""
    quiz_id: int


class QuizAnswerSubmit(BaseModel):
    """Quiz answer submission schema"""
    question_id: int
    selected_option_id: int


class QuizAttemptSubmit(BaseModel):
    """Quiz attempt submission schema"""
    attempt_id: int
    answers: List[QuizAnswerSubmit]


class QuizAttemptResponse(BaseModel):
    """Quiz attempt response schema"""
    id: int
    user_id: int
    quiz_id: int
    attempt_number: int
    status: QuizAttemptStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    earned_points: int
    
    class Config:
        from_attributes = True