#!/bin/bash

echo "🔧 PostgreSQL Database Setup for E-Learning Platform"
echo "====================================================="
echo ""

# Check if PostgreSQL is running
echo "Checking PostgreSQL service..."
if ! sudo systemctl is-active --quiet postgresql; then
    echo "❌ PostgreSQL is not running. Starting it now..."
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

echo "✅ PostgreSQL is running"
echo ""

# Get user input for database configuration
read -p "Enter your database username (or press Enter for 'balu'): " DB_USER
DB_USER=${DB_USER:-balu}

read -s -p "Enter password for database user '$DB_USER': " DB_PASSWORD
echo ""

read -p "Enter database name (or press Enter for 'elearning_db'): " DB_NAME
DB_NAME=${DB_NAME:-elearning_db}

echo ""
echo "📝 Creating PostgreSQL user and database..."

# Create user if it doesn't exist
sudo -u postgres psql -tc "SELECT 1 FROM pg_user WHERE usename = '$DB_USER'" | grep -q 1 || {
    echo "Creating user '$DB_USER'..."
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"
}

# Create database if it doesn't exist
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || {
    echo "Creating database '$DB_NAME'..."
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
}

echo "✅ Database setup completed!"
echo ""

# Update .env file
echo "📄 Updating .env file with database credentials..."

# Generate a random secret key
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

# Create the .env file
cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql+asyncpg://$DB_USER:$DB_PASSWORD@localhost/$DB_NAME
DATABASE_URL_SYNC=postgresql://$DB_USER:$DB_PASSWORD@localhost/$DB_NAME

# Application Configuration
SECRET_KEY=$SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Environment
ENVIRONMENT=development
EOF

echo "✅ .env file updated successfully!"
echo ""
echo "🚀 Database connection details:"
echo "   Username: $DB_USER"
echo "   Database: $DB_NAME"
echo "   Host: localhost"
echo "   Port: 5432"
echo ""
echo "✨ You can now run: python scripts/setup_database.py"