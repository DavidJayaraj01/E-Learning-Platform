"""Initial database schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-02-07 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create ENUM types with existence checks
    connection = op.get_bind()
    
    # Check and create ENUMs only if they don't exist
    enums_to_create = [
        ('user_role', ['admin', 'instructor', 'learner']),
        ('lesson_type', ['video', 'document', 'image', 'quiz']),
        ('visibility_type', ['everyone', 'signed_in']),
        ('access_type', ['open', 'invitation', 'payment']),
        ('lesson_status', ['not_started', 'in_progress', 'completed']),
        ('enrollment_status', ['yet_to_start', 'in_progress', 'completed']),
        ('quiz_attempt_status', ['in_progress', 'completed'])
    ]
    
    for enum_name, enum_values in enums_to_create:
        # Check if enum exists
        result = connection.execute(
            sa.text("SELECT 1 FROM pg_type WHERE typname = :enum_name"),
            {"enum_name": enum_name}
        ).fetchone()
        
        if not result:
            # Create the enum if it doesn't exist
            enum_values_str = "', '".join(enum_values)
            connection.execute(
                sa.text(f"CREATE TYPE {enum_name} AS ENUM ('{enum_values_str}')")
            )
    
    # Reference the enums for table creation
    user_role_enum = postgresql.ENUM(*['admin', 'instructor', 'learner'], name='user_role')
    lesson_type_enum = postgresql.ENUM(*['video', 'document', 'image', 'quiz'], name='lesson_type')
    visibility_type_enum = postgresql.ENUM(*['everyone', 'signed_in'], name='visibility_type')
    access_type_enum = postgresql.ENUM(*['open', 'invitation', 'payment'], name='access_type')
    lesson_status_enum = postgresql.ENUM(*['not_started', 'in_progress', 'completed'], name='lesson_status')
    enrollment_status_enum = postgresql.ENUM(*['yet_to_start', 'in_progress', 'completed'], name='enrollment_status')
    quiz_attempt_status_enum = postgresql.ENUM(*['in_progress', 'completed'], name='quiz_attempt_status')

    # Create users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('role', user_role_enum, nullable=False),
        sa.Column('total_points', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # Create badges table
    op.create_table('badges',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('required_points', sa.Integer(), nullable=False),
        sa.Column('description', sa.TEXT(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_badges_id'), 'badges', ['id'], unique=False)

    # Create courses table
    op.create_table('courses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('description', sa.TEXT(), nullable=True),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('tags', sa.ARRAY(sa.String()), nullable=True),
        sa.Column('website_url', sa.String(length=500), nullable=True),
        sa.Column('published', sa.Boolean(), nullable=True),
        sa.Column('visibility', visibility_type_enum, nullable=True),
        sa.Column('access_type', access_type_enum, nullable=True),
        sa.Column('price', sa.DECIMAL(precision=10, scale=2), nullable=True),
        sa.Column('course_admin_id', sa.Integer(), nullable=True),
        sa.Column('total_lessons', sa.Integer(), nullable=True),
        sa.Column('total_duration', sa.Interval(), server_default=sa.text("'0 minutes'::interval"), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['course_admin_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_courses_id'), 'courses', ['id'], unique=False)

    # Create user_badges table
    op.create_table('user_badges',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('badge_id', sa.Integer(), nullable=False),
        sa.Column('awarded_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['badge_id'], ['badges.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'badge_id')
    )
    op.create_index(op.f('ix_user_badges_id'), 'user_badges', ['id'], unique=False)

    # Create course_enrollments table
    op.create_table('course_enrollments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('enrolled_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('started_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('completed_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('status', enrollment_status_enum, nullable=True),
        sa.Column('time_spent', sa.Interval(), server_default=sa.text("'0 minutes'::interval"), nullable=True),
        sa.Column('completion_percentage', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('course_id', 'user_id')
    )
    op.create_index(op.f('ix_course_enrollments_id'), 'course_enrollments', ['id'], unique=False)

    # Create course_reviews table
    op.create_table('course_reviews',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('review_text', sa.TEXT(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.CheckConstraint('rating >= 1 AND rating <= 5', name='check_rating_range'),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('course_id', 'user_id')
    )
    op.create_index(op.f('ix_course_reviews_id'), 'course_reviews', ['id'], unique=False)

    # Create course_views table
    op.create_table('course_views',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('viewed_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_course_views_id'), 'course_views', ['id'], unique=False)

    # Create lessons table
    op.create_table('lessons',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('lesson_type', lesson_type_enum, nullable=False),
        sa.Column('description', sa.TEXT(), nullable=True),
        sa.Column('responsible_id', sa.Integer(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=True),
        sa.Column('duration', sa.Interval(), server_default=sa.text("'0 minutes'::interval"), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['responsible_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_lessons_id'), 'lessons', ['id'], unique=False)

    # Create quizzes table
    op.create_table('quizzes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('order_index', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_quizzes_id'), 'quizzes', ['id'], unique=False)

    # Create lesson_attachments table
    op.create_table('lesson_attachments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('lesson_id', sa.Integer(), nullable=False),
        sa.Column('file_url', sa.String(length=500), nullable=True),
        sa.Column('external_url', sa.String(length=500), nullable=True),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_lesson_attachments_id'), 'lesson_attachments', ['id'], unique=False)

    # Create lesson_documents table
    op.create_table('lesson_documents',
        sa.Column('lesson_id', sa.Integer(), nullable=False),
        sa.Column('file_url', sa.String(length=500), nullable=False),
        sa.Column('allow_download', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('lesson_id')
    )

    # Create lesson_images table
    op.create_table('lesson_images',
        sa.Column('lesson_id', sa.Integer(), nullable=False),
        sa.Column('file_url', sa.String(length=500), nullable=False),
        sa.Column('allow_download', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('lesson_id')
    )

    # Create lesson_videos table
    op.create_table('lesson_videos',
        sa.Column('lesson_id', sa.Integer(), nullable=False),
        sa.Column('url', sa.String(length=500), nullable=False),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('lesson_id')
    )

    # Create quiz_questions table
    op.create_table('quiz_questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('quiz_id', sa.Integer(), nullable=False),
        sa.Column('question_text', sa.TEXT(), nullable=False),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('points_first', sa.Integer(), nullable=True),
        sa.Column('points_second', sa.Integer(), nullable=True),
        sa.Column('points_third', sa.Integer(), nullable=True),
        sa.Column('points_more', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['quiz_id'], ['quizzes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_quiz_questions_id'), 'quiz_questions', ['id'], unique=False)

    # Create quiz_attempts table
    op.create_table('quiz_attempts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('quiz_id', sa.Integer(), nullable=False),
        sa.Column('attempt_number', sa.Integer(), nullable=True),
        sa.Column('status', quiz_attempt_status_enum, nullable=True),
        sa.Column('started_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('completed_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('earned_points', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['quiz_id'], ['quizzes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_quiz_attempts_id'), 'quiz_attempts', ['id'], unique=False)

    # Create user_lesson_progress table
    op.create_table('user_lesson_progress',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('lesson_id', sa.Integer(), nullable=False),
        sa.Column('status', lesson_status_enum, nullable=True),
        sa.Column('completed_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('time_spent', sa.Interval(), server_default=sa.text("'0 minutes'::interval"), nullable=True),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'lesson_id')
    )
    op.create_index(op.f('ix_user_lesson_progress_id'), 'user_lesson_progress', ['id'], unique=False)

    # Create question_options table
    op.create_table('question_options',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('option_text', sa.TEXT(), nullable=False),
        sa.Column('is_correct', sa.Boolean(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['question_id'], ['quiz_questions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_question_options_id'), 'question_options', ['id'], unique=False)

    # Create quiz_attempt_answers table
    op.create_table('quiz_attempt_answers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('attempt_id', sa.Integer(), nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('selected_option_id', sa.Integer(), nullable=False),
        sa.Column('is_correct', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['attempt_id'], ['quiz_attempts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['question_id'], ['quiz_questions.id'], ),
        sa.ForeignKeyConstraint(['selected_option_id'], ['question_options.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_quiz_attempt_answers_id'), 'quiz_attempt_answers', ['id'], unique=False)


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index(op.f('ix_quiz_attempt_answers_id'), table_name='quiz_attempt_answers')
    op.drop_table('quiz_attempt_answers')
    
    op.drop_index(op.f('ix_question_options_id'), table_name='question_options')
    op.drop_table('question_options')
    
    op.drop_index(op.f('ix_user_lesson_progress_id'), table_name='user_lesson_progress')
    op.drop_table('user_lesson_progress')
    
    op.drop_index(op.f('ix_quiz_attempts_id'), table_name='quiz_attempts')
    op.drop_table('quiz_attempts')
    
    op.drop_index(op.f('ix_quiz_questions_id'), table_name='quiz_questions')
    op.drop_table('quiz_questions')
    
    op.drop_table('lesson_videos')
    op.drop_table('lesson_images')
    op.drop_table('lesson_documents')
    
    op.drop_index(op.f('ix_lesson_attachments_id'), table_name='lesson_attachments')
    op.drop_table('lesson_attachments')
    
    op.drop_index(op.f('ix_quizzes_id'), table_name='quizzes')
    op.drop_table('quizzes')
    
    op.drop_index(op.f('ix_lessons_id'), table_name='lessons')
    op.drop_table('lessons')
    
    op.drop_index(op.f('ix_course_views_id'), table_name='course_views')
    op.drop_table('course_views')
    
    op.drop_index(op.f('ix_course_reviews_id'), table_name='course_reviews')
    op.drop_table('course_reviews')
    
    op.drop_index(op.f('ix_course_enrollments_id'), table_name='course_enrollments')
    op.drop_table('course_enrollments')
    
    op.drop_index(op.f('ix_user_badges_id'), table_name='user_badges')
    op.drop_table('user_badges')
    
    op.drop_index(op.f('ix_courses_id'), table_name='courses')
    op.drop_table('courses')
    
    op.drop_index(op.f('ix_badges_id'), table_name='badges')
    op.drop_table('badges')
    
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    
    # Drop ENUM types with existence checks
    connection = op.get_bind()
    enum_names = [
        'quiz_attempt_status',
        'enrollment_status', 
        'lesson_status',
        'access_type',
        'visibility_type',
        'lesson_type',
        'user_role'
    ]
    
    for enum_name in enum_names:
        # Check if enum exists before dropping
        result = connection.execute(
            sa.text("SELECT 1 FROM pg_type WHERE typname = :enum_name"),
            {"enum_name": enum_name}
        ).fetchone()
        
        if result:
            connection.execute(sa.text(f"DROP TYPE {enum_name}"))