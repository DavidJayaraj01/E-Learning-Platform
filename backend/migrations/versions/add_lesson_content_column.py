"""Add content column to lessons table

Revision ID: add_lesson_content
Revises: add_rag_tables
Create Date: 2024-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import TEXT

# revision identifiers, used by Alembic.
revision = 'add_lesson_content'
down_revision = 'add_rag_tables'
branch_labels = None
depends_on = None


def upgrade():
    """Add content column to lessons table for RAG-generated content"""
    op.add_column('lessons', sa.Column('content', TEXT, nullable=True))


def downgrade():
    """Remove content column from lessons table"""
    op.drop_column('lessons', 'content')