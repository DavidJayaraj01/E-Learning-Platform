from pydantic import BaseModel, EmailStr
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from app.enums import UserRole

if TYPE_CHECKING:
    from app.schemas.misc import BadgeResponse


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    name: str
    role: UserRole = UserRole.LEARNER


class UserCreate(UserBase):
    """User creation schema"""
    password: str


class UserUpdate(BaseModel):
    """User update schema"""
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: Optional[UserRole] = None


class UserResponse(UserBase):
    """User response schema"""
    id: int
    total_points: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserWithBadges(UserResponse):
    """User with badges response"""
    badges: List['BadgeResponse'] = []
    
    class Config:
        from_attributes = True