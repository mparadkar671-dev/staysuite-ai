"""FastAPI router for POS billing, partial room checkout, and customer Khata."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.enums import Role
from app.core.security import TokenPayload, require_roles
from app.modules.billing_pos.models import CustomerKhata
from app.modules.billing_pos.schemas import (
    CustomerKhataOut,
    FolioOut,
    MoveToKhataRequest,
    MoveToKhataResponse,
    PartialCheckoutRequest,
    PartialCheckoutResponse,
)
from app.modules.billing_pos.service import BillingPOSService
from app.modules.bookings.models import Folio

router = APIRouter(prefix="/folios", tags=["Billing & POS"])
khata_router = APIRouter(prefix="/khatas", tags=["Customer Khata Ledger"])

_POS_ROLES = (Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER)


@router.post(
    "/{allocation_id}/partial-checkout",
    response_model=PartialCheckoutResponse,
    status_code=status.HTTP_200_OK,
    summary="Perform partial checkout on a single room allocation",
)
async def partial_checkout(
    allocation_id: uuid.UUID,
    req: PartialCheckoutRequest,
    auth: TokenPayload = Depends(require_roles(*_POS_ROLES)),
    session: AsyncSession = Depends(get_session),
) -> PartialCheckoutResponse:
    """Calculates prorated AC/Non-AC nights, sums KOT food orders, applies extra person waivers,
    generates Dynamic UPI QR string, and marks that allocation CHECKED_OUT while keeping sibling rooms active."""
    try:
        return await BillingPOSService.partial_checkout(
            session=session,
            property_id=auth.property_id,
            user_id=auth.user_id,
            allocation_id=allocation_id,
            req=req,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e


@router.post(
    "/{folio_id}/move-to-khata",
    response_model=MoveToKhataResponse,
    status_code=status.HTTP_200_OK,
    summary="Move outstanding folio balance to customer Khata credit ledger",
)
async def move_to_khata(
    folio_id: uuid.UUID,
    req: MoveToKhataRequest,
    auth: TokenPayload = Depends(require_roles(*_POS_ROLES)),
    session: AsyncSession = Depends(get_session),
) -> MoveToKhataResponse:
    try:
        return await BillingPOSService.move_to_khata(
            session=session,
            property_id=auth.property_id,
            user_id=auth.user_id,
            folio_id=folio_id,
            req=req,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e


@router.get(
    "/{folio_id}",
    response_model=FolioOut,
    summary="Get folio details by ID",
)
async def get_folio(
    folio_id: uuid.UUID,
    auth: TokenPayload = Depends(require_roles(*_POS_ROLES)),
    session: AsyncSession = Depends(get_session),
) -> FolioOut:
    stmt = select(Folio).where(
        Folio.id == folio_id,
        Folio.property_id == auth.property_id,
        Folio.is_deleted.is_(False),
    )
    res = await session.execute(stmt)
    folio = res.scalar_one_or_none()
    if not folio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folio not found")
    return folio


@khata_router.get(
    "",
    response_model=list[CustomerKhataOut],
    summary="List all customer Khata credit accounts for the property",
)
async def list_khatas(
    phone: str | None = Query(None, description="Search by customer phone"),
    auth: TokenPayload = Depends(require_roles(*_POS_ROLES)),
    session: AsyncSession = Depends(get_session),
) -> list[CustomerKhataOut]:
    stmt = select(CustomerKhata).where(
        CustomerKhata.property_id == auth.property_id,
        CustomerKhata.is_deleted.is_(False),
    )
    if phone:
        stmt = stmt.where(CustomerKhata.customer_phone.like(f"%{phone}%"))
    stmt = stmt.order_by(CustomerKhata.updated_at.desc())
    res = await session.execute(stmt)
    return list(res.scalars().all())
