"""
Fix user roles in database - convert lowercase to uppercase
"""
import asyncio
from sqlalchemy import text
from app.database.config import AsyncSessionLocal


async def fix_roles():
    """Update all lowercase role values to uppercase"""
    async with AsyncSessionLocal() as db:
        try:
            # Update lowercase roles to uppercase by casting to text and back
            result = await db.execute(
                text("""
                    UPDATE users 
                    SET role = UPPER(role::text)::userrole
                    WHERE role::text IN ('admin', 'instructor', 'learner')
                """)
            )
            await db.commit()
            
            print(f"✓ Updated {result.rowcount} user roles to uppercase")
            
            # Verify the fix
            check = await db.execute(text("SELECT id, email, role FROM users"))
            users = check.fetchall()
            
            print("\nCurrent users:")
            for user in users:
                print(f"  ID {user.id}: {user.email} - Role: {user.role}")
                
        except Exception as e:
            print(f"Error: {e}")
            await db.rollback()
            raise


if __name__ == "__main__":
    print("Fixing user roles in database...\n")
    asyncio.run(fix_roles())
