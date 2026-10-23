"""add_rbac_and_conditional_category_tables

Revision ID: d1e2f3a4b5c6
Revises: c0f4d198ecd6
Create Date: 2026-10-23 12:00:00.000000
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = 'd1e2f3a4b5c6'
down_revision: str | None = 'c0f4d198ecd6'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Properties updates
    op.add_column('properties', sa.Column('business_code', sa.String(length=32), nullable=True))
    op.add_column('properties', sa.Column('subscription_plan', sa.String(length=32), server_default='TRIAL', nullable=False))
    op.add_column('properties', sa.Column('status', sa.String(length=20), server_default='ACTIVE', nullable=False))
    op.add_column('properties', sa.Column('feature_overrides', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False))
    op.create_index('ix_properties_business_code', 'properties', ['business_code'], unique=True)

    # 2. Users updates
    op.add_column('users', sa.Column('staff_member_id', sa.UUID(), nullable=True))
    op.add_column('users', sa.Column('status', sa.String(length=32), server_default='ACTIVE', nullable=False))
    op.add_column('users', sa.Column('avatar', sa.String(length=255), nullable=True))
    op.create_index('ix_users_staff_member_id', 'users', ['staff_member_id'])

    # 3. Staff members updates
    op.add_column('staff_members', sa.Column('email', sa.String(length=200), nullable=True))
    op.add_column('staff_members', sa.Column('role', sa.String(length=40), server_default='STAFF_HOUSEKEEPING', nullable=False))
    op.add_column('staff_members', sa.Column('avatar', sa.String(length=255), nullable=True))
    op.add_column('staff_members', sa.Column('status', sa.String(length=32), server_default='ACTIVE', nullable=False))

    # 4. Staff tasks table
    op.create_table(
        'staff_tasks',
        sa.Column('staff_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('priority', sa.String(length=20), server_default='NORMAL', nullable=False),
        sa.Column('status', sa.String(length=20), server_default='PENDING', nullable=False),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('property_id', sa.UUID(), nullable=False),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['staff_id'], ['staff_members.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_staff_tasks_property_id', 'staff_tasks', ['property_id'])
    op.create_index('ix_staff_tasks_staff_id', 'staff_tasks', ['staff_id'])

    # 5. Staff leave requests table
    op.create_table(
        'staff_leave_requests',
        sa.Column('staff_id', sa.UUID(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('reason', sa.String(length=300), nullable=False),
        sa.Column('status', sa.String(length=20), server_default='PENDING', nullable=False),
        sa.Column('reviewed_by_user_id', sa.UUID(), nullable=True),
        sa.Column('review_note', sa.String(length=200), nullable=True),
        sa.Column('property_id', sa.UUID(), nullable=False),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['staff_id'], ['staff_members.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_staff_leave_requests_property_id', 'staff_leave_requests', ['property_id'])
    op.create_index('ix_staff_leave_requests_staff_id', 'staff_leave_requests', ['staff_id'])


def downgrade() -> None:
    op.drop_table('staff_leave_requests')
    op.drop_table('staff_tasks')
    op.drop_column('staff_members', 'status')
    op.drop_column('staff_members', 'avatar')
    op.drop_column('staff_members', 'role')
    op.drop_column('staff_members', 'email')
    op.drop_column('users', 'avatar')
    op.drop_column('users', 'status')
    op.drop_column('users', 'staff_member_id')
    op.drop_index('ix_properties_business_code', table_name='properties')
    op.drop_column('properties', 'feature_overrides')
    op.drop_column('properties', 'status')
    op.drop_column('properties', 'subscription_plan')
    op.drop_column('properties', 'business_code')
