from sqlalchemy import text, create_engine
from dotenv import load_dotenv
import os

load_dotenv()

engine = create_engine(os.getenv('DATABASE_URL_SYNC'))
with engine.connect() as conn:
    result = conn.execute(text(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema = 'public' ORDER BY table_name"
    ))
    tables = [row[0] for row in result]
    
    print('\n✅ Database Connection Successful!')
    print(f'\n📊 Database: elearning_db')
    print(f'\n📋 Tables Created ({len(tables)}):')
    for table in tables:
        print(f'   ✓ {table}')
    
    # Check badges count
    result = conn.execute(text("SELECT COUNT(*) FROM badges"))
    badge_count = result.scalar()
    print(f'\n🏆 Default Data:')
    print(f'   ✓ {badge_count} badges initialized')
    
print('\n✨ Database setup completed successfully!\n')
