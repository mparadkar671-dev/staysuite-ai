"""Service for Multi-Person RBAC, 4-step login, approval workflows, and staff self-service."""
import asyncio
import secrets
import uuid
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.enums import PayModel, Role
from app.core.security import create_token, hash_password, verify_password
from app.modules.auth_rbac.schemas import (
    BusinessRolesOut,
    MultiPersonLoginRequest,
    OwnerCreateStaffRequest,
    ScopedTokenResponse,
    StaffApprovalRequest,
    StaffLeaveRequestCreate,
    StaffLeaveRequestOut,
    StaffMemberProfileOut,
    StaffSelfSignupRequest,
    StaffTaskOut,
    StaffUpaadLedgerItemOut,
)
from app.modules.properties.models import Property, User
from app.modules.staff_hr.models import (
    StaffLeaveRequest,
    StaffMember,
    StaffTask,
    StaffUpaadLedger,
)
from app.plugins.category_matrix import get_roles_for_category, resolve_features

settings = get_settings()

# In-memory OTP storage for password reset (email/phone -> (otp, expiry))
_PASSWORD_RESET_OTPS: dict[str, tuple[str, datetime]] = {}


async def _resolve_property(session: AsyncSession, business_code: str) -> Property:
    """Finds property by business_code (case-insensitive) or by slug."""
    clean_code = business_code.strip()
    prop = (
        await session.execute(
            select(Property).where(
                or_(
                    Property.business_code.ilike(clean_code),
                    Property.slug == clean_code.lower(),
                )
            )
        )
    ).scalar_one_or_none()
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Business with ID or code '{business_code}' not found.",
        )
    if getattr(prop, "status", "ACTIVE") in ["SUSPENDED", "CLOSED"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Business account is currently {prop.status}. Contact StaySuite Support.",
        )
    return prop


async def get_business_roles(session: AsyncSession, business_code: str) -> BusinessRolesOut:
    """Step 1: Look up business and return operational roles active for its category."""
    prop = await _resolve_property(session, business_code)
    cat_str = str(prop.business_category.value if hasattr(prop.business_category, "value") else prop.business_category)
    roles = get_roles_for_category(cat_str)
    return BusinessRolesOut(
        property_id=str(prop.id),
        property_name=prop.name,
        business_code=getattr(prop, "business_code", f"SS-HM-{str(prop.id)[:4]}"),
        business_category=cat_str,
        active_roles=roles,
    )


async def get_role_members(
    session: AsyncSession, business_code: str, role: str
) -> list[StaffMemberProfileOut]:
    """Step 2: Returns verified staff/owner profiles under the selected role."""
    prop = await _resolve_property(session, business_code)
    role_upper = role.upper()

    members_out: list[StaffMemberProfileOut] = []

    # If role is OWNER, check both Users and StaffMembers
    if role_upper == "OWNER":
        owners = (
            await session.execute(
                select(User).where(
                    User.property_id == prop.id,
                    User.role == Role.OWNER,
                    User.is_active == True,
                )
            )
        ).scalars().all()
        for o in owners:
            members_out.append(
                StaffMemberProfileOut(
                    id=str(o.id),
                    full_name=o.name,
                    role="OWNER",
                    role_title="Property Owner",
                    avatar=getattr(o, "avatar", None),
                    phone=o.phone,
                    status=getattr(o, "status", "ACTIVE"),
                )
            )

    # Fetch active staff members in this role
    staff_list = (
        await session.execute(
            select(StaffMember).where(
                StaffMember.property_id == prop.id,
                StaffMember.role.ilike(role_upper),
                StaffMember.is_active == True,
                StaffMember.status == "ACTIVE",
            )
        )
    ).scalars().all()

    for s in staff_list:
        members_out.append(
            StaffMemberProfileOut(
                id=str(s.id),
                full_name=s.name,
                role=s.role,
                role_title=s.role_title or s.role,
                avatar=s.avatar,
                phone=s.phone,
                status=s.status,
            )
        )

    # Fallback: if no members found, also query Users table matching role
    if not members_out:
        users = (
            await session.execute(
                select(User).where(
                    User.property_id == prop.id,
                    User.role == role_upper,
                    User.is_active == True,
                )
            )
        ).scalars().all()
        for u in users:
            members_out.append(
                StaffMemberProfileOut(
                    id=str(u.id),
                    full_name=u.name,
                    role=role_upper,
                    role_title=role_upper.replace("_", " ").title(),
                    avatar=getattr(u, "avatar", None),
                    phone=u.phone,
                    status=getattr(u, "status", "ACTIVE"),
                )
            )

    return members_out


async def authenticate_multi_person(
    session: AsyncSession, req: MultiPersonLoginRequest
) -> ScopedTokenResponse:
    """Step 3 & 4: Authenticates individual person and returns scoped JWT with capability flags."""
    prop = await _resolve_property(session, req.business_code)
    cat_str = str(prop.business_category.value if hasattr(prop.business_category, "value") else prop.business_category)
    plan_str = getattr(prop, "subscription_plan", "TRIAL")
    overrides = getattr(prop, "feature_overrides", {}) or {}

    enabled_features = list(resolve_features(cat_str, plan_str, overrides))

    target_user: User | None = None
    target_staff: StaffMember | None = None

    # Try matching staff member or user by ID
    if req.staff_member_id:
        try:
            member_uuid = uuid.UUID(req.staff_member_id)
            target_staff = await session.get(StaffMember, member_uuid)
            target_user = await session.get(User, member_uuid)
        except ValueError:
            # If not UUID, try matching by phone or email
            target_user = (
                await session.execute(
                    select(User).where(
                        User.property_id == prop.id,
                        or_(User.phone == req.staff_member_id, User.email == req.staff_member_id),
                    )
                )
            ).scalar_one_or_none()

    # If target_user found directly
    if target_user:
        ok = await asyncio.to_thread(verify_password, req.password, target_user.password_hash)
        if not ok:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid password")
        if target_user.status != "ACTIVE" or not target_user.is_active:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                f"Account is {target_user.status}. Please await Owner approval.",
            )
        target_user.last_login_at = datetime.now(UTC)
        await session.commit()

        access, ttl = create_token(
            user_id=target_user.id,
            property_id=prop.id,
            role=target_user.role,
            token_type="access",
            business_category=cat_str,
            staff_member_id=target_user.staff_member_id or (target_staff.id if target_staff else None),
            enabled_features=enabled_features,
        )
        refresh, _ = create_token(
            user_id=target_user.id,
            property_id=prop.id,
            role=target_user.role,
            token_type="refresh",
            business_category=cat_str,
            staff_member_id=target_user.staff_member_id or (target_staff.id if target_staff else None),
            enabled_features=enabled_features,
        )

        return ScopedTokenResponse(
            access_token=access,
            refresh_token=refresh,
            expires_in=ttl,
            user_id=str(target_user.id),
            tenant_id=str(prop.id),
            business_code=getattr(prop, "business_code", f"SS-HM-{str(prop.id)[:4]}"),
            business_category=cat_str,
            role=str(target_user.role.value if hasattr(target_user.role, "value") else target_user.role),
            staff_member_id=str(target_user.staff_member_id) if target_user.staff_member_id else (str(target_staff.id) if target_staff else None),
            full_name=target_user.name,
            enabled_features=enabled_features,
        )

    # If target_staff found, verify connected User account or create on-the-fly login
    if target_staff:
        if target_staff.status != "ACTIVE":
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                f"Staff member is {target_staff.status}. Please await Owner approval.",
            )
        # Check connected user
        connected_user = (
            await session.execute(
                select(User).where(
                    User.property_id == prop.id,
                    User.staff_member_id == target_staff.id,
                )
            )
        ).scalar_one_or_none()

        if connected_user:
            ok = await asyncio.to_thread(verify_password, req.password, connected_user.password_hash)
            if not ok:
                raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid password")
            target_user = connected_user
        else:
            # Check by phone or email
            lookup_user = (
                await session.execute(
                    select(User).where(
                        User.property_id == prop.id,
                        or_(
                            User.phone == target_staff.phone,
                            User.email == target_staff.email,
                        ),
                    )
                )
            ).scalar_one_or_none()
            if lookup_user:
                ok = await asyncio.to_thread(verify_password, req.password, lookup_user.password_hash)
                if not ok:
                    raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid password")
                lookup_user.staff_member_id = target_staff.id
                target_user = lookup_user
            else:
                # First-time staff login with default/provided password
                pw_hash = await asyncio.to_thread(hash_password, req.password)
                target_user = User(
                    property_id=prop.id,
                    name=target_staff.name,
                    phone=target_staff.phone or f"+91-00000{secrets.randbelow(90000)+10000}",
                    email=target_staff.email,
                    password_hash=pw_hash,
                    role=req.role.upper(),
                    staff_member_id=target_staff.id,
                    status="ACTIVE",
                )
                session.add(target_user)
                await session.flush()

        target_user.last_login_at = datetime.now(UTC)
        await session.commit()

        access, ttl = create_token(
            user_id=target_user.id,
            property_id=prop.id,
            role=target_user.role,
            token_type="access",
            business_category=cat_str,
            staff_member_id=target_staff.id,
            enabled_features=enabled_features,
        )
        refresh, _ = create_token(
            user_id=target_user.id,
            property_id=prop.id,
            role=target_user.role,
            token_type="refresh",
            business_category=cat_str,
            staff_member_id=target_staff.id,
            enabled_features=enabled_features,
        )

        return ScopedTokenResponse(
            access_token=access,
            refresh_token=refresh,
            expires_in=ttl,
            user_id=str(target_user.id),
            tenant_id=str(prop.id),
            business_code=getattr(prop, "business_code", f"SS-HM-{str(prop.id)[:4]}"),
            business_category=cat_str,
            role=str(target_user.role.value if hasattr(target_user.role, "value") else target_user.role),
            staff_member_id=str(target_staff.id),
            full_name=target_staff.name,
            enabled_features=enabled_features,
        )

    raise HTTPException(status.HTTP_404_NOT_FOUND, "Staff member or identity not found.")


async def owner_create_staff(
    session: AsyncSession, property_id: uuid.UUID, req: OwnerCreateStaffRequest
) -> StaffMemberProfileOut:
    """Flow A: Owner directly registers staff with ACTIVE status."""
    pw_hash = await asyncio.to_thread(hash_password, req.password)

    staff = StaffMember(
        property_id=property_id,
        name=req.name,
        phone=req.phone,
        email=req.email,
        role=req.role.upper(),
        role_title=req.role_title or req.role.replace("_", " ").title(),
        status="ACTIVE",
        pay_model=PayModel(req.pay_model) if hasattr(PayModel, req.pay_model) else PayModel.MONTHLY_FIXED,
        base_amount=req.base_amount,
        per_room_bonus_amount=req.per_room_bonus_amount,
        preferred_language=req.preferred_language,
        joined_on=date.today(),
        is_active=True,
    )
    session.add(staff)
    await session.flush()

    # Create associated user login
    user = User(
        property_id=property_id,
        name=req.name,
        phone=req.phone or f"+91-{secrets.randbelow(9000000000)+1000000000}",
        email=req.email,
        password_hash=pw_hash,
        role=req.role.upper(),
        staff_member_id=staff.id,
        status="ACTIVE",
    )
    session.add(user)
    await session.commit()

    return StaffMemberProfileOut(
        id=str(staff.id),
        full_name=staff.name,
        role=staff.role,
        role_title=staff.role_title,
        avatar=staff.avatar,
        phone=staff.phone,
        status=staff.status,
    )


async def staff_self_signup(session: AsyncSession, req: StaffSelfSignupRequest) -> dict:
    """Flow B: Worker self-signs up; created with PENDING_OWNER_APPROVAL."""
    prop = await _resolve_property(session, req.business_code)
    pw_hash = await asyncio.to_thread(hash_password, req.password)

    staff = StaffMember(
        property_id=prop.id,
        name=req.name,
        phone=req.phone,
        email=req.email,
        role=req.role.upper(),
        role_title=req.role.replace("_", " ").title(),
        status="PENDING_OWNER_APPROVAL",
        preferred_language=req.preferred_language,
        joined_on=date.today(),
        is_active=True,
    )
    session.add(staff)
    await session.flush()

    user = User(
        property_id=prop.id,
        name=req.name,
        phone=req.phone,
        email=req.email,
        password_hash=pw_hash,
        role=req.role.upper(),
        staff_member_id=staff.id,
        status="PENDING_OWNER_APPROVAL",
    )
    session.add(user)
    await session.commit()

    return {
        "staff_id": str(staff.id),
        "status": "PENDING_OWNER_APPROVAL",
        "message": f"Account created for {req.name}. Please wait for property Owner/Manager approval.",
    }


async def approve_or_reject_staff(
    session: AsyncSession,
    property_id: uuid.UUID,
    staff_id: uuid.UUID,
    req: StaffApprovalRequest,
) -> dict:
    """Owner or Manager approves or rejects pending staff member."""
    staff = await session.get(StaffMember, staff_id)
    if not staff or staff.property_id != property_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Staff member not found")

    new_status = req.status.upper()
    if new_status not in ["ACTIVE", "REJECTED"]:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Status must be ACTIVE or REJECTED")

    staff.status = new_status
    if new_status == "REJECTED":
        staff.is_active = False

    # Update associated user login
    user = (
        await session.execute(
            select(User).where(User.staff_member_id == staff.id)
        )
    ).scalar_one_or_none()
    if user:
        user.status = new_status
        user.is_active = (new_status == "ACTIVE")

    await session.commit()
    return {
        "staff_id": str(staff.id),
        "name": staff.name,
        "new_status": new_status,
        "message": f"Staff member {staff.name} is now {new_status}.",
    }


async def request_password_reset(email_or_phone: str) -> dict:
    """Issues 6-digit OTP for password reset."""
    otp = f"{secrets.randbelow(900000) + 100000}"
    expires_at = datetime.now(UTC) + timedelta(minutes=15)
    _PASSWORD_RESET_OTPS[email_or_phone.strip().lower()] = (otp, expires_at)
    return {
        "status": "OTP_SENT",
        "email_or_phone": email_or_phone,
        "otp": otp,  # Exposed for automated testing & development environments
        "message": "6-digit OTP generated. Valid for 15 minutes.",
    }


async def verify_and_reset_password(
    session: AsyncSession, email_or_phone: str, otp: str, new_password: str
) -> dict:
    """Verifies OTP and updates password in User table."""
    key = email_or_phone.strip().lower()
    entry = _PASSWORD_RESET_OTPS.get(key)
    if not entry:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No OTP request found for this identity.")

    expected_otp, expiry = entry
    if datetime.now(UTC) > expiry:
        del _PASSWORD_RESET_OTPS[key]
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "OTP has expired. Request a new one.")

    if otp.strip() != expected_otp:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid OTP code.")

    # Find user by email or phone
    user = (
        await session.execute(
            select(User).where(
                or_(User.email.ilike(key), User.phone == email_or_phone.strip())
            )
        )
    ).scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User account not found.")

    user.password_hash = await asyncio.to_thread(hash_password, new_password)
    await session.commit()
    del _PASSWORD_RESET_OTPS[key]

    return {"status": "SUCCESS", "message": "Password reset successfully. You can now login."}


# ====================================================================
# Universal Employee Self-Service Operations
# ====================================================================

async def get_staff_tasks(session: AsyncSession, staff_id: uuid.UUID) -> list[StaffTaskOut]:
    """Retrieves operational tasks assigned to this staff member."""
    tasks = (
        await session.execute(
            select(StaffTask)
            .where(StaffTask.staff_id == staff_id)
            .order_by(StaffTask.created_at.desc())
        )
    ).scalars().all()

    return [
        StaffTaskOut(
            id=str(t.id),
            title=t.title,
            description=t.description,
            priority=t.priority,
            status=t.status,
            due_date=t.due_date,
        )
        for t in tasks
    ]


async def update_task_status(session: AsyncSession, task_id: uuid.UUID, new_status: str) -> dict:
    task = await session.get(StaffTask, task_id)
    if not task:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")
    task.status = new_status.upper()
    await session.commit()
    return {"task_id": str(task.id), "status": task.status}


async def get_staff_upaad_ledger(
    session: AsyncSession, staff_id: uuid.UUID
) -> dict:
    """Ledger showing earned wages, advances (Upaad), and net pending payout."""
    staff = await session.get(StaffMember, staff_id)
    if not staff:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Staff member not found")

    ledger_entries = (
        await session.execute(
            select(StaffUpaadLedger)
            .where(StaffUpaadLedger.staff_id == staff_id)
            .order_by(StaffUpaadLedger.entry_date.desc())
        )
    ).scalars().all()

    total_advances = sum(
        e.amount for e in ledger_entries if str(e.entry_type) == "ADVANCE"
    )
    total_deductions = sum(
        e.amount for e in ledger_entries if str(e.entry_type) == "DEDUCTION"
    )
    base_salary = staff.base_amount or Decimal("0")
    net_pending = base_salary - total_advances + total_deductions

    return {
        "staff_id": str(staff.id),
        "staff_name": staff.name,
        "base_amount": base_salary,
        "total_advances_taken": total_advances,
        "total_deductions": total_deductions,
        "net_pending_payout": net_pending,
        "entries": [
            StaffUpaadLedgerItemOut(
                id=str(e.id),
                entry_type=str(e.entry_type.value if hasattr(e.entry_type, "value") else e.entry_type),
                amount=e.amount,
                entry_date=e.entry_date,
                payroll_period=e.payroll_period,
                note=e.note,
            )
            for e in ledger_entries
        ],
    }


async def create_staff_leave_request(
    session: AsyncSession,
    property_id: uuid.UUID,
    staff_id: uuid.UUID,
    req: StaffLeaveRequestCreate,
) -> StaffLeaveRequestOut:
    leave = StaffLeaveRequest(
        property_id=property_id,
        staff_id=staff_id,
        start_date=req.start_date,
        end_date=req.end_date,
        reason=req.reason,
        status="PENDING",
    )
    session.add(leave)
    await session.commit()
    return StaffLeaveRequestOut(
        id=str(leave.id),
        start_date=leave.start_date,
        end_date=leave.end_date,
        reason=leave.reason,
        status=leave.status,
        created_at=leave.created_at,
    )


async def get_staff_leaves(session: AsyncSession, staff_id: uuid.UUID) -> list[StaffLeaveRequestOut]:
    leaves = (
        await session.execute(
            select(StaffLeaveRequest)
            .where(StaffLeaveRequest.staff_id == staff_id)
            .order_by(StaffLeaveRequest.created_at.desc())
        )
    ).scalars().all()
    return [
        StaffLeaveRequestOut(
            id=str(l.id),
            start_date=l.start_date,
            end_date=l.end_date,
            reason=l.reason,
            status=l.status,
            review_note=l.review_note,
            created_at=l.created_at,
        )
        for l in leaves
    ]
