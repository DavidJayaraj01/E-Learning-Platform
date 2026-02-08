import asyncio
from app.database.config import get_async_session
from sqlalchemy import text

async def check():
    async for db in get_async_session():
        # Check quiz attempts for user 8
        result = await db.execute(text("SELECT * FROM quiz_attempts WHERE user_id = 8"))
        attempts = result.fetchall()
        print(f"\nQuiz attempts for user 8: {len(attempts)}")
        for a in attempts:
            print(f"  Attempt: {a}")
        
        # Check all quiz attempts
        result = await db.execute(text("SELECT * FROM quiz_attempts"))
        all_attempts = result.fetchall()
        print(f"\nTotal quiz attempts: {len(all_attempts)}")
        for a in all_attempts:
            print(f"  {a}")
        
        # Check lesson progress
        result = await db.execute(text("SELECT * FROM user_lesson_progress WHERE user_id = 8"))
        lesson_progress = result.fetchall()
        print(f"\nLesson progress for user 8: {len(lesson_progress)}")
        for lp in lesson_progress:
            print(f"  Progress: {lp}")
        
        # Check what quizzes exist for course 8
        result = await db.execute(text("SELECT id, title FROM quizzes WHERE course_id = 8"))
        quizzes = result.fetchall()
        print(f"\nQuizzes in course 8: {len(quizzes)}")
        for q in quizzes:
            print(f"  Quiz: {q}")
        
        break

asyncio.run(check())
