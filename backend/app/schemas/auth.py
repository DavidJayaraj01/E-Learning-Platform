from pydantic import BaseModel, EmailStr
from typing import Optional
from app.enums import UserRole


class Token(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data"""
    user_id: int
    email: str
    role: UserRole


class LoginRequest(BaseModel):
    """Login request schema"""
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    """Registration request schema"""
    email: EmailStr
    password: str
    name: str
    role: UserRole = UserRole.LEARNER
