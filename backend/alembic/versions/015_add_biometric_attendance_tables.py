"""Add biometric attendance tables

Revision ID: 015_add_biometric_attendance_tables
Revises: 014_add_profile_picture
Create Date: 2026-02-17

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '015_add_biometric_attendance_tables'
down_revision = '014_add_profile_picture'
branch_labels = None
depends_on = None


def upgrade():
    # Create device_user_mappings table
    op.create_table(
        'device_user_mappings',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('device_user_id', sa.String(50), nullable=False),
        sa.Column('person_type', sa.String(10), nullable=False),
        sa.Column('person_id', sa.String(36), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('device_user_id', name='uq_device_user_id'),
        sa.UniqueConstraint('person_type', 'person_id', name='uq_person')
    )
    
    # Create index on device_user_id for fast lookups
    op.create_index('idx_device_user_id', 'device_user_mappings', ['device_user_id'])
    
    # Create attendance_records table
    op.create_table(
        'attendance_records',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('device_user_id', sa.String(50), nullable=False),
        sa.Column('person_type', sa.String(10), nullable=False),
        sa.Column('person_id', sa.String(36), nullable=False),
        sa.Column('check_in_time', sa.DateTime(), nullable=False),
        sa.Column('check_out_time', sa.DateTime(), nullable=True),
        sa.Column('stay_duration', sa.Integer(), nullable=True),
        sa.Column('device_serial', sa.String(50), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for performance optimization
    op.create_index('idx_attendance_device_user_id', 'attendance_records', ['device_user_id'])
    op.create_index('idx_attendance_person_id', 'attendance_records', ['person_id'])
    op.create_index('idx_attendance_check_in_time', 'attendance_records', ['check_in_time'])
    op.create_index('idx_attendance_person_type', 'attendance_records', ['person_type'])


def downgrade():
    # Drop attendance_records table and its indexes
    op.drop_index('idx_attendance_person_type', 'attendance_records')
    op.drop_index('idx_attendance_check_in_time', 'attendance_records')
    op.drop_index('idx_attendance_person_id', 'attendance_records')
    op.drop_index('idx_attendance_device_user_id', 'attendance_records')
    op.drop_table('attendance_records')
    
    # Drop device_user_mappings table and its indexes
    op.drop_index('idx_device_user_id', 'device_user_mappings')
    op.drop_table('device_user_mappings')
