"""FastAPI router for Multi-Category Property Onboarding & Verification Wizard."""
import uuid
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.modules.onboarding import service
from app.modules.onboarding.schemas import (
    ApplicationListItem,
    OnboardingSubmitResponse,
    PropertyOnboardingSubmitRequest,
    SendOtpRequest,
    SendOtpResponse,
    UploadDocumentResponse,
    VerifyOtpRequest,
    VerifyOtpResponse,
)

router = APIRouter(prefix="/onboarding", tags=["property_onboarding"])


@router.post("/send-otp", response_model=SendOtpResponse)
async def send_otp(req: SendOtpRequest):
    """Sends 6-digit OTP to verify Owner Mobile Number or Email address."""
    return await service.send_onboarding_otp(req)


@router.post("/verify-otp", response_model=VerifyOtpResponse)
async def verify_otp(req: VerifyOtpRequest):
    """Verifies that the entered 6-digit OTP is valid and active."""
    return await service.verify_onboarding_otp(req)


@router.post("/upload-document", response_model=UploadDocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form("KYC_DOCUMENT"),
):
    """Validates file type/size and stores securely in encrypted onboarding vault."""
    return await service.upload_document_file(file, doc_type)


@router.get("/documents/{filename}")
async def get_document(filename: str):
    """Safely retrieves document from vault for verification."""
    safe_path = service.UPLOAD_DIR / filename
    if not safe_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return FileResponse(safe_path)


@router.post(
    "/submit-property",
    response_model=OnboardingSubmitResponse,
    status_code=status.HTTP_201_CREATED,
)
async def submit_property(
    req: PropertyOnboardingSubmitRequest,
    session: AsyncSession = Depends(get_session),
):
    """Submits onboarding application, provisions the Property tenant and Owner login."""
    return await service.submit_property_onboarding(session, req)


@router.get("/applications", response_model=list[ApplicationListItem])
async def list_applications(session: AsyncSession = Depends(get_session)):
    """Super Admin Pipeline: Lists all submitted property applications for review."""
    return await service.list_onboarding_applications(session)


@router.patch("/applications/{application_id}/verify")
async def verify_application(
    application_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    """Super Admin Action: [ ✅ Verify & Publish ] activates listing on public marketplace."""
    return await service.verify_and_publish_application(session, application_id)
