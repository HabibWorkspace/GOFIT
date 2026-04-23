"""add settings fields

Revision ID: 023_add_settings_fields
Revises: 022
Create Date: 2026-04-18

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '023_add_settings_fields'
down_revision = '022'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to settings table
    op.add_column('settings', sa.Column('grace_period_days', sa.Integer(), nullable=False, server_default='3'))
    op.add_column('settings', sa.Column('trainer_commission_percent', sa.Integer(), nullable=False, server_default='50'))


def downgrade():
    # Remove columns
    op.drop_column('settings', 'trainer_commission_percent')
    op.drop_column('settings', 'grace_period_days')
