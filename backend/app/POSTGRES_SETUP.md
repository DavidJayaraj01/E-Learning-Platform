# Quick PostgreSQL Setup Guide for E-Learning Platform

## The Issue
You're getting "password authentication failed for user 'username'" because you're using placeholder credentials.

## Solution - Quick Fix

### Option 1: Use your existing PostgreSQL user (Recommended)

If you already have a PostgreSQL user, update your .env file:

```bash
# In your .env file, replace these lines:
DATABASE_URL=postgresql+asyncpg://your_username:your_password@localhost/elearning_db
DATABASE_URL_SYNC=postgresql://your_username:your_password@localhost/elearning_db
```

### Option 2: Create a new PostgreSQL user and database

Run these commands one by one:

```bash
# 1. Connect to PostgreSQL as postgres user
sudo -u postgres psql

# 2. In the PostgreSQL prompt, run:
CREATE USER balu WITH PASSWORD 'your_secure_password';
ALTER USER balu CREATEDB;
CREATE DATABASE elearning_db OWNER balu;
\q

# 3. Update your .env file with these credentials:
DATABASE_URL=postgresql+asyncpg://balu:your_secure_password@localhost/elearning_db
DATABASE_URL_SYNC=postgresql://balu:your_secure_password@localhost/elearning_db
```

### Option 3: Use peer authentication (Linux only)

```bash
# 1. Create PostgreSQL user matching your system user
sudo -u postgres createuser --interactive balu
# Answer: y (yes, user should be a superuser)

# 2. Create database
sudo -u postgres createdb elearning_db -O balu

# 3. Update .env file:
DATABASE_URL=postgresql+asyncpg://balu@localhost/elearning_db
DATABASE_URL_SYNC=postgresql://balu@localhost/elearning_db
```

## After updating .env, run:
```bash
python scripts/setup_database.py
```

## Generate Secret Key
Replace 'your-secret-key-here' in .env with:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```