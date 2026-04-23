"""Add extended member fields (father_name, weight_kg, blood_group, address).

Revision ID: 025_add_member_extended_fields
Revises: 024
Create Date: 2026-04-23 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '025_add_member_extended_fields'
down_revision = '024_add_supplement_inventory'
branch_labels = None
depends_on = None


def upgrade():
    # Add new fields to member_profiles table
    op.add_column('member_profiles', sa.Column('father_name', sa.String(100), nullable=True))
    op.add_column('member_profiles', sa.Column('weight_kg', sa.Numeric(5, 2), nullable=True))
    op.add_column('member_profiles', sa.Column('blood_group', sa.String(10), nullable=True))
    op.add_column('member_profiles', sa.Column('address', sa.Text, nullable=True))


def downgrade():
    # Remove the added fields
    op.drop_column('member_profiles', 'address')
    op.drop_column('member_profiles', 'blood_group')
    op.drop_column('member_profiles', 'weight_kg')
    op.drop_column('member_profiles', 'father_name')
