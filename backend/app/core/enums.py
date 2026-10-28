"""Shared enumerations. Stored as VARCHAR (non-native enums) so migrations stay trivial."""
from enum import StrEnum


class Role(StrEnum):
    SUPER_ADMIN = "SUPER_ADMIN"
    OWNER = "OWNER"
    MANAGER = "MANAGER"
    STAFF_HOUSEKEEPING = "STAFF_HOUSEKEEPING"
    WAITER = "WAITER"
    COOK = "COOK"
    HELPER = "HELPER"
    ACCOUNTANT = "ACCOUNTANT"
    STAFF = "STAFF"


class BusinessCategory(StrEnum):
    HOMESTAY = "HOMESTAY"
    RESORT = "RESORT"
    HOTEL = "HOTEL"
    RESTAURANT = "RESTAURANT"
    BAR = "BAR"
    OTHER_SERVICES = "OTHER_SERVICES"


class StaffApprovalStatus(StrEnum):
    ACTIVE = "ACTIVE"
    PENDING_OWNER_APPROVAL = "PENDING_OWNER_APPROVAL"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"


class PlanTier(StrEnum):
    TRIAL = "TRIAL"
    STANDARD = "STANDARD"
    PREMIUM = "PREMIUM"
    ENTERPRISE = "ENTERPRISE"


class HousekeepingStatus(StrEnum):
    DIRTY = "DIRTY"            # dashboard: red
    IN_PROGRESS = "IN_PROGRESS"
    CLEAN = "CLEAN"            # dashboard: green
    ISSUE_REPORTED = "ISSUE_REPORTED"


class BookingStatus(StrEnum):
    PENDING_ADVANCE = "PENDING_ADVANCE"
    AWAITING_PAYMENT_VERIFICATION = "AWAITING_PAYMENT_VERIFICATION"
    CONFIRMED = "CONFIRMED"
    CHECKED_IN = "CHECKED_IN"
    PARTIALLY_CHECKED_OUT = "PARTIALLY_CHECKED_OUT"
    CHECKED_OUT = "CHECKED_OUT"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"


class BookingSource(StrEnum):
    DIRECT = "DIRECT"
    WALK_IN = "WALK_IN"
    BOOKING_COM = "BOOKING_COM"
    OTHER_OTA = "OTHER_OTA"
    PHONE = "PHONE"


class AllocationStatus(StrEnum):
    RESERVED = "RESERVED"
    CHECKED_IN = "CHECKED_IN"
    CHECKED_OUT = "CHECKED_OUT"
    CANCELLED = "CANCELLED"


class FolioStatus(StrEnum):
    OPEN = "OPEN"
    SETTLED = "SETTLED"
    MOVED_TO_KHATA = "MOVED_TO_KHATA"


class InventoryCategory(StrEnum):
    FISH_MEAT = "FISH_MEAT"
    VEGETABLES = "VEGETABLES"
    KIRANA = "KIRANA"
    ROOM_AMENITIES = "ROOM_AMENITIES"
    CLEANING_SUPPLIES = "CLEANING_SUPPLIES"
    PETROL = "PETROL"
    ELECTRICITY = "ELECTRICITY"
    WATER = "WATER"
    WIFI = "WIFI"
    LPG = "LPG"


class MarketGroup(StrEnum):
    FISH_MEAT = "FISH_MEAT"
    VEG_MARKET = "VEG_MARKET"
    KIRANA = "KIRANA"
    NONE = "NONE"


class MenuCategory(StrEnum):
    THALI = "THALI"
    SEAFOOD = "SEAFOOD"
    VEG = "VEG"
    NON_VEG = "NON_VEG"
    SNACK = "SNACK"
    BEVERAGE = "BEVERAGE"
    DESSERT = "DESSERT"
    LIQUOR = "LIQUOR"


class KycIdType(StrEnum):
    AADHAAR = "AADHAAR"
    PASSPORT = "PASSPORT"
    VOTER_ID = "VOTER_ID"
    DRIVING_LICENSE = "DRIVING_LICENSE"
    PAN = "PAN"
    OTHER = "OTHER"


class KycVerificationStatus(StrEnum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class PayModel(StrEnum):
    MONTHLY_FIXED = "MONTHLY_FIXED"
    DAILY_WAGE = "DAILY_WAGE"
    OFF_SEASON_PART_TIME = "OFF_SEASON_PART_TIME"
    PER_ROOM_BONUS = "PER_ROOM_BONUS"
    PEAK_SEASON_INTERN = "PEAK_SEASON_INTERN"


class UpaadEntryType(StrEnum):
    ADVANCE = "ADVANCE"      # cash advance given to the staff member
    DEDUCTION = "DEDUCTION"  # recovered from a payout


class MealSlot(StrEnum):
    BREAKFAST = "BREAKFAST"
    LUNCH = "LUNCH"
    SNACKS = "SNACKS"
    DINNER = "DINNER"


class FoodOrderStatus(StrEnum):
    CONFIRMED = "CONFIRMED"
    IN_PREP = "IN_PREP"
    SERVED = "SERVED"
    CANCELLED = "CANCELLED"
