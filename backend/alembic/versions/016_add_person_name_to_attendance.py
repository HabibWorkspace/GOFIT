"""add person_name to attendance_records

Revision ID: 016
Revises: 015_add_biometric_attendance_tables
Create Date: 2026-03-28 17:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '016'
down_revision = '015_add_biometric_attendance_tables'
branch_labels = None
depends_on = None


def upgrade():
    # Add person_name column to attendance_records table
    op.add_column('attendance_records', sa.Column('person_name', sa.String(100), nullable=True))


def downgrade():
    # Remove person_name column from attendance_records table
    op.drop_column('attendance_records', 'person_name')
