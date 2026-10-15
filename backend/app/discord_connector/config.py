import os
from pathlib import Path

from dotenv import load_dotenv


# Raíz del backend: E:\CommunityLab\backend
BASE_DIR = Path(__file__).resolve().parents[2]

ENV_FILE = BASE_DIR / ".env"

load_dotenv(ENV_FILE)


# Token
DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN")

if not DISCORD_BOT_TOKEN:
    raise RuntimeError(
        "No se encontró DISCORD_BOT_TOKEN en el archivo .env"
    )


# Servidor autorizado
guild_id = os.getenv("DISCORD_GUILD_ID")

if not guild_id:
    raise RuntimeError(
        "No se encontró DISCORD_GUILD_ID en el archivo .env"
    )

DISCORD_GUILD_ID = int(guild_id)


# Canales autorizados
channel_ids = os.getenv("DISCORD_CHANNEL_IDS")

if not channel_ids:
    raise RuntimeError(
        "No se encontró DISCORD_CHANNEL_IDS en el archivo .env"
    )

DISCORD_CHANNEL_IDS = {
    int(channel_id.strip())
    for channel_id in channel_ids.split(",")
    if channel_id.strip()
}