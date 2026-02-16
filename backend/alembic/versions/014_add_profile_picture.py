"""Add profile_picture to member_profiles

Revision ID: 014_add_profile_picture
Revises: 013_make_cnic_email_optional
Create Date: 2026-02-16

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '014_add_profile_picture'
down_revision = '013_make_cnic_email_optional'
branch_labels = None
depends_on = None


def upgrade():
    # Check if column already exists before adding
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('member_profiles')]
    
    if 'profile_picture' not in columns:
        # Add profile_picture column as TEXT (for base64 images)
        op.add_column('member_profiles', sa.Column('profile_picture', sa.Text(), nullable=True))


def downgrade():
    # Remove profile_picture column
    op.drop_column('member_profiles', 'profile_picture')
