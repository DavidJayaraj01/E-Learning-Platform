"""Add tab_switches column to quiz_attempts table

Revision ID: add_tab_switches
Revises: add_rag_tables
Create Date: 2024-02-08

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_tab_switches'
down_revision = 'add_rag_tables'
branch_labels = None
depends_on = None


def upgrade():
    # Add tab_switches column to quiz_attempts table
    op.add_column('quiz_attempts', 
        sa.Column('tab_switches', sa.Integer(), nullable=True, server_default='0')
    )


def downgrade():
    # Remove tab_switches column
    op.drop_column('quiz_attempts', 'tab_switches')
