import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.content_workflow.routes import router as content_workflow_router
from app.content_workflow.discord_response_routes import router as discord_response_router
from app.audit.routes import router as audit_router
from app.database.connection import test_database_connection
from app.database.session import SessionLocal, engine
from app.discord_connector.bot import bot as discord_bot
from app.discord_connector.config import DISCORD_BOT_TOKEN
from app.ingestion.routes import router as community_router
from app.oci_storage.routes import router as oci_storage_router
from app.security.auth_routes import router as auth_router
from app.users.routes import router as users_router
from app.users.seed_roles import seed_roles


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicialización de datos administrativos
    db = SessionLocal()

    try:
        seed_roles(db)
    finally:
        db.close()

    # Inicio opcional del bot Discord.
    enable_discord_bot = os.getenv("ENABLE_DISCORD_BOT", "true").strip().lower() in (
        "1", "true", "yes", "on"
    )
    discord_task = None

    if enable_discord_bot:
        discord_task = asyncio.create_task(
            discord_bot.start(DISCORD_BOT_TOKEN)
        )
        print("[CLOUDEDTECH] Discord Bot iniciando...")
    else:
        print("[CLOUDEDTECH] Discord Bot desactivado")

    print("[CLOUDEDTECH] Backend iniciado")

    try:
        yield
    finally:
        if discord_task is not None:
            print("[CLOUDEDTECH] Cerrando Discord Bot...")

            if not discord_bot.is_closed():
                await discord_bot.close()

            try:
                await discord_task
            except asyncio.CancelledError:
                pass

app = FastAPI(
    title="CommunityLab API",
    description="API de seguridad y administración de CommunityLab",
    version="1.0.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(users_router)
app.include_router(auth_router)
app.include_router(oci_storage_router)
app.include_router(audit_router)

# Datos provenientes de Discord / Community Analytics
app.include_router(community_router)
app.include_router(content_workflow_router)
app.include_router(discord_response_router)


@app.get("/")
def root():
    return {
        "message": "CommunityLab API funcionando",
        "status": "ok",
    }



@app.get("/health/discord")
async def discord_connection_health():
    from app.discord_connector.config import (
        DISCORD_GUILD_ID,
        DISCORD_CHANNEL_IDS,
    )

    ready = discord_bot.is_ready()
    closed = discord_bot.is_closed()
    guild = discord_bot.get_guild(DISCORD_GUILD_ID)

    return {
        "is_ready": ready,
        "is_closed": closed,
        "bot_username": (
            str(discord_bot.user)
            if discord_bot.user is not None
            else None
        ),
        "guild_connected": guild is not None,
        "configured_channels": len(DISCORD_CHANNEL_IDS),
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
    }


@app.get("/health/database")
def database_health():
    version = test_database_connection()

    return {
        "status": "connected",
        "database": "communitylab",
        "postgresql": version,
    }


@app.get("/health/sqlalchemy")
def sqlalchemy_health():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        value = result.scalar()

    return {
        "status": "connected",
        "sqlalchemy": True,
        "test": value,
    }