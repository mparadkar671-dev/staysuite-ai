"""add_room_categories_and_offers

Revision ID: f5a6b7c8d9e0
Revises: e4f5a6b7c8d9
Create Date: 2026-10-23 23:45:00.000000
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = 'f5a6b7c8d9e0'
down_revision: str | None = 'e4f5a6b7c8d9'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Create room_categories table
    op.create_table(
        'room_categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('property_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False),
        sa.Column('category_name', sa.String(length=120), nullable=False),
        sa.Column('stay_template_type', sa.String(length=64), server_default='STANDARD_ROOM', nullable=False),
        sa.Column('has_ac', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('base_tariff_ac', sa.Numeric(precision=10, scale=2), server_default='3000.00', nullable=False),
        sa.Column('allow_guest_non_ac_toggle', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('base_tariff_non_ac', sa.Numeric(precision=10, scale=2), server_default='2200.00', nullable=False),
        sa.Column('weekend_surge_percent', sa.Numeric(precision=5, scale=2), server_default='0.00', nullable=False),
        sa.Column('base_occupancy_adults', sa.Integer(), server_default='2', nullable=False),
        sa.Column('max_occupancy', sa.Integer(), server_default='4', nullable=False),
        sa.Column('extra_mattress_charge', sa.Numeric(precision=10, scale=2), server_default='500.00', nullable=False),
        sa.Column('driver_stay_free', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('amenities_config', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False),
        sa.Column('media_config', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_room_categories_tenant_updated', 'room_categories', ['property_id', 'updated_at'])

    # 2. Add category_id and floor_label to rooms
    op.add_column('rooms', sa.Column('category_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('room_categories.id', ondelete='SET NULL'), nullable=True))
    op.add_column('rooms', sa.Column('floor_label', sa.String(length=64), nullable=True))
    op.create_index('ix_rooms_category_id', 'rooms', ['category_id'])

    # 3. Create seasonal_offers table
    op.create_table(
        'seasonal_offers',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('property_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('room_categories.id', ondelete='CASCADE'), nullable=True),
        sa.Column('offer_title', sa.String(length=160), nullable=False),
        sa.Column('badge_tag', sa.String(length=64), server_default='SPECIAL OFFER', nullable=False),
        sa.Column('discount_type', sa.String(length=32), server_default='PERCENTAGE', nullable=False),
        sa.Column('discount_value', sa.Numeric(precision=10, scale=2), server_default='20.00', nullable=False),
        sa.Column('valid_from', sa.Date(), nullable=False),
        sa.Column('valid_to', sa.Date(), nullable=False),
        sa.Column('min_nights', sa.Integer(), server_default='1', nullable=False),
        sa.Column('weekdays_only', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_seasonal_offers_tenant_updated', 'seasonal_offers', ['property_id', 'updated_at'])


def downgrade() -> None:
    op.drop_table('seasonal_offers')
    op.drop_column('rooms', 'floor_label')
    op.drop_column('rooms', 'category_id')
    op.drop_table('room_categories')
