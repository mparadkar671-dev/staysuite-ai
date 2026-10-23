"""Declares which tables travel over the sync protocol and who may read/write what."""
from collections.abc import Callable, Mapping
from dataclasses import dataclass, field

from app.core.db import next_server_ts
from app.core.enums import KycIdType, Role
from app.modules.billing_pos.models import CustomerKhata, KhataEntry
from app.modules.bookings.models import Booking, BookingRoomAllocation, Folio
from app.modules.compliance_kyc.models import GuestKycRecord, masked_display_for, scrub_free_text
from app.modules.dining_bom.models import FoodOrder, FoodOrderItem, InventoryItem, MenuItem, RecipeBom
from app.modules.properties.models import Property, Room
from app.modules.staff_hr.models import StaffMember, StaffUpaadLedger

# Columns the server owns. Clients may include them in payloads; they are silently ignored.
SERVER_MANAGED = frozenset({"id", "property_id", "created_at", "updated_at", "is_deleted", "sync_status", "client_updated_at"})

_ALL_ROLES = frozenset({Role.OWNER, Role.MANAGER, Role.STAFF})
_OWNER_MANAGER = frozenset({Role.OWNER, Role.MANAGER})
_OWNER_ONLY = frozenset({Role.OWNER})

# A hook receives the coerced column values about to be written (mutated in place) and the
# existing row (None on insert). It may add/override server-controlled columns.
WriteHook = Callable[[dict, object | None], None]


@dataclass(frozen=True)
class TableSpec:
    name: str
    model: type
    read_roles: frozenset[Role] = _ALL_ROLES
    write_roles: frozenset[Role] = _OWNER_MANAGER
    allow_create: bool = True
    allow_delete: bool = True
    # Columns nobody can write through sync (admin/billing-controlled).
    readonly_columns: frozenset[str] = frozenset()
    # Roles listed here may only UPDATE the given columns (no create / delete).
    role_column_limits: Mapping[Role, frozenset[str]] = field(default_factory=dict)
    # Columns stripped from rows pulled by the given role.
    hidden_columns: Mapping[Role, frozenset[str]] = field(default_factory=dict)
    before_write: WriteHook | None = None

    @property
    def column_names(self) -> frozenset[str]:
        return frozenset(c.name for c in self.model.__table__.columns)

    @property
    def writable_columns(self) -> frozenset[str]:
        return self.column_names - SERVER_MANAGED - self.readonly_columns

    def writable_for(self, role: Role) -> frozenset[str]:
        limit = self.role_column_limits.get(role)
        return self.writable_columns & limit if limit is not None else self.writable_columns

    def is_limited(self, role: Role) -> bool:
        return role in self.role_column_limits


def _rooms_hook(values: dict, existing: object | None) -> None:
    if "housekeeping_status" in values:
        values["housekeeping_updated_at"] = next_server_ts()


def _kyc_hook(values: dict, existing: object | None) -> None:
    """Privacy guarantee: whatever the client sends, only a redacted label is ever stored."""
    id_type = values.get("id_type") or getattr(existing, "id_type", None) or KycIdType.OTHER
    values["masked_id_display"] = masked_display_for(KycIdType(id_type))
    for column in ("address", "purpose_of_visit", "arrived_from", "next_destination", "guest_name"):
        if isinstance(values.get(column), str):
            values[column] = scrub_free_text(values[column])


REGISTRY: dict[str, TableSpec] = {
    spec.name: spec
    for spec in (
        TableSpec(
            "properties",
            Property,
            allow_create=False,
            allow_delete=False,
            write_roles=_OWNER_MANAGER,
            # Plan/trial state is controlled by the SaaS admin module, never by devices.
            readonly_columns=frozenset({"plan_tier", "trial_ends_at", "slug"}),
            # Managers may use the emergency freeze switch but nothing else on the property.
            role_column_limits={Role.MANAGER: frozenset({"is_booking_frozen"})},
        ),
        TableSpec(
            "rooms",
            Room,
            write_roles=_ALL_ROLES,
            role_column_limits={Role.STAFF: frozenset({"housekeeping_status", "housekeeping_note"})},
            before_write=_rooms_hook,
        ),
        TableSpec("bookings", Booking, read_roles=_OWNER_MANAGER),
        TableSpec("booking_room_allocations", BookingRoomAllocation, read_roles=_OWNER_MANAGER),
        TableSpec("folios", Folio, read_roles=_OWNER_MANAGER),
        TableSpec("inventory_items", InventoryItem, read_roles=_OWNER_MANAGER),
        TableSpec("menu_items", MenuItem),
        TableSpec("recipe_bom", RecipeBom, read_roles=_OWNER_MANAGER),
        TableSpec(
            "guest_kyc_records",
            GuestKycRecord,
            hidden_columns={
                Role.MANAGER: frozenset({"id_document_key"}),
                Role.STAFF: frozenset({"id_document_key"}),
            },
            readonly_columns=frozenset({"masked_id_display"}),
            before_write=_kyc_hook,
        ),
        TableSpec("staff_members", StaffMember, read_roles=_OWNER_MANAGER, write_roles=_OWNER_ONLY),
        TableSpec("staff_upaad_ledger", StaffUpaadLedger, read_roles=_OWNER_MANAGER),
        TableSpec("customer_khatas", CustomerKhata, read_roles=_OWNER_MANAGER),
        TableSpec("khata_entries", KhataEntry, read_roles=_OWNER_MANAGER),
        TableSpec("food_orders", FoodOrder, read_roles=_ALL_ROLES, write_roles=_ALL_ROLES),
        TableSpec("food_order_items", FoodOrderItem, read_roles=_ALL_ROLES, write_roles=_ALL_ROLES),
    )
}
