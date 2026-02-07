import asyncio
from sqlalchemy import text
from app.database.config import get_async_session

async def check_enums():
    async for db in get_async_session():
        result = await db.execute(text("SELECT typname FROM pg_type WHERE typcategory = 'E';"))
        print("\nEnum types in database:")
        enums = result.scalars().all()
        if enums:
            for enum in enums:
                print(f"  - {enum}")
        else:
            print("  No enum types found!")
        break

asyncio.run(check_enums())
