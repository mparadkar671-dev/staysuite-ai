"""FastAPI router for bookings and OTA webhook integration."""
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.security import TokenPayload, get_current_token
from app.modules.bookings.models import Booking
from app.modules.bookings.schemas import BookingOut, OTAIngestRequest, OTAIngestResponse
from app.modules.bookings.service import BookingsService
from app.modules.properties.models import Property

router = APIRouter(prefix="", tags=["Bookings & OTA Webhooks"])


@router.post(
    "/webhooks/ota-ingest",
    response_model=OTAIngestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest unpaid OTA (Booking.com) reservations and trigger WhatsApp advance payment link",
)
async def ota_ingest(
    req: OTAIngestRequest,
    x_property_id: str | None = Header(None, alias="X-Property-Id"),
    x_property_slug: str | None = Header(None, alias="X-Property-Slug"),
    session: AsyncSession = Depends(get_session),
) -> OTAIngestResponse:
    """Webhook endpoint for Booking.com (Email parser / iCal bridge / Channex).
    Marks status as PENDING_ADVANCE, calculates 50% UPI advance requirement,
    and returns the WhatsApp dispatch payload with payment & food acknowledgment URLs."""
    prop_id = req.property_id
    if not prop_id and x_property_id:
        try:
            prop_id = uuid.UUID(x_property_id)
        except ValueError:
            pass

    if not prop_id and x_property_slug:
        p = (
            await session.execute(select(Property).where(Property.slug == x_property_slug))
        ).scalar_one_or_none()
        if p:
            prop_id = p.id

    if not prop_id:
        # Fallback to the first property in database
        first_prop = (await session.execute(select(Property))).scalars().first()
        if first_prop:
            prop_id = first_prop.id
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Property identification required via body, X-Property-Id, or X-Property-Slug header",
            )

    try:
        return await BookingsService.ingest_ota_booking(
            session=session,
            property_id=prop_id,
            req=req,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e


@router.get(
    "/bookings",
    response_model=list[BookingOut],
    summary="List bookings for authenticated property",
)
async def list_bookings(
    auth: TokenPayload = Depends(get_current_token),
    session: AsyncSession = Depends(get_session),
) -> list[BookingOut]:
    stmt = select(Booking).where(
        Booking.property_id == auth.property_id,
        Booking.is_deleted.is_(False),
    ).order_by(Booking.check_in_date.desc())
    res = await session.execute(stmt)
    return list(res.scalars().all())
