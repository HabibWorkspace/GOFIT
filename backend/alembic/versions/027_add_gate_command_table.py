"""Add gate_commands table for remote turnstile control

Revision ID: 027
Revises: 026
Create Date: 2026-04-28 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision = '027'
down_revision = '026'
branch_labels = None
depends_on = None


def upgrade():
    """Add gate_commands table."""
    op.create_table(
        'gate_commands',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('member_id', sa.String(36), sa.ForeignKey('member_profiles.id'), nullable=True),
        sa.Column('door', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('triggered_by', sa.String(20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('executed_at', sa.DateTime(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
    )
    
    # Create indexes for performance
    op.create_index('ix_gate_commands_member_id', 'gate_commands', ['member_id'])
    op.create_index('ix_gate_commands_status', 'gate_commands', ['status'])
    op.create_index('ix_gate_commands_created_at', 'gate_commands', ['created_at'])


def downgrade():
    """Remove gate_commands table."""
    op.drop_index('ix_gate_commands_created_at', 'gate_commands')
    op.drop_index('ix_gate_commands_status', 'gate_commands')
    op.drop_index('ix_gate_commands_member_id', 'gate_commands')
    op.drop_table('gate_commands')
