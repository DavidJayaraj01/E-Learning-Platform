"""
Database initialization script
Populates initial data like badges
"""
import asyncio
import sys
import os

# Add the project root to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import select
from app.database.config import AsyncSessionLocal, sync_engine
from app.models.models import Badge


async def init_badges():
    """Initialize badges with default values"""
    badges_data = [
        {"name": "Newbie", "required_points": 20, "description": "First steps"},
        {"name": "Explorer", "required_points": 40, "description": "Keep going"},
        {"name": "Achiever", "required_points": 60, "description": "Good progress"},
        {"name": "Specialist", "required_points": 80, "description": "Advanced learner"},
        {"name": "Expert", "required_points": 100, "description": "Expert level"},
        {"name": "Master", "required_points": 120, "description": "Mastered it!"},
    ]
    
    async with AsyncSessionLocal() as session:
        # Check if badges already exist
        result = await session.execute(select(Badge).limit(1))
        existing_badges = result.scalars().first()
        
        if existing_badges:
            print("Badges already exist. Skipping initialization.")
            return
        
        # Create badges
        for badge_data in badges_data:
            badge = Badge(**badge_data)
            session.add(badge)
        
        await session.commit()
        print(f"Successfully created {len(badges_data)} badges.")


async def init_database():
    """Initialize the database with default data"""
    print("Initializing database...")
    
    try:
        await init_badges()
        print("Database initialization completed successfully!")
        
    except Exception as e:
        print(f"Error during database initialization: {e}")
        raise


if __name__ == "__main__":
    # Run the initialization
    asyncio.run(init_database())