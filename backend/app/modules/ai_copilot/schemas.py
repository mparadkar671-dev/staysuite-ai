"""Pydantic schemas for the AI Copilot Settings Search & Action Bar."""
from enum import StrEnum
from pydantic import BaseModel, Field


class ActionType(StrEnum):
    FREEZE_ROOMS = "FREEZE_ROOMS"
    UNFREEZE_ROOMS = "UNFREEZE_ROOMS"
    UPDATE_TARIFF = "UPDATE_TARIFF"
    RECORD_EXPENSE = "RECORD_EXPENSE"
    MARK_ROOM_CLEAN = "MARK_ROOM_CLEAN"
    SEARCH_GUEST_BOOKING = "SEARCH_GUEST_BOOKING"
    UNKNOWN = "UNKNOWN"


class ParseCommandRequest(BaseModel):
    query: str = Field(..., description="Natural language owner command in Marathi, Hindi, or English")
    language: str = Field(default="auto", description="Input language: auto, mr, hi, en")


class CopilotActionResponse(BaseModel):
    action_type: ActionType
    summary: str
    target_description: str
    endpoint: str
    http_method: str
    payload: dict
    confirmation_required: bool = True
    confidence: float = Field(ge=0.0, le=1.0)
