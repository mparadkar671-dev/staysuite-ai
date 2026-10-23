"""FastAPI router for AI Copilot command bar."""
from fastapi import APIRouter, Depends, status

from app.core.security import TokenPayload, get_current_token
from app.modules.ai_copilot.schemas import CopilotActionResponse, ParseCommandRequest
from app.modules.ai_copilot.service import CopilotService

router = APIRouter(prefix="/copilot", tags=["AI Copilot Action Bar"])


@router.post(
    "/parse-command",
    response_model=CopilotActionResponse,
    status_code=status.HTTP_200_OK,
    summary="Parse natural-language owner commands into structured action cards",
)
async def parse_command(
    req: ParseCommandRequest,
    auth: TokenPayload = Depends(get_current_token),
) -> CopilotActionResponse:
    """Accepts commands in Marathi, Hindi, or English (e.g. 'Freeze all rooms for Dec 24',
    'Change Deluxe AC tariff to 4000') and returns a 1-click confirmation action card."""
    return await CopilotService.parse_command(req)
