"""Dining BOM business logic: Meal cut-off validation & deterministic market procurement calculator."""
import uuid
from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import next_server_ts
from app.core.enums import FoodOrderStatus, MarketGroup, MealSlot
from app.modules.dining_bom.models import FoodOrder, FoodOrderItem, InventoryItem, MenuItem, RecipeBom
from app.modules.dining_bom.schemas import (
    CreateFoodOrderRequest,
    CutoffValidationResult,
    FoodOrderItemOut,
    FoodOrderOut,
    MarketProcurementItem,
    MarketProcurementResponse,
)
from app.modules.properties.models import Property

_ZERO = Decimal("0")

# Default slot start times in IST (UTC+5:30)
SLOT_TIMES: dict[MealSlot, time] = {
    MealSlot.BREAKFAST: time(8, 30),
    MealSlot.LUNCH: time(13, 0),
    MealSlot.SNACKS: time(17, 0),
    MealSlot.DINNER: time(20, 0),
}


class DiningBOMService:
    @staticmethod
    def validate_meal_cutoff(
        order_date: date,
        meal_slot: MealSlot,
        is_pre_arrival: bool,
        is_fresh_prep: bool,
        is_manager_override: bool = False,
        pre_arrival_cutoff_hours: int = 24,
        in_stay_cutoff_hours: int = 4,
        now: datetime | None = None,
    ) -> CutoffValidationResult:
        """Enforces 24-hour pre-arrival and 4-hour in-stay ordering windows for fresh-prep dishes.
        Instant snacks are exempt."""
        if not is_fresh_prep:
            return CutoffValidationResult(
                is_allowed=True,
                is_cutoff_passed=False,
                cutoff_deadline=datetime.max.replace(tzinfo=UTC),
                message="Instant snacks are exempt from meal prep cut-offs.",
            )

        now = now or datetime.now(UTC)
        slot_time = SLOT_TIMES.get(meal_slot, time(13, 0))
        # Meal target in UTC (approximating from local date/time)
        meal_target = datetime.combine(order_date, slot_time, tzinfo=UTC)

        cutoff_hours = pre_arrival_cutoff_hours if is_pre_arrival else in_stay_cutoff_hours
        deadline = meal_target - timedelta(hours=cutoff_hours)

        is_passed = now > deadline

        if is_passed and not is_manager_override:
            return CutoffValidationResult(
                is_allowed=False,
                is_cutoff_passed=True,
                cutoff_deadline=deadline,
                message="Fresh kitchen prep is closed for this slot — Request Manager Override OR View Instant Snacks.",
            )

        return CutoffValidationResult(
            is_allowed=True,
            is_cutoff_passed=is_passed,
            cutoff_deadline=deadline,
            message="Order is within prep cutoff window" if not is_passed else "Allowed via Manager Override.",
        )

    @staticmethod
    async def create_food_order(
        session: AsyncSession,
        property_id: uuid.UUID,
        req: CreateFoodOrderRequest,
        user_id: uuid.UUID | None = None,
        is_pre_arrival: bool = False,
    ) -> FoodOrderOut:
        """Validates cut-offs, prices items from the unified catalog, and persists the food order."""
        # 1. Fetch property config for cut-off hours
        prop_stmt = select(Property).where(Property.id == property_id)
        prop = (await session.execute(prop_stmt)).scalar_one()
        cfg = prop.business_config or {}
        pre_cutoff = cfg.get("pre_arrival_food_cutoff_hours", 24)
        in_cutoff = cfg.get("in_stay_food_cutoff_hours", 4)

        # 2. Fetch menu items
        menu_item_ids = [item.menu_item_id for item in req.items]
        stmt = select(MenuItem).where(
            MenuItem.id.in_(menu_item_ids),
            MenuItem.property_id == property_id,
            MenuItem.is_deleted.is_(False),
        )
        res = await session.execute(stmt)
        menu_map = {m.id: m for m in res.scalars().all()}

        has_fresh_prep = any(
            (
                getattr(menu_map[i.menu_item_id], "is_fresh_prep", True)
                and not getattr(menu_map[i.menu_item_id], "is_instant_snack", False)
            )
            for i in req.items
            if i.menu_item_id in menu_map
        )

        # 3. Validate cut-off
        cutoff_check = DiningBOMService.validate_meal_cutoff(
            order_date=req.order_date,
            meal_slot=req.meal_slot,
            is_pre_arrival=is_pre_arrival,
            is_fresh_prep=has_fresh_prep,
            is_manager_override=req.is_manager_override,
            pre_arrival_cutoff_hours=pre_cutoff,
            in_stay_cutoff_hours=in_cutoff,
        )
        if not cutoff_check.is_allowed:
            raise ValueError(cutoff_check.message)

        # 4. Create Order & Items
        order_id = uuid.uuid4()
        total_amount = _ZERO
        order_items: list[FoodOrderItem] = []
        out_items: list[FoodOrderItemOut] = []

        now = next_server_ts()
        for item_in in req.items:
            m = menu_map.get(item_in.menu_item_id)
            if not m:
                raise ValueError(f"Menu item {item_in.menu_item_id} not found")
            if not m.is_available:
                raise ValueError(f"Menu item '{m.name}' is currently marked unavailable")

            line_total = m.price * Decimal(item_in.qty)
            total_amount += line_total

            item_id = uuid.uuid4()
            order_item = FoodOrderItem(
                id=item_id,
                property_id=property_id,
                order_id=order_id,
                menu_item_id=m.id,
                item_name=m.name,
                qty=Decimal(item_in.qty),
                unit_price=m.price,
                total_price=line_total,
                notes=item_in.notes,
            )
            order_items.append(order_item)
            out_items.append(
                FoodOrderItemOut(
                    id=item_id,
                    menu_item_id=m.id,
                    name=m.name,
                    qty=item_in.qty,
                    unit_price=m.price,
                    total_price=line_total,
                    notes=item_in.notes,
                )
            )

        order = FoodOrder(
            id=order_id,
            property_id=property_id,
            booking_id=req.booking_id,
            allocation_id=req.allocation_id,
            room_number=req.room_number,
            guest_name=req.guest_name,
            order_date=req.order_date,
            meal_slot=req.meal_slot,
            status=FoodOrderStatus.CONFIRMED,
            is_manager_override=req.is_manager_override,
            override_by_user_id=user_id if req.is_manager_override else None,
            total_amount=total_amount,
            notes=req.notes,
            items=order_items,
        )
        session.add(order)
        await session.commit()

        return FoodOrderOut(
            id=order.id,
            booking_id=order.booking_id,
            allocation_id=order.allocation_id,
            room_number=order.room_number,
            guest_name=order.guest_name,
            order_date=order.order_date,
            meal_slot=order.meal_slot,
            status=order.status,
            is_manager_override=order.is_manager_override,
            total_amount=order.total_amount,
            notes=order.notes,
            items=out_items,
            created_at=order.created_at,
        )

    @staticmethod
    async def get_market_procurement(
        session: AsyncSession,
        property_id: uuid.UUID,
        order_date: date,
        slot: MealSlot | None = None,
    ) -> MarketProcurementResponse:
        """Deterministic SQL recipe BOM aggregation:
        SUM(order_qty * bom_qty_per_serving) - current_stock grouped by market groups."""
        # 1. Query gross required ingredients via join
        stmt = (
            select(
                InventoryItem.id.label("inventory_item_id"),
                InventoryItem.name.label("name"),
                InventoryItem.market_group.label("market_group"),
                InventoryItem.unit.label("unit"),
                InventoryItem.current_stock_qty.label("current_stock_qty"),
                InventoryItem.last_purchase_price.label("last_purchase_price"),
                func.sum(FoodOrderItem.qty * RecipeBom.qty_per_serving).label("gross_required_qty"),
            )
            .select_from(FoodOrder)
            .join(FoodOrderItem, FoodOrderItem.order_id == FoodOrder.id)
            .join(RecipeBom, RecipeBom.menu_item_id == FoodOrderItem.menu_item_id)
            .join(InventoryItem, InventoryItem.id == RecipeBom.inventory_item_id)
            .where(
                FoodOrder.property_id == property_id,
                FoodOrder.order_date == order_date,
                FoodOrder.status == FoodOrderStatus.CONFIRMED,
                FoodOrder.is_deleted.is_(False),
                FoodOrderItem.is_deleted.is_(False),
                RecipeBom.is_deleted.is_(False),
                InventoryItem.is_deleted.is_(False),
            )
        )

        if slot:
            stmt = stmt.where(FoodOrder.meal_slot == slot)

        stmt = stmt.group_by(
            InventoryItem.id,
            InventoryItem.name,
            InventoryItem.market_group,
            InventoryItem.unit,
            InventoryItem.current_stock_qty,
            InventoryItem.last_purchase_price,
        ).order_by(InventoryItem.name)

        rows = (await session.execute(stmt)).all()

        # Count total orders
        orders_cnt_stmt = select(func.count(FoodOrder.id)).where(
            FoodOrder.property_id == property_id,
            FoodOrder.order_date == order_date,
            FoodOrder.status == FoodOrderStatus.CONFIRMED,
            FoodOrder.is_deleted.is_(False),
        )
        if slot:
            orders_cnt_stmt = orders_cnt_stmt.where(FoodOrder.meal_slot == slot)
        total_orders = (await session.execute(orders_cnt_stmt)).scalar() or 0

        fish_meat_list: list[MarketProcurementItem] = []
        veg_list: list[MarketProcurementItem] = []
        kirana_list: list[MarketProcurementItem] = []
        total_cost = _ZERO

        for r in rows:
            gross = Decimal(str(r.gross_required_qty))
            in_stock = Decimal(str(r.current_stock_qty))
            net = max(_ZERO, gross - in_stock)
            price = Decimal(str(r.last_purchase_price)) if r.last_purchase_price else None
            est_cost = (net * price) if price is not None else None
            if est_cost is not None:
                total_cost += est_cost

            item = MarketProcurementItem(
                inventory_item_id=r.inventory_item_id,
                name=r.name,
                market_group=r.market_group,
                unit=r.unit,
                gross_required_qty=gross,
                current_stock_qty=in_stock,
                net_procure_qty=net,
                unit_price_estimate=price,
                estimated_cost=est_cost,
            )

            if r.market_group == MarketGroup.FISH_MEAT:
                fish_meat_list.append(item)
            elif r.market_group == MarketGroup.VEG_MARKET:
                veg_list.append(item)
            else:
                kirana_list.append(item)

        return MarketProcurementResponse(
            date=order_date,
            slot=slot,
            fish_meat_market=fish_meat_list,
            veg_market=veg_list,
            kirana_and_other=kirana_list,
            total_estimated_cost=total_cost,
            total_orders_counted=total_orders,
        )
