"""StaySuite AI - FastAPI modular monolith entry point."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

import app.all_models  # noqa: F401  (registers every ORM model)
from app.core import sync_engine
from app.core.config import get_settings
from app.core.db import SessionFactory, engine
from app.core.realtime import hub
from app.modules.ai_copilot.router import router as copilot_router
from app.modules.auth_rbac.router import (
    router as auth_rbac_router,
    staff_self_service_router,
)
from app.modules.billing_pos.router import khata_router, router as billing_pos_router
from app.modules.bookings.router import router as bookings_router
from app.modules.dining_bom.router import router as dining_bom_router
from app.modules.onboarding.router import router as onboarding_router
from app.modules.properties.router import auth_router, router as properties_router
from app.modules.saas_admin.router import router as saas_admin_router

settings = get_settings()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(_: FastAPI):
    await hub.start(settings.redis_url)
    try:
        yield
    finally:
        await hub.stop()
        await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None,
    openapi_url=None if settings.is_production else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

API_PREFIX = "/api/v1"
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(auth_rbac_router, prefix=API_PREFIX)
app.include_router(staff_self_service_router, prefix=API_PREFIX)
app.include_router(saas_admin_router, prefix=API_PREFIX)
app.include_router(onboarding_router, prefix=API_PREFIX)
app.include_router(properties_router, prefix=API_PREFIX)
app.include_router(billing_pos_router, prefix=API_PREFIX)
app.include_router(khata_router, prefix=API_PREFIX)
app.include_router(dining_bom_router, prefix=API_PREFIX)
app.include_router(bookings_router, prefix=API_PREFIX)
app.include_router(copilot_router, prefix=API_PREFIX)
app.include_router(sync_engine.router, prefix=API_PREFIX)
app.include_router(sync_engine.ws_router, prefix=API_PREFIX)


@app.get("/health", include_in_schema=False)
async def health() -> JSONResponse:
    try:
        async with SessionFactory() as session:
            await session.execute(text("SELECT 1"))
    except Exception:
        return JSONResponse({"status": "degraded", "database": "down"}, status_code=503)
    return JSONResponse({"status": "ok"})
