#!/usr/bin/env python3
"""
Quick fix for existing ENUM types issue
This script will create the database tables directly without migrations
"""
import sys
import os

# Add the project root to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import create_engine, text
from app.database.config import settings, Base
from app.models.models import *


def create_tables_directly():
    """Create all tables directly using SQLAlchemy"""
    print("🏗️  Creating database tables directly...")
    
    try:
        engine = create_engine(settings.database_url_sync)
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        print("✅ Database tables created successfully!")
        
        # Mark as migrated
        try:
            import subprocess
            result = subprocess.run(
                ["alembic", "stamp", "head"], 
                capture_output=True, 
                text=True,
                cwd=os.path.join(os.path.dirname(__file__), "..")
            )
            if result.returncode == 0:
                print("📝 Database marked as migrated")
            else:
                print("⚠️  Could not mark migration state, but tables were created")
        except:
            print("⚠️  Could not mark migration state, but tables were created")
            
        return True
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False


def initialize_badges():
    """Initialize badges"""
    print("📊 Initializing badges...")
    
    try:
        engine = create_engine(settings.database_url_sync)
        
        with engine.begin() as conn:
            # Check if badges exist
            result = conn.execute(text("SELECT COUNT(*) FROM badges")).scalar()
            
            if result > 0:
                print("📋 Badges already exist, skipping initialization")
                return True
            
            # Insert badges
            badges_data = [
                ("Newbie", 20, "First steps"),
                ("Explorer", 40, "Keep going"), 
                ("Achiever", 60, "Good progress"),
                ("Specialist", 80, "Advanced learner"),
                ("Expert", 100, "Expert level"),
                ("Master", 120, "Mastered it!")
            ]
            
            for name, points, desc in badges_data:
                conn.execute(
                    text("INSERT INTO badges (name, required_points, description) VALUES (:name, :points, :desc)"),
                    {"name": name, "points": points, "desc": desc}
                )
            
            print(f"✅ Created {len(badges_data)} badges")
            
        return True
        
    except Exception as e:
        print(f"❌ Error initializing badges: {e}")
        return False


def main():
    print("🚀 Quick Database Setup Fix")
    print("=" * 40)
    
    if create_tables_directly():
        initialize_badges()
        print("\n✨ Database setup completed!")
        print("🎯 You can now run: python -m app.main")
    else:
        print("\n❌ Database setup failed")
        sys.exit(1)


if __name__ == "__main__":
    main()