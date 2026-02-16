"""Make CNIC and email optional for members

Revision ID: 013_make_cnic_email_optional
Revises: 012_add_package_price
Create Date: 2026-02-16

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '013_make_cnic_email_optional'
down_revision = '012_add_package_price'
branch_labels = None
depends_on = None


def upgrade():
    # Make CNIC and email nullable and drop unique indexes
    with op.batch_alter_table('member_profiles', schema=None) as batch_op:
        batch_op.alter_column('cnic',
                              existing_type=sa.String(20),
                              nullable=True)
        batch_op.alter_column('email',
                              existing_type=sa.String(100),
                              nullable=True)
    
    # Drop unique indexes separately (works for both SQLite and PostgreSQL)
    try:
        op.drop_index('ix_member_profiles_cnic', table_name='member_profiles')
    except:
        pass
    
    try:
        op.drop_index('ix_member_profiles_email', table_name='member_profiles')
    except:
        pass
    
    # Recreate as non-unique indexes
    op.create_index('ix_member_profiles_cnic', 'member_profiles', ['cnic'], unique=False)
    op.create_index('ix_member_profiles_email', 'member_profiles', ['email'], unique=False)


def downgrade():
    # Revert changes
    # Drop non-unique indexes
    op.drop_index('ix_member_profiles_email', table_name='member_profiles')
    op.drop_index('ix_member_profiles_cnic', table_name='member_profiles')
    
    # Recreate as unique indexes
    op.create_index('ix_member_profiles_cnic', 'member_profiles', ['cnic'], unique=True)
    op.create_index('ix_member_profiles_email', 'member_profiles', ['email'], unique=True)
    
    with op.batch_alter_table('member_profiles', schema=None) as batch_op:
        batch_op.alter_column('cnic',
                              existing_type=sa.String(20),
                              nullable=False)
        batch_op.alter_column('email',
                              existing_type=sa.String(100),
                              nullable=False)
