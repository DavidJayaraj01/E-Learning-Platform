# Routes package initialization
from . import auth, users, courses, lessons, quizzes, reviews, rag_generation

__all__ = [
    'auth',
    'users', 
    'courses',
    'lessons',
    'quizzes',
    'reviews',
    'rag_generation'
]