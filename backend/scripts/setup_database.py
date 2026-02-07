"""
Complete database setup script
Creates database, runs migrations, and initializes data
"""
import subprocess
import sys
import os
import asyncio

# Add the project root to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import create_engine, text
from app.database.config import settings
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT


def create_database_if_not_exists():
    """Create database if it doesn't exist"""
    # Parse the database URL to get connection details
    url_parts = settings.database_url_sync.replace("postgresql://", "").split("/")
    db_name = url_parts[-1]
    host_port_user_pass = url_parts[0]
    
    # Connect without specifying database name
    base_url = f"postgresql://{host_port_user_pass}/postgres"
    
    try:
        # Connect to PostgreSQL server
        engine = create_engine(base_url)
        
        with engine.connect() as conn:
            conn.execute(text("COMMIT"))  # End any existing transaction
            
            # Check if database exists
            result = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :db_name"),
                {"db_name": db_name}
            )
            
            if not result.fetchone():
                # Create database
                conn.execute(text(f'CREATE DATABASE "{db_name}"'))
                print(f"Created database: {db_name}")
            else:
                print(f"Database {db_name} already exists")
                
    except Exception as e:
        print(f"Error creating database: {e}")
        print("Please ensure PostgreSQL is running and credentials are correct")
        return False
    
    return True


def run_migrations():
    """Run Alembic migrations"""
    try:
        print("Running database migrations...")
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            cwd=os.path.join(os.path.dirname(__file__), ".."),
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("Migrations completed successfully!")
            print(result.stdout)
        else:
            print("Migration failed!")
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"Error running migrations: {e}")
        return False
    
    return True


async def initialize_data():
    """Initialize default data"""
    try:
        print("Initializing default data...")
        from scripts.init_db import init_database
        await init_database()
        
    except Exception as e:
        print(f"Error initializing data: {e}")
        return False
    
    return True


async def main():
    """Main setup function"""
    print("Starting database setup...")
    
    # Step 1: Create database
    if not create_database_if_not_exists():
        print("Failed to create database. Exiting.")
        return
    
    # Step 2: Run migrations
    if not run_migrations():
        print("Failed to run migrations. Exiting.")
        return
    
    # Step 3: Initialize data
    if not await initialize_data():
        print("Failed to initialize data. Exiting.")
        return
    
    print("\n✅ Database setup completed successfully!")
    print("\nNext steps:")
    print("1. Update your .env file with correct database credentials")
    print("2. Install Python dependencies: pip install -r requirements.txt")
    print("3. Start your FastAPI application")


if __name__ == "__main__":
    asyncio.run(main())