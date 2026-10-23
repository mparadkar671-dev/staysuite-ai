"""FastAPI router for Dining, Menu Catalog, Pre-orders & Market Procurement."""
import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.enums import MealSlot, Role
from app.core.security import TokenPayload, get_current_token, require_roles
from app.modules.dining_bom.models import MenuItem
from app.modules.dining_bom.schemas import (
    CreateFoodOrderRequest,
    FoodOrderOut,
    MarketProcurementResponse,
    MenuItemOut,
)
from app.modules.dining_bom.service import DiningBOMService

router = APIRouter(prefix="/dining", tags=["Dining & Kitchen BOM"])

_DINING_ROLES = (Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER, Role.STAFF)
_PROCURE_ROLES = (Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER)


@router.get(
    "/menu",
    response_model=list[MenuItemOut],
    summary="Get unified dining menu catalog",
)
async def get_menu(
    category: str | None = Query(None, description="Filter by menu category"),
    only_available: bool = Query(True, description="Filter only available items"),
    auth: TokenPayload = Depends(get_current_token),
    session: AsyncSession = Depends(get_session),
) -> list[MenuItemOut]:
    stmt = select(MenuItem).where(
        MenuItem.property_id == auth.property_id,
        MenuItem.is_deleted.is_(False),
    )
    if only_available:
        stmt = stmt.where(MenuItem.is_available.is_(True))
    if category:
        stmt = stmt.where(MenuItem.category == category)
    stmt = stmt.order_by(MenuItem.sort_order, MenuItem.name)
    res = await session.execute(stmt)
    return list(res.scalars().all())


@router.post(
    "/orders",
    response_model=FoodOrderOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create food order with 24h pre-arrival / 4h in-stay cut-off enforcement",
)
async def create_food_order(
    req: CreateFoodOrderRequest,
    is_pre_arrival: bool = Query(False, description="True if guest has not checked in yet"),
    auth: TokenPayload = Depends(get_current_token),
    session: AsyncSession = Depends(get_session),
) -> FoodOrderOut:
    # Staff cannot perform manager override
    if req.is_manager_override and auth.role == Role.STAFF:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff cannot perform manager override on kitchen cut-off times",
        )

    try:
        return await DiningBOMService.create_food_order(
            session=session,
            property_id=auth.property_id,
            req=req,
            user_id=auth.user_id,
            is_pre_arrival=is_pre_arrival,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e)) from e


@router.get(
    "/market-procurement",
    response_model=MarketProcurementResponse,
    summary="Deterministic recipe BOM market calculator grouped by Fish/Meat and Veg Market",
)
async def get_market_procurement(
    date: date = Query(..., description="Target order date (YYYY-MM-DD)"),
    slot: MealSlot | None = Query(None, description="Optional meal slot (BREAKFAST, LUNCH, SNACKS, DINNER)"),
    auth: TokenPayload = Depends(require_roles(*_PROCURE_ROLES)),
    session: AsyncSession = Depends(get_session),
) -> MarketProcurementResponse:
    """Uses exact PostgreSQL arithmetic (Confirmed Orders × Recipe BOM Weight - Current Kitchen Stock)
    to generate the morning market shopping list grouped by Fish/Meat Market and Veg Market."""
    return await DiningBOMService.get_market_procurement(
        session=session,
        property_id=auth.property_id,
        order_date=date,
        slot=slot,
    )
