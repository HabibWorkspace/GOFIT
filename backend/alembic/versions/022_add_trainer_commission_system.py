"""Add trainer commission system

Revision ID: 022
Revises: 021
Create Date: 2026-04-18 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '022'
down_revision = '021'
branch_labels = None
depends_on = None


def upgrade():
    # Check if tables exist before creating
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Add commission fields to trainer_profiles table
    if 'trainer_profiles' in inspector.get_table_names():
        existing_columns = [col['name'] for col in inspector.get_columns('trainer_profiles')]
        
        if 'monthly_charge' not in existing_columns:
            op.add_column('trainer_profiles', sa.Column('monthly_charge', sa.Numeric(10, 2), nullable=False, server_default='0'))
        
        if 'gym_commission_percent' not in existing_columns:
            op.add_column('trainer_profiles', sa.Column('gym_commission_percent', sa.Numeric(5, 2), nullable=False, server_default='50.00'))
        
        if 'trainer_commission_percent' not in existing_columns:
            op.add_column('trainer_profiles', sa.Column('trainer_commission_percent', sa.Numeric(5, 2), nullable=False, server_default='50.00'))
        
        if 'bank_account' not in existing_columns:
            op.add_column('trainer_profiles', sa.Column('bank_account', sa.String(100), nullable=True))
        
        if 'joining_date' not in existing_columns:
            op.add_column('trainer_profiles', sa.Column('joining_date', sa.Date, nullable=True))
    
    # Create trainer_member_charges table
    if 'trainer_member_charges' not in inspector.get_table_names():
        op.create_table('trainer_member_charges',
            sa.Column('id', sa.String(36), nullable=False),
            sa.Column('trainer_id', sa.String(36), nullable=False),
            sa.Column('member_id', sa.String(36), nullable=False),
            sa.Column('monthly_charge', sa.Numeric(10, 2), nullable=False),
            sa.Column('gym_cut', sa.Numeric(10, 2), nullable=False),
            sa.Column('trainer_cut', sa.Numeric(10, 2), nullable=False),
            sa.Column('month_year', sa.Date, nullable=False),
            sa.Column('payment_status', sa.String(20), nullable=False),
            sa.Column('amount_paid_by_member', sa.Numeric(10, 2), nullable=False, server_default='0'),
            sa.Column('trainer_paid', sa.Boolean, nullable=False, server_default='0'),
            sa.Column('trainer_paid_date', sa.Date, nullable=True),
            sa.Column('created_at', sa.DateTime, nullable=False),
            sa.ForeignKeyConstraint(['trainer_id'], ['trainer_profiles.id']),
            sa.ForeignKeyConstraint(['member_id'], ['member_profiles.id']),
            sa.PrimaryKeyConstraint('id')
        )
        
        # Create indexes
        op.create_index('ix_trainer_member_charges_trainer_id', 'trainer_member_charges', ['trainer_id'])
        op.create_index('ix_trainer_member_charges_member_id', 'trainer_member_charges', ['member_id'])
        op.create_index('ix_trainer_member_charges_month_year', 'trainer_member_charges', ['month_year'])
    
    # Create trainer_salary_slips table
    if 'trainer_salary_slips' not in inspector.get_table_names():
        op.create_table('trainer_salary_slips',
            sa.Column('id', sa.String(36), nullable=False),
            sa.Column('trainer_id', sa.String(36), nullable=False),
            sa.Column('month_year', sa.Date, nullable=False),
            sa.Column('total_members_billed', sa.Integer, nullable=False, server_default='0'),
            sa.Column('total_charges', sa.Numeric(10, 2), nullable=False, server_default='0'),
            sa.Column('gym_total_cut', sa.Numeric(10, 2), nullable=False, server_default='0'),
            sa.Column('trainer_total_cut', sa.Numeric(10, 2), nullable=False, server_default='0'),
            sa.Column('amount_paid', sa.Numeric(10, 2), nullable=False, server_default='0'),
            sa.Column('payment_date', sa.Date, nullable=True),
            sa.Column('notes', sa.Text, nullable=True),
            sa.Column('generated_at', sa.DateTime, nullable=False),
            sa.Column('generated_by', sa.String(36), nullable=False),
            sa.ForeignKeyConstraint(['trainer_id'], ['trainer_profiles.id']),
            sa.ForeignKeyConstraint(['generated_by'], ['users.id']),
            sa.PrimaryKeyConstraint('id')
        )
        
        # Create indexes
        op.create_index('ix_trainer_salary_slips_trainer_id', 'trainer_salary_slips', ['trainer_id'])
        op.create_index('ix_trainer_salary_slips_month_year', 'trainer_salary_slips', ['month_year'])


def downgrade():
    # Drop indexes
    op.drop_index('ix_trainer_salary_slips_month_year', table_name='trainer_salary_slips')
    op.drop_index('ix_trainer_salary_slips_trainer_id', table_name='trainer_salary_slips')
    op.drop_index('ix_trainer_member_charges_month_year', table_name='trainer_member_charges')
    op.drop_index('ix_trainer_member_charges_member_id', table_name='trainer_member_charges')
    op.drop_index('ix_trainer_member_charges_trainer_id', table_name='trainer_member_charges')
    
    # Drop tables
    op.drop_table('trainer_salary_slips')
    op.drop_table('trainer_member_charges')
    
    # Remove columns from trainer_profiles
    op.drop_column('trainer_profiles', 'joining_date')
    op.drop_column('trainer_profiles', 'bank_account')
    op.drop_column('trainer_profiles', 'trainer_commission_percent')
    op.drop_column('trainer_profiles', 'gym_commission_percent')
    op.drop_column('trainer_profiles', 'monthly_charge')
