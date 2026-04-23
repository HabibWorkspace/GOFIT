"""Add scanner role to userrole enum

Revision ID: 020
Revises: 019
Create Date: 2026-04-15

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '020'
down_revision = '019'
branch_labels = None
depends_on = None


def upgrade():
    """Add scanner role to userrole enum."""
    # For SQLite, we need to recreate the table with the new enum
    # SQLite doesn't support ALTER TYPE directly
    
    # Get the database connection
    connection = op.get_bind()
    
    # Check if we're using SQLite
    if connection.dialect.name == 'sqlite':
        # SQLite approach: Add the role value directly
        # SQLite stores enums as strings, so we just need to ensure the constraint allows it
        # The Python enum in models/user.py already has SCANNER, so no DB change needed for SQLite
        pass
    else:
        # PostgreSQL approach: Alter the enum type
        op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'scanner'")


def downgrade():
    """Remove scanner role from userrole enum."""
    # Note: PostgreSQL doesn't support removing enum values easily
    # This is a one-way migration for PostgreSQL
    # For SQLite, no action needed
    pass
