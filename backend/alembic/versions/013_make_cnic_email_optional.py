"""Make CNIC and email optional for members

Revision ID: 013_make_cnic_email_optional
Revises: 012_add_package_price
Create Date: 2026-02-16

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


# revision identifiers, used by Alembic.
revision = '013_make_cnic_email_optional'
down_revision = '012_add_package_price'
branch_labels = None
depends_on = None


def upgrade():
    # Get connection and check database type
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    
    # Check if we're using PostgreSQL or SQLite
    if conn.dialect.name == 'postgresql':
        # PostgreSQL syntax
        op.execute('ALTER TABLE member_profiles ALTER COLUMN cnic DROP NOT NULL;')
        op.execute('ALTER TABLE member_profiles ALTER COLUMN email DROP NOT NULL;')
        
        # Drop unique indexes
        op.execute('DROP INDEX IF EXISTS ix_member_profiles_cnic;')
        op.execute('DROP INDEX IF EXISTS ix_member_profiles_email;')
        
        # Recreate as non-unique indexes
        op.execute('CREATE INDEX IF NOT EXISTS ix_member_profiles_cnic ON member_profiles(cnic);')
        op.execute('CREATE INDEX IF NOT EXISTS ix_member_profiles_email ON member_profiles(email);')
    else:
        # SQLite - constraints were already fixed manually
        # Just ensure indexes exist
        try:
            op.create_index('ix_member_profiles_cnic', 'member_profiles', ['cnic'], unique=False)
        except:
            pass
        try:
            op.create_index('ix_member_profiles_email', 'member_profiles', ['email'], unique=False)
        except:
            pass


def downgrade():
    # Get connection and check database type
    conn = op.get_bind()
    
    if conn.dialect.name == 'postgresql':
        # Revert changes using raw SQL
        op.execute('DROP INDEX IF EXISTS ix_member_profiles_email;')
        op.execute('DROP INDEX IF EXISTS ix_member_profiles_cnic;')
        
        # Recreate as unique indexes
        op.execute('CREATE UNIQUE INDEX ix_member_profiles_cnic ON member_profiles(cnic);')
        op.execute('CREATE UNIQUE INDEX ix_member_profiles_email ON member_profiles(email);')
        
        # Make columns NOT NULL again
        op.execute('ALTER TABLE member_profiles ALTER COLUMN cnic SET NOT NULL;')
        op.execute('ALTER TABLE member_profiles ALTER COLUMN email SET NOT NULL;')
    else:
        # SQLite - cannot easily revert
        pass
