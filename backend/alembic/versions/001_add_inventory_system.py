"""add inventory system models

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create base tables first if they don't exist
    # User table
    op.execute("""
        CREATE TABLE IF NOT EXISTS "user" (
            id SERIAL PRIMARY KEY,
            telegram_id INTEGER UNIQUE NOT NULL,
            first_name VARCHAR,
            last_name VARCHAR,
            username VARCHAR,
            photo_url VARCHAR,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
        );
        CREATE INDEX IF NOT EXISTS ix_user_telegram_id ON "user"(telegram_id);
    """)
    
    # Business table
    op.execute("""
        CREATE TABLE IF NOT EXISTS business (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES "user"(id),
            name VARCHAR NOT NULL,
            tax_id VARCHAR,
            address VARCHAR,
            phone VARCHAR,
            email VARCHAR,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
        );
    """)
    
    # Create product table
    op.create_table(
        'product',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('business_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('sku', sa.String(), nullable=True),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('unit_of_measure', sa.String(), nullable=False, server_default='pcs'),
        sa.Column('buying_price', sa.Float(), nullable=False),
        sa.Column('selling_price', sa.Float(), nullable=False),
        sa.Column('low_stock_threshold', sa.Float(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['business_id'], ['business.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_product_business_id'), 'product', ['business_id'], unique=False)
    
    # Create stockitem table (inventory stock)
    op.create_table(
        'stockitem',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False, server_default='0'),
        sa.Column('location', sa.String(), nullable=False, server_default='main'),
        sa.Column('last_updated', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['product.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_stockitem_product_id'), 'stockitem', ['product_id'], unique=False)
    
    # Create inventorymovement table
    op.create_table(
        'inventorymovement',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('movement_type', sa.String(), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('reference', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['product_id'], ['product.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inventorymovement_product_id'), 'inventorymovement', ['product_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_inventorymovement_product_id'), table_name='inventorymovement')
    op.drop_table('inventorymovement')
    op.drop_index(op.f('ix_stockitem_product_id'), table_name='stockitem')
    op.drop_table('stockitem')
    op.drop_index(op.f('ix_product_business_id'), table_name='product')
    op.drop_table('product')


