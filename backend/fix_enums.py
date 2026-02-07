"""
Fix enum reference issue by creating aliases.
The database has user_role, lesson_type, etc. with underscores,
but SQLAlchemy is trying to reference them without underscores.
"""
import asyncio
from sqlalchemy import text
from app.database.config import get_async_session

ENUM_FIXES = [
    # UserRole - already created with uppercase
    ("DROP TYPE IF EXISTS userrole CASCADE", "Drop old userrole"),
    ("CREATE TYPE userrole AS ENUM ('ADMIN', 'INSTRUCTOR', 'LEARNER')", "Create userrole (uppercase)"),
    ("ALTER TABLE users ADD COLUMN IF NOT EXISTS role userrole DEFAULT 'LEARNER' NOT NULL", "Recreate role column if needed"),
    
    # VisibilityType
    ("DROP TYPE IF EXISTS visibilitytype CASCADE", "Drop old visibilitytype"),  
    ("CREATE TYPE visibilitytype AS ENUM ('EVERYONE', 'SIGNED_IN')", "Create visibilitytype"),
    
    # AccessType
    ("DROP TYPE IF EXISTS accesstype CASCADE", "Drop old accesstype"),
    ("CREATE TYPE accesstype AS ENUM ('OPEN', 'INVITATION', 'PAYMENT')", "Create accesstype"),
    
    # LessonType
    ("DROP TYPE IF EXISTS lessontype CASCADE", "Drop old lessontype"),
    ("CREATE TYPE lessontype AS ENUM ('VIDEO', 'DOCUMENT', 'IMAGE', 'QUIZ')", "Create lessontype"),
    
    # LessonStatus
    ("DROP TYPE IF EXISTS lessonstatus CASCADE", "Drop old lessonstatus"),
    ("CREATE TYPE lessonstatus AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')", "Create lessonstatus"),
    
    # EnrollmentStatus
    ("DROP TYPE IF EXISTS enrollmentstatus CASCADE", "Drop old enrollmentstatus"),
    ("CREATE TYPE enrollmentstatus AS ENUM ('YET_TO_START', 'IN_PROGRESS', 'COMPLETED')", "Create enrollmentstatus"),
    
    # QuizAttemptStatus
    ("DROP TYPE IF EXISTS quizattemptstatus CASCADE", "Drop old quizattemptstatus"),
    ("CREATE TYPE quizattemptstatus AS ENUM ('IN_PROGRESS', 'COMPLETED')", "Create quizattemptstatus"),
]

async def fix_enums():
    async for db in get_async_session():
        try:
            print("\n🔧 Fixing enum types...\n")
            
            for sql, description in ENUM_FIXES:
                print(f"  {description}...")
                await db.execute(text(sql))
            
            await db.commit()
            print("\n✅ Enum types fixed successfully!")
            
        except Exception as e:
            print(f"\n❌ Error: {e}")
            await db.rollback()
        break

asyncio.run(fix_enums())
