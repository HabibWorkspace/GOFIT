"""Add supplement inventory tables

Revision ID: 024_add_supplement_inventory
Revises: 023_add_settings_fields
Create Date: 2026-04-22

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '024_add_supplement_inventory'
down_revision = '023_add_settings_fields'
branch_labels = None
depends_on = None


def upgrade():
    # Create suppliers table
    op.create_table(
        'suppliers',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('contact', sa.String(100), nullable=True),
        sa.Column('address', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    
    # Create supplements table
    op.create_table(
        'supplements',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('brand', sa.String(100), nullable=True),
        sa.Column('category', sa.String(50), nullable=True),
        sa.Column('supplier_id', sa.String(36), sa.ForeignKey('suppliers.id'), nullable=True),
        sa.Column('purchase_price', sa.Numeric(10, 2), nullable=False),
        sa.Column('selling_price', sa.Numeric(10, 2), nullable=False),
        sa.Column('current_stock', sa.Integer, nullable=False, server_default='0'),
        sa.Column('low_stock_threshold', sa.Integer, nullable=False, server_default='5'),
        sa.Column('unit', sa.String(20), nullable=False, server_default='unit'),
        sa.Column('expiry_date', sa.Date, nullable=True),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Create supplement_stock table
    op.create_table(
        'supplement_stock',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('supplement_id', sa.String(36), sa.ForeignKey('supplements.id'), nullable=False),
        sa.Column('movement_type', sa.Enum('purchase', 'sale', 'adjustment', 'expired', name='movementtype'), nullable=False),
        sa.Column('quantity', sa.Integer, nullable=False),
        sa.Column('unit_price', sa.Numeric(10, 2), nullable=False),
        sa.Column('total_amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('reference_id', sa.String(36), nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_by', sa.String(36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    
    # Create supplement_sales table
    op.create_table(
        'supplement_sales',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('supplement_id', sa.String(36), sa.ForeignKey('supplements.id'), nullable=False),
        sa.Column('member_id', sa.String(36), sa.ForeignKey('member_profiles.id'), nullable=True),
        sa.Column('quantity', sa.Integer, nullable=False),
        sa.Column('unit_price', sa.Numeric(10, 2), nullable=False),
        sa.Column('total_amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('profit', sa.Numeric(10, 2), nullable=False),
        sa.Column('payment_method', sa.String(20), nullable=False, server_default='cash'),
        sa.Column('sold_by', sa.String(36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('sold_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    
    # Create indexes for better query performance
    op.create_index('idx_supplements_category', 'supplements', ['category'])
    op.create_index('idx_supplements_is_active', 'supplements', ['is_active'])
    op.create_index('idx_supplements_expiry_date', 'supplements', ['expiry_date'])
    op.create_index('idx_supplement_stock_supplement_id', 'supplement_stock', ['supplement_id'])
    op.create_index('idx_supplement_stock_created_at', 'supplement_stock', ['created_at'])
    op.create_index('idx_supplement_sales_supplement_id', 'supplement_sales', ['supplement_id'])
    op.create_index('idx_supplement_sales_member_id', 'supplement_sales', ['member_id'])
    op.create_index('idx_supplement_sales_sold_at', 'supplement_sales', ['sold_at'])


def downgrade():
    # Drop indexes
    op.drop_index('idx_supplement_sales_sold_at', 'supplement_sales')
    op.drop_index('idx_supplement_sales_member_id', 'supplement_sales')
    op.drop_index('idx_supplement_sales_supplement_id', 'supplement_sales')
    op.drop_index('idx_supplement_stock_created_at', 'supplement_stock')
    op.drop_index('idx_supplement_stock_supplement_id', 'supplement_stock')
    op.drop_index('idx_supplements_expiry_date', 'supplements')
    op.drop_index('idx_supplements_is_active', 'supplements')
    op.drop_index('idx_supplements_category', 'supplements')
    
    # Drop tables
    op.drop_table('supplement_sales')
    op.drop_table('supplement_stock')
    op.drop_table('supplements')
    op.drop_table('suppliers')
