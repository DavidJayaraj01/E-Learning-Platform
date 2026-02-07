# Routes package initialization
from . import auth, users, courses, lessons, quizzes, reviews, rag_generation, ai_content

__all__ = [
    'auth',
    'users', 
    'courses',
    'lessons',
    'quizzes',
    'reviews',
    'rag_generation',
    'ai_content'
]