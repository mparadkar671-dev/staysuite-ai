"""add_saas_admin_superadmin_tables

Revision ID: a1b2c3d4e5f6
Revises: f5a6b7c8d9e0
Create Date: 2026-10-24 18:30:00.000000
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = 'a1b2c3d4e5f6'
down_revision: str | None = 'f5a6b7c8d9e0'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. saas_subscription_plans
    op.create_table(
        'saas_subscription_plans',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('plan_code', sa.String(length=40), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('billing_interval', sa.String(length=20), server_default='MONTHLY', nullable=False),
        sa.Column('base_price_inr', sa.Numeric(precision=10, scale=2), server_default='0.00', nullable=False),
        sa.Column('annual_discount_percent', sa.Numeric(precision=5, scale=2), server_default='15.00', nullable=False),
        sa.Column('standard_setup_fee_inr', sa.Numeric(precision=10, scale=2), server_default='5000.00', nullable=False),
        sa.Column('standard_amc_rate_inr', sa.Numeric(precision=10, scale=2), server_default='3000.00', nullable=False),
        sa.Column('trial_days', sa.Integer(), server_default='30', nullable=False),
        sa.Column('default_features', postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False),
        sa.Column('max_rooms', sa.Integer(), server_default='50', nullable=False),
        sa.Column('max_staff_accounts', sa.Integer(), server_default='20', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('is_public', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('sort_order', sa.Integer(), server_default='0', nullable=False),
        sa.Column('is_deleted', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('sync_status', sa.String(length=16), server_default='SYNCED', nullable=False),
        sa.Column('client_updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('plan_code', name='uq_saas_subscription_plans_plan_code'),
    )
    op.create_index('ix_saas_plans_is_active', 'saas_subscription_plans', ['is_active'])
    op.create_index('ix_saas_plans_code', 'saas_subscription_plans', ['plan_code'])

    # 2. property_subscriptions
    op.create_table(
        'property_subscriptions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('property_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False),
        sa.Column('plan_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('saas_subscription_plans.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('status', sa.String(length=32), server_default='TRIAL_ACTIVE', nullable=False),
        sa.Column('billing_cycle', sa.String(length=20), server_default='MONTHLY', nullable=False),
        sa.Column('current_period_start', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('current_period_end', sa.DateTime(timezone=True), nullable=False),
        sa.Column('trial_ends_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('base_price_inr', sa.Numeric(precision=10, scale=2), server_default='0.00', nullable=False),
        sa.Column('custom_discount_inr', sa.Numeric(precision=10, scale=2), server_default='0.00', nullable=False),
        sa.Column('final_recurring_inr', sa.Numeric(precision=10, scale=2), server_default='0.00', nullable=False),
        sa.Column('setup_fee_inr', sa.Numeric(precision=10, scale=2), server_default='5000.00', nullable=False),
        sa.Column('setup_fee_waived', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('amc_rate_inr', sa.Numeric(precision=10, scale=2), server_default='3000.00', nullable=False),
        sa.Column('auto_renew', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('payment_method', sa.String(length=50), server_default='UPI_DIRECT', nullable=False),
        sa.Column('gateway_subscription_id', sa.String(length=100), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('sync_status', sa.String(length=16), server_default='SYNCED', nullable=False),
        sa.Column('client_updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_prop_subs_property_id', 'property_subscriptions', ['property_id'])
    op.create_index('ix_prop_subs_status', 'property_subscriptions', ['status'])

    # 3. property_feature_overrides
    op.create_table(
        'property_feature_overrides',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('property_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False),
        sa.Column('feature_key', sa.String(length=64), nullable=False),
        sa.Column('is_enabled', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('reason', sa.String(length=255), nullable=True),
        sa.Column('granted_by_user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('property_id', 'feature_key', name='uq_prop_feature_override'),
    )
    op.create_index('ix_prop_feature_property_id', 'property_feature_overrides', ['property_id'])

    # 4. saas_conditional_discounts
    op.create_table(
        'saas_conditional_discounts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('discount_code', sa.String(length=50), nullable=True, unique=True),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('deal_type', sa.String(length=40), nullable=False),
        sa.Column('target_property_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('properties.id', ondelete='CASCADE'), nullable=True),
        sa.Column('target_business_category', sa.String(length=40), nullable=True),
        sa.Column('discount_mode', sa.String(length=30), server_default='PERCENTAGE', nullable=False),
        sa.Column('discount_value', sa.Numeric(precision=10, scale=2), server_default='0.00', nullable=False),
        sa.Column('override_setup_fee_inr', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('override_amc_inr', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('override_recurring_inr', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('referrer_property_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('properties.id', ondelete='SET NULL'), nullable=True),
        sa.Column('referred_property_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('properties.id', ondelete='SET NULL'), nullable=True),
        sa.Column('valid_from', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('valid_to', sa.DateTime(timezone=True), nullable=True),
        sa.Column('max_redemptions', sa.Integer(), server_default='100', nullable=False),
        sa.Column('current_redemptions', sa.Integer(), server_default='0', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('admin_notes', sa.Text(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('sync_status', sa.String(length=16), server_default='SYNCED', nullable=False),
        sa.Column('client_updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_discounts_deal_type', 'saas_conditional_discounts', ['deal_type'])
    op.create_index('ix_discounts_code', 'saas_conditional_discounts', ['discount_code'])
    op.create_index('ix_discounts_target_prop', 'saas_conditional_discounts', ['target_property_id'])

    # 5. saas_discount_redemptions
    op.create_table(
        'saas_discount_redemptions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('discount_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('saas_conditional_discounts.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('property_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False),
        sa.Column('deal_type', sa.String(length=40), nullable=False),
        sa.Column('original_amount_inr', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('discount_deduction_inr', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('final_billed_inr', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('applied_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('applied_by_user_id', postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index('ix_discount_redemptions_prop', 'saas_discount_redemptions', ['property_id'])

    # 6. property_audit_actions
    op.create_table(
        'property_audit_actions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('property_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False),
        sa.Column('action', sa.String(length=40), nullable=False),
        sa.Column('previous_status', sa.String(length=40), nullable=True),
        sa.Column('new_status', sa.String(length=40), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('performed_by_user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('performed_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_audit_property_id', 'property_audit_actions', ['property_id'])
    op.create_index('ix_audit_performed_at', 'property_audit_actions', ['performed_at'])

    # 7. Add missing sync columns to existing tables
    for table_name in ['property_onboarding_applications', 'room_categories', 'seasonal_offers']:
        op.add_column(table_name, sa.Column('sync_status', sa.String(length=16), server_default='SYNCED', nullable=False))
        op.add_column(table_name, sa.Column('client_updated_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    for table_name in ['property_onboarding_applications', 'room_categories', 'seasonal_offers']:
        op.drop_column(table_name, 'client_updated_at')
        op.drop_column(table_name, 'sync_status')

    op.drop_table('property_audit_actions')
    op.drop_table('saas_discount_redemptions')
    op.drop_table('saas_conditional_discounts')
    op.drop_table('property_feature_overrides')
    op.drop_table('property_subscriptions')
    op.drop_table('saas_subscription_plans')
