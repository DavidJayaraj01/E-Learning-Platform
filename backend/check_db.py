#!/usr/bin/env python3
"""
Quick database check for the E-Learning Platform.
Verifies database connectivity and user role consistency.
"""

import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select
from app.models.models import User, Course

# Database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://elearning:elearning123@localhost/elearning_db")

async def check_database():
    """Check database connection and data"""
    print("🔍 Checking E-Learning Platform Database...")
    print(f"📍 Database URL: {DATABASE_URL}")
    
    engine = create_async_engine(DATABASE_URL, echo=False)
    
    try:
        async with engine.begin() as conn:
            print("✅ Database connection successful!")
        
        # Check users and their roles
        async with AsyncSession(engine) as session:
            print("\n👥 Checking Users...")
            result = await session.execute(select(User))
            users = result.scalars().all()
            
            if users:
                print(f"📊 Found {len(users)} users:")
                for user in users:
                    print(f"  • {user.email} (Role: {user.role}, ID: {user.id})")
            else:
                print("⚠️  No users found in database")
            
            print("\n📚 Checking Courses...")
            result = await session.execute(select(Course))
            courses = result.scalars().all()
            
            if courses:
                print(f"📊 Found {len(courses)} courses:")
                for course in courses:
                    print(f"  • {course.title} (Published: {course.published}, ID: {course.id})")
            else:
                print("⚠️  No courses found in database")
                
    except Exception as e:
        print(f"❌ Database check failed: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_database())