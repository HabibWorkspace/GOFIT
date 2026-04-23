"""Add attendance system tables and card_id to members

Revision ID: 018
Revises: 017
Create Date: 2026-04-14 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '018'
down_revision = '017'
branch_labels = None
depends_on = None


def upgrade():
    # Add card_id to member_profiles table
    op.add_column('member_profiles', sa.Column('card_id', sa.String(length=20), nullable=True))
    op.create_index(op.f('ix_member_profiles_card_id'), 'member_profiles', ['card_id'], unique=True)
    
    # Create attendance table
    op.create_table('attendance',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('member_id', sa.String(length=36), nullable=False),
        sa.Column('check_in_time', sa.DateTime(), nullable=False),
        sa.Column('door', sa.Integer(), nullable=False),
        sa.Column('direction', sa.String(length=10), nullable=False),
        sa.Column('method', sa.String(length=20), nullable=False),
        sa.Column('synced_from_controller', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['member_id'], ['member_profiles.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_attendance_member_id'), 'attendance', ['member_id'], unique=False)
    op.create_index(op.f('ix_attendance_check_in_time'), 'attendance', ['check_in_time'], unique=False)
    
    # Create bridge_heartbeat table
    op.create_table('bridge_heartbeat',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('last_seen', sa.DateTime(), nullable=False),
        sa.Column('pc_ip', sa.String(length=20), nullable=False),
        sa.Column('records_synced_today', sa.Integer(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create unknown_cards table
    op.create_table('unknown_cards',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('card_id', sa.String(length=20), nullable=False),
        sa.Column('door', sa.Integer(), nullable=False),
        sa.Column('direction', sa.String(length=10), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('first_seen', sa.DateTime(), nullable=False),
        sa.Column('last_seen', sa.DateTime(), nullable=False),
        sa.Column('scan_count', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_unknown_cards_card_id'), 'unknown_cards', ['card_id'], unique=False)


def downgrade():
    # Drop tables
    op.drop_index(op.f('ix_unknown_cards_card_id'), table_name='unknown_cards')
    op.drop_table('unknown_cards')
    op.drop_table('bridge_heartbeat')
    op.drop_index(op.f('ix_attendance_check_in_time'), table_name='attendance')
    op.drop_index(op.f('ix_attendance_member_id'), table_name='attendance')
    op.drop_table('attendance')
    
    # Remove card_id from member_profiles
    op.drop_index(op.f('ix_member_profiles_card_id'), table_name='member_profiles')
    op.drop_column('member_profiles', 'card_id')
