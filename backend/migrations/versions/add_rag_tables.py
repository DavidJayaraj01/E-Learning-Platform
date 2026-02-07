"""Add RAG course generation tables

Revision ID: add_rag_tables
Revises: initial_migration
Create Date: 2026-02-07

Tables Added:
- uploaded_documents: Store uploaded books/documents
- document_chunks: Text chunks with embeddings for RAG
- course_generation_jobs: Track generation progress
- rag_configurations: User/global RAG settings
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY, ENUM


# revision identifiers
revision = 'add_rag_tables'
down_revision = '001_initial_schema'  # Depends on initial schema migration
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum types
    document_status = ENUM('pending', 'processing', 'processed', 'failed', name='document_status', create_type=True)
    generation_status = ENUM(
        'pending', 'analyzing', 'generating_structure', 'generating_content', 
        'generating_quizzes', 'completed', 'failed', 
        name='generation_status', create_type=True
    )
    
    # Create uploaded_documents table
    op.create_table(
        'uploaded_documents',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('filename', sa.String(500), nullable=False),
        sa.Column('original_filename', sa.String(500), nullable=False),
        sa.Column('file_path', sa.String(1000), nullable=False),
        sa.Column('file_type', sa.String(50), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('status', document_status, default='pending'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('title', sa.String(500), nullable=True),
        sa.Column('author', sa.String(255), nullable=True),
        sa.Column('total_pages', sa.Integer(), nullable=True),
        sa.Column('total_chunks', sa.Integer(), default=0),
        sa.Column('uploaded_at', sa.TIMESTAMP(), server_default=sa.func.current_timestamp()),
        sa.Column('processed_at', sa.TIMESTAMP(), nullable=True),
    )
    op.create_index('ix_uploaded_documents_user_id', 'uploaded_documents', ['user_id'])
    op.create_index('ix_uploaded_documents_status', 'uploaded_documents', ['status'])
    
    # Create document_chunks table
    op.create_table(
        'document_chunks',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('document_id', sa.Integer(), sa.ForeignKey('uploaded_documents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('chunk_index', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('content_hash', sa.String(64), nullable=True),
        sa.Column('page_number', sa.Integer(), nullable=True),
        sa.Column('chapter', sa.String(255), nullable=True),
        sa.Column('section', sa.String(255), nullable=True),
        sa.Column('embedding', ARRAY(sa.Float()), nullable=True),
        sa.Column('embedding_model', sa.String(100), default='all-MiniLM-L6-v2'),
        sa.Column('token_count', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.current_timestamp()),
    )
    op.create_index('ix_document_chunks_document_id', 'document_chunks', ['document_id'])
    
    # Create course_generation_jobs table
    op.create_table(
        'course_generation_jobs',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('document_id', sa.Integer(), sa.ForeignKey('uploaded_documents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', generation_status, default='pending'),
        sa.Column('progress_percentage', sa.Integer(), default=0),
        sa.Column('current_step', sa.String(255), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('settings', sa.JSON(), default={}),
        sa.Column('generated_outline', sa.JSON(), nullable=True),
        sa.Column('generated_lessons', sa.JSON(), nullable=True),
        sa.Column('generated_quizzes', sa.JSON(), nullable=True),
        sa.Column('generated_course_id', sa.Integer(), sa.ForeignKey('courses.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.current_timestamp()),
        sa.Column('started_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('completed_at', sa.TIMESTAMP(), nullable=True),
    )
    op.create_index('ix_course_generation_jobs_user_id', 'course_generation_jobs', ['user_id'])
    op.create_index('ix_course_generation_jobs_status', 'course_generation_jobs', ['status'])
    
    # Create rag_configurations table
    op.create_table(
        'rag_configurations',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True),
        sa.Column('embedding_model', sa.String(100), default='all-MiniLM-L6-v2'),
        sa.Column('chunk_size', sa.Integer(), default=1000),
        sa.Column('chunk_overlap', sa.Integer(), default=200),
        sa.Column('llm_provider', sa.String(50), default='ollama'),
        sa.Column('llm_model', sa.String(100), default='gemma3:4b'),  # Gemma 3 4B
        sa.Column('temperature', sa.Float(), default=0.7),
        sa.Column('max_tokens', sa.Integer(), default=2000),
        sa.Column('top_k_chunks', sa.Integer(), default=5),
        sa.Column('similarity_threshold', sa.Float(), default=0.7),
        sa.Column('default_lessons_per_course', sa.Integer(), default=10),
        sa.Column('default_quiz_questions', sa.Integer(), default=5),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.current_timestamp()),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.func.current_timestamp(), onupdate=sa.func.current_timestamp()),
    )
    
    # Insert default global configuration
    op.execute("""
        INSERT INTO rag_configurations (
            user_id, embedding_model, chunk_size, chunk_overlap,
            llm_provider, llm_model, temperature, max_tokens,
            top_k_chunks, similarity_threshold,
            default_lessons_per_course, default_quiz_questions
        ) VALUES (
            NULL, 'all-MiniLM-L6-v2', 1000, 200,
            'ollama', 'gemma3:4b', 0.7, 2000,
            5, 0.7, 10, 5
        )
    """)


def downgrade() -> None:
    # Drop tables
    op.drop_table('rag_configurations')
    op.drop_table('course_generation_jobs')
    op.drop_table('document_chunks')
    op.drop_table('uploaded_documents')
    
    # Drop enum types
    op.execute('DROP TYPE IF EXISTS generation_status')
    op.execute('DROP TYPE IF EXISTS document_status')
