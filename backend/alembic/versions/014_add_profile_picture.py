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
    # Add profile_picture column as TEXT (for base64 images)
    op.execute('ALTER TABLE member_profiles ADD COLUMN profile_picture TEXT;')


def downgrade():
    # Remove profile_picture column
    op.execute('ALTER TABLE member_profiles DROP COLUMN profile_picture;')
