#!/bin/bash

# E-Learning Platform Database Setup Script

echo "🚀 Setting up E-Learning Platform Database..."
echo "=============================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if pip is installed
if ! command -v pip &> /dev/null; then
    echo "❌ pip is not installed. Please install pip."
    exit 1
fi

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies. Please check requirements.txt"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please update the .env file with your database credentials before proceeding."
    echo "   Database URL format: postgresql://username:password@localhost/database_name"
    read -p "Press Enter when you have updated the .env file..."
fi

# Run database setup
echo "🗄️  Setting up database..."
python scripts/setup_database.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database setup completed successfully!"
    echo ""
    echo "📚 Your E-Learning Platform database is ready!"
    echo ""
    echo "Next steps:"
    echo "1. Review your database schema at http://localhost:8000/docs"
    echo "2. Start developing your FastAPI routes"
    echo "3. Run the application: python -m app.main"
    echo ""
    echo "Database includes:"
    echo "• Users with role-based access (admin, instructor, learner)"
    echo "• Courses with lessons, quizzes, and progress tracking"
    echo "• Badges and points system"
    echo "• Reviews and analytics"
    echo ""
else
    echo "❌ Database setup failed. Please check the error messages above."
    exit 1
fi