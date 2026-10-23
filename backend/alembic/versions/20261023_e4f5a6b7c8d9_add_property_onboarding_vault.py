"""add_property_onboarding_vault

Revision ID: e4f5a6b7c8d9
Revises: d1e2f3a4b5c6
Create Date: 2026-10-23 22:30:00.000000
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = 'e4f5a6b7c8d9'
down_revision: str | None = 'd1e2f3a4b5c6'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Add onboarding & verification columns to properties
    op.add_column('properties', sa.Column('verification_status', sa.String(length=32), server_default='PROVISIONAL_ACTIVE', nullable=False))
    op.add_column('properties', sa.Column('latitude', sa.Numeric(precision=10, scale=7), nullable=True))
    op.add_column('properties', sa.Column('longitude', sa.Numeric(precision=10, scale=7), nullable=True))
    op.add_column('properties', sa.Column('google_maps_url', sa.String(length=500), nullable=True))
    op.add_column('properties', sa.Column('police_station_jurisdiction', sa.String(length=160), nullable=True))
    op.add_column('properties', sa.Column('accessibility_metadata', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False))
    op.add_column('properties', sa.Column('operational_policies', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False))
    op.add_column('properties', sa.Column('category_licenses', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False))
    op.add_column('properties', sa.Column('owner_pan_number', sa.String(length=20), nullable=True))

    # 2. Create property_onboarding_applications table
    op.create_table(
        'property_onboarding_applications',
        sa.Column('property_id', sa.UUID(), nullable=True),
        sa.Column('business_code', sa.String(length=32), nullable=False),
        sa.Column('business_category', sa.String(length=32), nullable=False),
        sa.Column('property_name', sa.String(length=160), nullable=False),
        sa.Column('slug', sa.String(length=80), nullable=False),
        sa.Column('owner_full_name', sa.String(length=160), nullable=False),
        sa.Column('owner_mobile', sa.String(length=20), nullable=False),
        sa.Column('owner_whatsapp', sa.String(length=20), nullable=True),
        sa.Column('owner_email', sa.String(length=200), nullable=False),
        sa.Column('is_mobile_verified', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('is_email_verified', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('password_hash', sa.String(length=120), nullable=False),
        sa.Column('formatted_address', sa.Text(), nullable=False),
        sa.Column('street_landmark', sa.String(length=200), nullable=True),
        sa.Column('village_city', sa.String(length=100), nullable=False),
        sa.Column('taluka', sa.String(length=100), nullable=True),
        sa.Column('district', sa.String(length=100), nullable=True),
        sa.Column('state', sa.String(length=100), server_default='Maharashtra', nullable=False),
        sa.Column('pincode', sa.String(length=12), nullable=False),
        sa.Column('latitude', sa.Numeric(precision=10, scale=7), nullable=True),
        sa.Column('longitude', sa.Numeric(precision=10, scale=7), nullable=True),
        sa.Column('google_maps_url', sa.String(length=500), nullable=True),
        sa.Column('police_station_jurisdiction', sa.String(length=160), nullable=True),
        sa.Column('accessibility_metadata', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False),
        sa.Column('owner_pan_number', sa.String(length=20), nullable=False),
        sa.Column('owner_pan_doc_url', sa.String(length=500), nullable=True),
        sa.Column('owner_gov_id_type', sa.String(length=50), server_default='AADHAAR_REDACTED', nullable=False),
        sa.Column('owner_gov_id_masked_display', sa.String(length=50), server_default='[Aadhaar Redacted]', nullable=False),
        sa.Column('owner_gov_id_doc_url', sa.String(length=500), nullable=True),
        sa.Column('property_ownership_proof_type', sa.String(length=50), nullable=True),
        sa.Column('property_ownership_doc_url', sa.String(length=500), nullable=True),
        sa.Column('category_licenses', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False),
        sa.Column('merchant_upi_vpa', sa.String(length=100), nullable=False),
        sa.Column('bank_account_holder', sa.String(length=160), nullable=True),
        sa.Column('bank_account_number', sa.String(length=60), nullable=True),
        sa.Column('bank_ifsc', sa.String(length=20), nullable=True),
        sa.Column('cancelled_cheque_url', sa.String(length=500), nullable=True),
        sa.Column('is_gst_registered', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('gstin_number', sa.String(length=20), nullable=True),
        sa.Column('operational_policies', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False),
        sa.Column('subscription_plan', sa.String(length=32), server_default='30_DAY_FREE_TRIAL', nullable=False),
        sa.Column('status', sa.String(length=32), server_default='PROVISIONAL_ACTIVE', nullable=False),
        sa.Column('admin_notes', sa.Text(), nullable=True),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('verified_by_user_id', sa.UUID(), nullable=True),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('business_code', name='uq_onboarding_business_code'),
        sa.UniqueConstraint('slug', name='uq_onboarding_slug')
    )
    op.create_index('ix_onboarding_status', 'property_onboarding_applications', ['status'])
    op.create_index('ix_onboarding_owner_mobile', 'property_onboarding_applications', ['owner_mobile'])
    op.create_index('ix_onboarding_property_id', 'property_onboarding_applications', ['property_id'])

    # 3. Create property_license_documents table
    op.create_table(
        'property_license_documents',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('application_id', sa.UUID(), nullable=False),
        sa.Column('property_id', sa.UUID(), nullable=True),
        sa.Column('document_type', sa.String(length=60), nullable=False),
        sa.Column('document_number', sa.String(length=100), nullable=True),
        sa.Column('file_url', sa.String(length=500), nullable=False),
        sa.Column('expiry_date', sa.Date(), nullable=True),
        sa.Column('is_verified', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['application_id'], ['property_onboarding_applications.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_property_license_documents_app_id', 'property_license_documents', ['application_id'])
    op.create_index('ix_property_license_documents_prop_id', 'property_license_documents', ['property_id'])


def downgrade() -> None:
    op.drop_table('property_license_documents')
    op.drop_table('property_onboarding_applications')
    op.drop_column('properties', 'owner_pan_number')
    op.drop_column('properties', 'category_licenses')
    op.drop_column('properties', 'operational_policies')
    op.drop_column('properties', 'accessibility_metadata')
    op.drop_column('properties', 'police_station_jurisdiction')
    op.drop_column('properties', 'google_maps_url')
    op.drop_column('properties', 'longitude')
    op.drop_column('properties', 'latitude')
    op.drop_column('properties', 'verification_status')
