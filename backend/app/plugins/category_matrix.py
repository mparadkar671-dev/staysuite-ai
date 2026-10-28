"""Multi-Category & Plan Entitlement Registry for Zero-Rewrite Conditional Category Programming.

Single unified codebase where modules (Rooms, Split POS Billing, Recipe BOM, Housekeeping QR,
Staff Payroll, Kirana Inventory) are conditionally enabled via runtime capability flags.
"""
from enum import StrEnum
from typing import Any


class BusinessCategory(StrEnum):
    HOMESTAY = "HOMESTAY"
    HOTEL = "HOTEL"
    RESORT = "RESORT"
    RESTAURANT = "RESTAURANT"
    BAR = "BAR"
    OTHER_SERVICES = "OTHER_SERVICES"


class FeatureModule(StrEnum):
    MOD_ROOMS_AC_TOGGLE = "MOD_ROOMS_AC_TOGGLE"
    MOD_FOOD_CUTOFF_BOM = "MOD_FOOD_CUTOFF_BOM"
    MOD_POS_SPLIT_BILLING = "MOD_POS_SPLIT_BILLING"
    MOD_KOT_WAITER = "MOD_KOT_WAITER"
    MOD_HOUSEKEEPING_QR = "MOD_HOUSEKEEPING_QR"
    MOD_EXPENSE_KIRANA = "MOD_EXPENSE_KIRANA"
    MOD_STAFF_UPAAD_LEAVE = "MOD_STAFF_UPAAD_LEAVE"
    MOD_POLICE_KYC_EXPORT = "MOD_POLICE_KYC_EXPORT"
    MOD_AI_COPILOT = "MOD_AI_COPILOT"
    MOD_PANORAMA_360 = "MOD_PANORAMA_360"
    MOD_360_PANORAMA = "MOD_360_PANORAMA"


# Default baseline module entitlements per category
CATEGORY_DEFAULT_MODULES: dict[BusinessCategory, set[FeatureModule]] = {
    BusinessCategory.HOMESTAY: {
        FeatureModule.MOD_ROOMS_AC_TOGGLE,
        FeatureModule.MOD_FOOD_CUTOFF_BOM,
        FeatureModule.MOD_POS_SPLIT_BILLING,
        FeatureModule.MOD_HOUSEKEEPING_QR,
        FeatureModule.MOD_EXPENSE_KIRANA,
        FeatureModule.MOD_STAFF_UPAAD_LEAVE,
        FeatureModule.MOD_POLICE_KYC_EXPORT,
        FeatureModule.MOD_AI_COPILOT,
        FeatureModule.MOD_PANORAMA_360,
    },
    BusinessCategory.RESORT: {
        FeatureModule.MOD_ROOMS_AC_TOGGLE,
        FeatureModule.MOD_FOOD_CUTOFF_BOM,
        FeatureModule.MOD_POS_SPLIT_BILLING,
        FeatureModule.MOD_KOT_WAITER,
        FeatureModule.MOD_HOUSEKEEPING_QR,
        FeatureModule.MOD_EXPENSE_KIRANA,
        FeatureModule.MOD_STAFF_UPAAD_LEAVE,
        FeatureModule.MOD_POLICE_KYC_EXPORT,
        FeatureModule.MOD_AI_COPILOT,
        FeatureModule.MOD_PANORAMA_360,
    },
    BusinessCategory.HOTEL: {
        FeatureModule.MOD_ROOMS_AC_TOGGLE,
        FeatureModule.MOD_POS_SPLIT_BILLING,
        FeatureModule.MOD_KOT_WAITER,
        FeatureModule.MOD_HOUSEKEEPING_QR,
        FeatureModule.MOD_EXPENSE_KIRANA,
        FeatureModule.MOD_STAFF_UPAAD_LEAVE,
        FeatureModule.MOD_POLICE_KYC_EXPORT,
        FeatureModule.MOD_AI_COPILOT,
    },
    BusinessCategory.RESTAURANT: {
        FeatureModule.MOD_KOT_WAITER,
        FeatureModule.MOD_POS_SPLIT_BILLING,
        FeatureModule.MOD_EXPENSE_KIRANA,
        FeatureModule.MOD_STAFF_UPAAD_LEAVE,
        FeatureModule.MOD_AI_COPILOT,
    },
    BusinessCategory.BAR: {
        FeatureModule.MOD_KOT_WAITER,
        FeatureModule.MOD_POS_SPLIT_BILLING,
        FeatureModule.MOD_EXPENSE_KIRANA,
        FeatureModule.MOD_STAFF_UPAAD_LEAVE,
    },
    BusinessCategory.OTHER_SERVICES: {
        FeatureModule.MOD_POS_SPLIT_BILLING,
        FeatureModule.MOD_EXPENSE_KIRANA,
        FeatureModule.MOD_STAFF_UPAAD_LEAVE,
    },
}

# Plan-gated entitlements (limits or tier restrictions)
PLAN_ENTITLEMENT_GATES: dict[str, set[FeatureModule]] = {
    "TRIAL": set(FeatureModule),  # 30-day full access
    "STANDARD": {
        FeatureModule.MOD_ROOMS_AC_TOGGLE,
        FeatureModule.MOD_POS_SPLIT_BILLING,
        FeatureModule.MOD_HOUSEKEEPING_QR,
        FeatureModule.MOD_STAFF_UPAAD_LEAVE,
    },
    "PREMIUM": set(FeatureModule),
    "ENTERPRISE": set(FeatureModule),
}


def resolve_features(
    category: str | BusinessCategory,
    subscription_plan: str = "TRIAL",
    custom_overrides: dict[str, bool] | None = None,
) -> set[str]:
    """Combines business_category defaults + plan gate restrictions + Super Admin overrides."""
    try:
        cat_enum = BusinessCategory(category)
    except ValueError:
        cat_enum = BusinessCategory.HOMESTAY

    # 1. Start with category baseline
    modules = set(m.value for m in CATEGORY_DEFAULT_MODULES.get(cat_enum, set()))

    # 2. Intersect with plan permissions (unless TRIAL or ENTERPRISE)
    plan_upper = subscription_plan.upper()
    if plan_upper in PLAN_ENTITLEMENT_GATES:
        allowed = set(m.value for m in PLAN_ENTITLEMENT_GATES[plan_upper])
        modules = modules.intersection(allowed)

    # 3. Apply custom Super Admin per-property overrides
    if custom_overrides:
        for feat, is_enabled in custom_overrides.items():
            if is_enabled:
                modules.add(feat)
                if feat in ("MOD_PANORAMA_360", "MOD_360_PANORAMA"):
                    modules.add("MOD_PANORAMA_360")
                    modules.add("MOD_360_PANORAMA")
            else:
                modules.discard(feat)
                if feat in ("MOD_PANORAMA_360", "MOD_360_PANORAMA"):
                    modules.discard("MOD_PANORAMA_360")
                    modules.discard("MOD_360_PANORAMA")

    # Harmonize aliases only if not explicitly revoked
    is_pano_disabled = bool(
        custom_overrides
        and (
            custom_overrides.get("MOD_360_PANORAMA") is False
            or custom_overrides.get("MOD_PANORAMA_360") is False
        )
    )
    if not is_pano_disabled:
        if "MOD_PANORAMA_360" in modules or "MOD_360_PANORAMA" in modules:
            modules.add("MOD_PANORAMA_360")
            modules.add("MOD_360_PANORAMA")

    return modules


def has_feature(enabled_features: set[str] | list[str], feature_key: str | FeatureModule) -> bool:
    """Checks whether a specific capability flag is active for the tenant."""
    key = feature_key.value if isinstance(feature_key, FeatureModule) else str(feature_key)
    return key in enabled_features


CATEGORY_ROLES: dict[BusinessCategory, list[str]] = {
    BusinessCategory.HOMESTAY: [
        "OWNER",
        "MANAGER",
        "STAFF_HOUSEKEEPING",
        "COOK",
        "HELPER",
        "ACCOUNTANT",
    ],
    BusinessCategory.HOTEL: [
        "OWNER",
        "MANAGER",
        "STAFF_HOUSEKEEPING",
        "WAITER",
        "COOK",
        "HELPER",
        "ACCOUNTANT",
    ],
    BusinessCategory.RESORT: [
        "OWNER",
        "MANAGER",
        "STAFF_HOUSEKEEPING",
        "WAITER",
        "COOK",
        "HELPER",
        "ACCOUNTANT",
    ],
    BusinessCategory.RESTAURANT: [
        "OWNER",
        "MANAGER",
        "WAITER",
        "COOK",
        "HELPER",
        "ACCOUNTANT",
    ],
    BusinessCategory.BAR: [
        "OWNER",
        "MANAGER",
        "WAITER",
        "COOK",
        "HELPER",
        "ACCOUNTANT",
    ],
    BusinessCategory.OTHER_SERVICES: [
        "OWNER",
        "MANAGER",
        "HELPER",
        "ACCOUNTANT",
    ],
}


def get_roles_for_category(category: str | BusinessCategory) -> list[str]:
    """Returns the list of active operational roles for this business category."""
    try:
        cat_enum = BusinessCategory(category)
    except ValueError:
        cat_enum = BusinessCategory.HOMESTAY
    return CATEGORY_ROLES.get(cat_enum, CATEGORY_ROLES[BusinessCategory.HOMESTAY])
