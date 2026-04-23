"""Re-add plain password column to users table.

Revision ID: 026_readd_plain_password
Revises: 025_add_member_extended_fields
Create Date: 2026-04-23 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '026_readd_plain_password'
down_revision = '025_add_member_extended_fields'
branch_labels = None
depends_on = None


def upgrade():
    # Re-add plain text password column for member login display
    # This was removed in migration 003 but is now needed for member portal
    op.add_column('users', sa.Column('password', sa.String(255), nullable=True))


def downgrade():
    # Remove plain text password column
    op.drop_column('users', 'password')
