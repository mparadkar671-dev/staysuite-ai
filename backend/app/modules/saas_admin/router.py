"""Super Admin control plane endpoints (Pillar 1 - Main Business Model)."""
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.enums import Role
from app.core.security import Principal, require_roles
from app.modules.saas_admin import service
from app.modules.saas_admin.schemas import (
    PlatformAnalyticsOut,
    PropertyStatusUpdate,
    SuperAdminPropertyItem,
)

router = APIRouter(prefix="/superadmin", tags=["superadmin"])


@router.get("/analytics", response_model=PlatformAnalyticsOut)
async def platform_analytics(
    session: AsyncSession = Depends(get_session),
    # In dev/demo, can be accessed or gated by SUPER_ADMIN/OWNER
):
    """Platform Revenue, MRR, Profit/Loss, and Listing Performance analytics."""
    return await service.get_platform_analytics(session)


@router.get("/properties", response_model=list[SuperAdminPropertyItem])
async def list_properties(session: AsyncSession = Depends(get_session)):
    """List all registered properties with plan, status, and resolved capabilities."""
    return await service.list_all_properties(session)


@router.patch("/properties/{property_id}/status")
async def update_property_status(
    property_id: uuid.UUID,
    update: PropertyStatusUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Global Kill-Switch: Suspend, close, or freeze property and toggle modules."""
    return await service.update_property_status(session, property_id, update)
