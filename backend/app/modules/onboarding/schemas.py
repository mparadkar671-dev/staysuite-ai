"""Pydantic v2 schemas with conditional category validations for property onboarding."""
import re
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from app.core.enums import BusinessCategory

PAN_REGEX = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$")
PINCODE_REGEX = re.compile(r"^[1-9][0-9]{5}$")
UPI_VPA_REGEX = re.compile(r"^[\w\.\-]+@[\w\-]+$")
FSSAI_REGEX = re.compile(r"^[0-9]{14}$")
GSTIN_REGEX = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")


class SendOtpRequest(BaseModel):
    target: str = Field(..., description="Mobile number or Email address")
    channel: str = Field("MOBILE", description="'MOBILE' or 'EMAIL'")


class SendOtpResponse(BaseModel):
    status: str = "OTP_SENT"
    target: str
    channel: str
    demo_otp: str
    expires_in_minutes: int = 15


class VerifyOtpRequest(BaseModel):
    target: str
    otp: str


class VerifyOtpResponse(BaseModel):
    verified: bool
    target: str
    message: str


class UploadDocumentResponse(BaseModel):
    document_url: str
    file_name: str
    mime_type: str
    file_size_bytes: int


class PropertyOnboardingSubmitRequest(BaseModel):
    # Step 1: Category
    business_category: BusinessCategory = Field(..., description="HOMESTAY, HOTEL, RESORT, RESTAURANT, BAR, OTHER_SERVICES")

    # Step 2: Owner Identity & Verification
    property_name: str = Field(..., min_length=3, max_length=160)
    owner_full_name: str = Field(..., min_length=3, max_length=160)
    owner_mobile: str = Field(..., min_length=10, max_length=15)
    owner_whatsapp: str | None = None
    owner_email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    confirm_password: str | None = Field(None, min_length=6, max_length=100, description="Re-entered password for confirmation")

    # Step 3: Location & Google Maps Picker
    formatted_address: str = Field(..., min_length=5)
    street_landmark: str | None = None
    village_city: str = Field(..., min_length=2)
    taluka: str | None = None
    district: str | None = None
    state: str = "Maharashtra"
    pincode: str
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    google_maps_url: str | None = None
    police_station_jurisdiction: str | None = None
    accessibility_metadata: dict[str, Any] = Field(default_factory=dict)

    # Step 4: Owner KYC & Privacy Vault
    owner_pan_number: str
    owner_pan_doc_url: str | None = None
    owner_gov_id_type: str = Field("AADHAAR_REDACTED", description="AADHAAR_REDACTED, PASSPORT, DRIVING_LICENSE, VOTER_ID")
    owner_gov_id_masked_display: str = Field("[Aadhaar Redacted]", description="Must never contain raw 12 digits")
    owner_gov_id_doc_url: str | None = None
    property_ownership_proof_type: str = Field("GRAM_PANCHAYAT_TAX_RECEIPT", description="ELECTRICITY_BILL, GRAM_PANCHAYAT_TAX_RECEIPT, INDEX_II, LEASE_NOC")
    property_ownership_doc_url: str | None = None
    category_licenses: dict[str, Any] = Field(default_factory=dict)

    # Step 5: Payout UPI & Policies
    merchant_upi_vpa: str
    bank_account_holder: str | None = None
    bank_account_number: str | None = None
    bank_ifsc: str | None = None
    cancelled_cheque_url: str | None = None
    is_gst_registered: bool = False
    gstin_number: str | None = None
    operational_policies: dict[str, Any] = Field(default_factory=dict)

    # Step 6: Subscription Plan
    subscription_plan: str = Field("30_DAY_FREE_TRIAL", description="30_DAY_FREE_TRIAL, STANDARD, PREMIUM")

    @field_validator("owner_pan_number")
    @classmethod
    def validate_pan(cls, v: str) -> str:
        clean = v.strip().upper()
        if not PAN_REGEX.match(clean):
            raise ValueError("Invalid PAN format. Must match 5 letters, 4 numbers, 1 letter (e.g. ABCDE1234F).")
        return clean

    @field_validator("pincode")
    @classmethod
    def validate_pincode(cls, v: str) -> str:
        clean = v.strip()
        if not PINCODE_REGEX.match(clean):
            raise ValueError("Invalid Indian Pincode. Must be 6 digits starting with 1-9.")
        return clean

    @field_validator("merchant_upi_vpa")
    @classmethod
    def validate_upi_vpa(cls, v: str) -> str:
        clean = v.strip().lower()
        if not UPI_VPA_REGEX.match(clean):
            raise ValueError("Invalid UPI VPA ID (e.g. homestay@okhdfcbank or 9820554433@upi).")
        return clean

    @model_validator(mode="after")
    def validate_conditional_rules(self) -> "PropertyOnboardingSubmitRequest":
        # 0. Password confirmation check
        if self.confirm_password and self.password != self.confirm_password:
            raise ValueError("Password confirmation does not match the entered master password.")

        # 1. Aadhaar privacy rule: strictly forbid unmasked 12 digit numbers
        if self.owner_gov_id_type == "AADHAAR_REDACTED":
            raw_digits = re.findall(r"\b\d{12}\b", self.owner_gov_id_masked_display)
            if raw_digits:
                raise ValueError("UIDAI Privacy Violation: Raw 12-digit Aadhaar numbers must not be stored. Use client-side redacted mask '[Aadhaar Redacted]'.")

        # 2. Category conditional validations
        cat = self.business_category
        licenses = self.category_licenses or {}

        if cat == BusinessCategory.HOMESTAY:
            # Homestay should have MTDC/Tourism cert or Gram Panchayat NOC
            has_mtdc = bool(licenses.get("mtdc_or_tourism_cert") or licenses.get("mtdc_registration_number"))
            has_gp_noc = bool(licenses.get("gram_panchayat_noc") or licenses.get("gram_panchayat_tax_receipt"))
            if not has_mtdc and not has_gp_noc:
                # Default friendly fallback
                licenses["default_proof"] = "Gram Panchayat Homestay Registry"

        elif cat in (BusinessCategory.HOTEL, BusinessCategory.RESORT):
            # Hotel/Resort license requirements
            pass

        elif cat == BusinessCategory.RESTAURANT:
            fssai = licenses.get("fssai_number")
            if fssai and not FSSAI_REGEX.match(str(fssai).strip()):
                raise ValueError("FSSAI License must be a valid 14-digit number for Restaurant onboarding.")

        elif cat == BusinessCategory.BAR:
            if not licenses.get("state_excise_liquor_license"):
                licenses["state_excise_liquor_license"] = "PROVISIONAL_EXCISE_APPLIED"

        return self


class OnboardingSubmitResponse(BaseModel):
    success: bool
    application_id: str
    property_id: str
    business_code: str
    property_name: str
    slug: str
    status: str = "PROVISIONAL_ACTIVE"
    verification_status: str = "PROVISIONAL_ACTIVE"
    access_token: str
    refresh_token: str
    expires_in: int
    credential_summary: dict[str, Any]


class ApplicationListItem(BaseModel):
    application_id: str
    property_id: str | None
    business_code: str
    property_name: str
    business_category: str
    owner_full_name: str
    owner_mobile: str
    owner_email: str
    village_city: str
    subscription_plan: str
    status: str
    owner_pan_number: str
    owner_gov_id_masked_display: str
    created_at: datetime
    google_maps_url: str | None = None
