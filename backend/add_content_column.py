"""Add content column to lessons table"""
import asyncio
from sqlalchemy import text
from app.database.config import AsyncSessionLocal


async def add_content_column():
    """Add content column to lessons table if it doesn't exist"""
    async with AsyncSessionLocal() as db:
        try:
            # Add content column
            await db.execute(
                text("ALTER TABLE lessons ADD COLUMN IF NOT EXISTS content TEXT;")
            )
            await db.commit()
            print("✓ Added 'content' column to lessons table")
            
            # Verify the column exists
            check = await db.execute(
                text("""
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = 'lessons' 
                    ORDER BY ordinal_position;
                """)
            )
            columns = check.fetchall()
            
            print("\nLessons table columns:")
            for col in columns:
                print(f"  - {col[0]}: {col[1]}")
                
        except Exception as e:
            print(f"Error: {e}")
            await db.rollback()
            raise


if __name__ == "__main__":
    print("Adding content column to lessons table...\n")
    asyncio.run(add_content_column())
