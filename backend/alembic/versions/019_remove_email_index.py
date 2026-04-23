"""Remove email index from member_profiles

Revision ID: 019
Revises: 018
Create Date: 2026-04-14

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '019'
down_revision = '018'
branch_labels = None
depends_on = None


def upgrade():
    """Remove email index from member_profiles table."""
    # Drop the index if it exists
    with op.batch_alter_table('member_profiles', schema=None) as batch_op:
        try:
            batch_op.drop_index('ix_member_profiles_email')
        except:
            # Index might not exist, that's okay
            pass


def downgrade():
    """Add email index back to member_profiles table."""
    with op.batch_alter_table('member_profiles', schema=None) as batch_op:
        batch_op.create_index('ix_member_profiles_email', ['email'], unique=False)
