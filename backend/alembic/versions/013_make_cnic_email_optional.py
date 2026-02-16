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
    # Use raw SQL for PostgreSQL compatibility
    # Make CNIC and email nullable
    op.execute('ALTER TABLE member_profiles ALTER COLUMN cnic DROP NOT NULL;')
    op.execute('ALTER TABLE member_profiles ALTER COLUMN email DROP NOT NULL;')
    
    # Drop unique indexes
    op.execute('DROP INDEX IF EXISTS ix_member_profiles_cnic;')
    op.execute('DROP INDEX IF EXISTS ix_member_profiles_email;')
    
    # Recreate as non-unique indexes
    op.execute('CREATE INDEX IF NOT EXISTS ix_member_profiles_cnic ON member_profiles(cnic);')
    op.execute('CREATE INDEX IF NOT EXISTS ix_member_profiles_email ON member_profiles(email);')


def downgrade():
    # Revert changes using raw SQL
    op.execute('DROP INDEX IF EXISTS ix_member_profiles_email;')
    op.execute('DROP INDEX IF EXISTS ix_member_profiles_cnic;')
    
    # Recreate as unique indexes
    op.execute('CREATE UNIQUE INDEX ix_member_profiles_cnic ON member_profiles(cnic);')
    op.execute('CREATE UNIQUE INDEX ix_member_profiles_email ON member_profiles(email);')
    
    # Make columns NOT NULL again
    op.execute('ALTER TABLE member_profiles ALTER COLUMN cnic SET NOT NULL;')
    op.execute('ALTER TABLE member_profiles ALTER COLUMN email SET NOT NULL;')
