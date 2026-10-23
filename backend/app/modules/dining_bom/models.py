"""Inventory, the unified menu catalog and the recipe Bill-of-Materials."""
import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, Date, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint, false, true
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base, TenantMixin, enum_column, tenant_index
from app.core.enums import FoodOrderStatus, InventoryCategory, MarketGroup, MealSlot, MenuCategory

_ZERO = Decimal("0")


class InventoryItem(TenantMixin, Base):
    __tablename__ = "inventory_items"
    __table_args__ = (
        UniqueConstraint("property_id", "name", name="uq_inventory_items_property_name"),
        tenant_index("inventory_items"),
    )

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    category: Mapped[InventoryCategory] = enum_column(InventoryCategory, nullable=False)
    market_group: Mapped[MarketGroup] = enum_column(MarketGroup, nullable=False, default=MarketGroup.NONE)
    unit: Mapped[str] = mapped_column(String(16), nullable=False, default="kg")
    current_stock_qty: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False, default=_ZERO)
    min_threshold_qty: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False, default=_ZERO)
    last_purchase_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=true())


class MenuItem(TenantMixin, Base):
    """Single catalog consumed by the POS billing screen and the guest web menu."""

    __tablename__ = "menu_items"
    __table_args__ = (tenant_index("menu_items"),)

    name: Mapped[str] = mapped_column(String(160), nullable=False)
    name_local: Mapped[str | None] = mapped_column(String(160))  # Marathi / Hindi display name
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[MenuCategory] = enum_column(MenuCategory, nullable=False, default=MenuCategory.VEG)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    tax_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=_ZERO)
    is_veg: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    # Fresh-prep dishes obey the 24h / 4h cut-off; instant snacks are always orderable.
    is_fresh_prep: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_instant_snack: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=false())
    is_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=true())
    image_url: Mapped[str | None] = mapped_column(Text)
    prep_minutes: Mapped[int | None] = mapped_column(Integer)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class RecipeBom(TenantMixin, Base):
    """Quantity of one inventory item consumed by one serving of a menu item."""

    __tablename__ = "recipe_bom"
    __table_args__ = (
        UniqueConstraint("menu_item_id", "inventory_item_id", name="uq_recipe_bom_menu_inventory"),
        tenant_index("recipe_bom"),
    )

    menu_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("menu_items.id"), nullable=False, index=True
    )
    inventory_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("inventory_items.id"), nullable=False, index=True
    )
    qty_per_serving: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)


class FoodOrder(TenantMixin, Base):
    """Guest pre-orders or KOT room orders for a specific date and meal slot."""

    __tablename__ = "food_orders"
    __table_args__ = (tenant_index("food_orders"),)

    booking_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("bookings.id"), index=True
    )
    allocation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("booking_room_allocations.id"), index=True
    )
    room_number: Mapped[str | None] = mapped_column(String(16))
    guest_name: Mapped[str] = mapped_column(String(160), nullable=False)
    order_date: Mapped[date] = mapped_column(Date, nullable=False)
    meal_slot: Mapped[MealSlot] = enum_column(MealSlot, nullable=False, default=MealSlot.LUNCH)
    status: Mapped[FoodOrderStatus] = enum_column(
        FoodOrderStatus, nullable=False, default=FoodOrderStatus.CONFIRMED
    )
    is_manager_override: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=false()
    )
    override_by_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=_ZERO)
    notes: Mapped[str | None] = mapped_column(Text)

    items: Mapped[list["FoodOrderItem"]] = relationship(
        "FoodOrderItem", back_populates="order", cascade="all, delete-orphan", lazy="selectin"
    )


class FoodOrderItem(TenantMixin, Base):
    """Line items inside a FoodOrder."""

    __tablename__ = "food_order_items"
    __table_args__ = (tenant_index("food_order_items"),)

    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("food_orders.id"), nullable=False, index=True
    )
    menu_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("menu_items.id"), nullable=False, index=True
    )
    item_name: Mapped[str] = mapped_column(String(160), nullable=False)
    qty: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("1"))
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=_ZERO)
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=_ZERO)
    notes: Mapped[str | None] = mapped_column(String(200))

    order: Mapped[FoodOrder] = relationship("FoodOrder", back_populates="items")

