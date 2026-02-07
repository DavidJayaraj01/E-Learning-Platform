"""
Badge Service - Handles automatic badge assignment based on user points.

Business Rules:
- Badge thresholds:
  - Newbie → 20 points
  - Explorer → 40 points
  - Achiever → 60 points
  - Specialist → 80 points
  - Expert → 100 points
  - Master → 120 points
- Badges are automatically upgraded when user crosses threshold
- User can have multiple badges
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.models import User, Badge, UserBadge
from typing import List, Optional


# Badge thresholds (defined from requirements)
BADGE_THRESHOLDS = {
    "Newbie": 20,
    "Explorer": 40,
    "Achiever": 60,
    "Specialist": 80,
    "Expert": 100,
    "Master": 120
}


async def update_user_badges(user_id: int, db: AsyncSession) -> List[Badge]:
    """
    Update user badges based on their current total points.
    Automatically assigns new badges when thresholds are crossed.
    
    Args:
        user_id: ID of the user
        db: Database session
        
    Returns:
        List of all badges the user has earned
        
    Note:
        This function should be called whenever user's total_points changes.
    """
    # Get user's current total points
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalars().first()
    
    if not user:
        return []
    
    total_points = user.total_points
    
    # Get all available badges
    badges_result = await db.execute(select(Badge).order_by(Badge.required_points))
    all_badges = badges_result.scalars().all()
    
    # Get badges user already has
    user_badges_result = await db.execute(
        select(UserBadge).where(UserBadge.user_id == user_id)
    )
    existing_user_badge_ids = {ub.badge_id for ub in user_badges_result.scalars().all()}
    
    # Find badges user should have based on points
    earned_badges = []
    for badge in all_badges:
        if total_points >= badge.required_points:
            earned_badges.append(badge)
            
            # Add badge if user doesn't have it yet
            if badge.id not in existing_user_badge_ids:
                new_user_badge = UserBadge(user_id=user_id, badge_id=badge.id)
                db.add(new_user_badge)
    
    if earned_badges:
        await db.commit()
    
    return earned_badges


async def get_user_badges(user_id: int, db: AsyncSession) -> List[Badge]:
    """
    Get all badges earned by a user.
    
    Args:
        user_id: ID of the user
        db: Database session
        
    Returns:
        List of Badge models the user has earned
    """
    result = await db.execute(
        select(Badge)
        .join(UserBadge)
        .where(UserBadge.user_id == user_id)
        .order_by(Badge.required_points)
    )
    
    return result.scalars().all()


async def get_next_badge(user_id: int, db: AsyncSession) -> Optional[Badge]:
    """
    Get the next badge the user can earn.
    
    Args:
        user_id: ID of the user
        db: Database session
        
    Returns:
        Next achievable Badge or None if user has all badges
    """
    # Get user's total points
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalars().first()
    
    if not user:
        return None
    
    # Get next badge user hasn't earned yet
    result = await db.execute(
        select(Badge)
        .where(Badge.required_points > user.total_points)
        .order_by(Badge.required_points)
        .limit(1)
    )
    
    return result.scalars().first()
