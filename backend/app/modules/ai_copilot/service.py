"""AI Copilot business logic: Natural Language Settings Search & Action Bar.
Supports Gemini 2.5 Flash structured output with robust multilingual offline fallback (Marathi, Hindi, English)."""
import json
import logging
import re
from decimal import Decimal

from app.core.config import get_settings
from app.modules.ai_copilot.schemas import ActionType, CopilotActionResponse, ParseCommandRequest

settings = get_settings()
logger = logging.getLogger(__name__)


class CopilotService:
    @staticmethod
    async def parse_command(req: ParseCommandRequest) -> CopilotActionResponse:
        """Parses natural-language commands into executable API action cards."""
        query = req.query.strip()

        # 1. Attempt Gemini 2.5 Flash if API key is present
        if settings.gemini_api_key:
            try:
                from google import genai
                from google.genai import types

                client = genai.Client(api_key=settings.gemini_api_key)
                prompt = (
                    "You are the AI Front-Desk Copilot for StaySuite AI hospitality operating system.\n"
                    "Convert the owner's natural language command (which may be in English, Hindi, or Marathi) "
                    "into a structured action card.\n\n"
                    f"Command: \"{query}\"\n\n"
                    "Return ONLY valid JSON with keys: action_type, summary, target_description, endpoint, "
                    "http_method, payload, confirmation_required, confidence."
                )

                response = await client.aio.models.generate_content(
                    model=settings.gemini_model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=CopilotActionResponse,
                        temperature=0.1,
                    ),
                )
                if response.text:
                    parsed = json.loads(response.text)
                    return CopilotActionResponse(**parsed)
            except Exception as e:
                logger.warning("Gemini copilot parsing failed, falling back to rule-based engine: %s", e)

        # 2. Multilingual Rule-Based Intent Parser (Marathi / Hindi / English)
        return CopilotService._fallback_rule_parser(query)

    @staticmethod
    def _fallback_rule_parser(query: str) -> CopilotActionResponse:
        q_lower = query.lower()

        # Intent: FREEZE ROOMS ("Freeze all rooms for Dec 24", "खोल्या गोठवा", "24 डिसेंबर रूम ब्लॉक करा")
        if any(w in q_lower for w in ["freeze", "block", "गोठवा", "ब्लॉक", "बंद करा"]):
            date_match = re.search(r"(\d{4}-\d{2}-\d{2})", query)
            date_str = date_match.group(1) if date_match else "2026-12-24"
            if "dec" in q_lower or "डिसेंबर" in query:
                day_m = re.search(r"(\d{1,2})", query)
                day = day_m.group(1).zfill(2) if day_m else "24"
                date_str = f"2026-12-{day}"

            return CopilotActionResponse(
                action_type=ActionType.FREEZE_ROOMS,
                summary=f"Emergency freeze rooms for {date_str}",
                target_description=f"Block storefront availability and push zero-inventory to OTAs for {date_str}.",
                endpoint="/api/v1/properties/freeze",
                http_method="POST",
                payload={"frozen_date": date_str, "freeze": True},
                confirmation_required=True,
                confidence=0.95,
            )

        # Intent: UPDATE TARIFF ("Change Deluxe AC tariff to 4000", "दर बदला", "किंमत 4000 करा")
        if any(w in q_lower for w in ["tariff", "price", "rate", "दर", "किंमत", "भाडे"]):
            price_m = re.search(r"(\d{3,6})", query)
            price_val = price_m.group(1) if price_m else "4000"
            room_type = "Deluxe AC" if "deluxe" in q_lower else "Standard"

            return CopilotActionResponse(
                action_type=ActionType.UPDATE_TARIFF,
                summary=f"Update {room_type} tariff to Rs. {price_val}",
                target_description=f"Change base tariff for {room_type} rooms to Rs. {price_val}.",
                endpoint="/api/v1/properties/tariff",
                http_method="PATCH",
                payload={"room_type": room_type, "new_tariff": float(price_val)},
                confirmation_required=True,
                confidence=0.92,
            )

        # Intent: RECORD EXPENSE ("Add 500 petrol expense", "खर्च नोंदवा", "पेट्रोल 500")
        if any(w in q_lower for w in ["expense", "petrol", "खर्च", "पेट्रोल", "भाजी"]):
            amt_m = re.search(r"(\d{2,6})", query)
            amt = amt_m.group(1) if amt_m else "500"
            category = "PETROL" if "petrol" in q_lower or "पेट्रोल" in query else "GENERAL"

            return CopilotActionResponse(
                action_type=ActionType.RECORD_EXPENSE,
                summary=f"Record {category.lower()} expense of Rs. {amt}",
                target_description=f"Add entry under {category} in 10-category expense tracker.",
                endpoint="/api/v1/expenses",
                http_method="POST",
                payload={"category": category, "amount": float(amt)},
                confirmation_required=False,
                confidence=0.90,
            )

        # Intent: MARK ROOM CLEAN ("Mark Room 101 clean", "खोली 101 साफ झाली")
        if any(w in q_lower for w in ["clean", "साफ", "स्वच्छ"]):
            room_m = re.search(r"(\d{1,4})", query)
            room_no = room_m.group(1) if room_m else "101"

            return CopilotActionResponse(
                action_type=ActionType.MARK_ROOM_CLEAN,
                summary=f"Mark Room {room_no} as CLEAN",
                target_description=f"Flip housekeeping status of Room {room_no} from DIRTY to CLEAN.",
                endpoint=f"/api/v1/rooms/{room_no}/housekeeping",
                http_method="PATCH",
                payload={"room_number": room_no, "status": "CLEAN"},
                confirmation_required=False,
                confidence=0.95,
            )

        # Default fallback
        return CopilotActionResponse(
            action_type=ActionType.UNKNOWN,
            summary=f"Search settings for '{query}'",
            target_description="Search system settings, documentation, and property config.",
            endpoint="/api/v1/settings/search",
            http_method="GET",
            payload={"query": query},
            confirmation_required=False,
            confidence=0.50,
        )
