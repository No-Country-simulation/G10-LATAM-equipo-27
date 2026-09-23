"""Configuracion del servicio, cargada desde variables de entorno / .env."""

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- API propia ---
    api_key: str = Field(..., description="Clave esperada en el header X-API-Key.")

    # --- Discord ---
    discord_bot_token: str = Field(..., description="Token del bot de Discord.")
    discord_guild_id: str = Field(..., description="ID del servidor (guild) a leer.")
    discord_api_base: str = "https://discord.com/api/v10"

    # --- OCI Object Storage ---
    oci_auth: Literal["instance_principal", "config"] = "config"
    oci_config_profile: str = "DEFAULT"
    oci_namespace: str = ""
    oci_bucket_name: str = "communitylab-discord-raw"
    oci_compartment_id: str = ""


@lru_cache
def get_settings() -> Settings:
    """Instancia cacheada de Settings (se lee una sola vez por proceso)."""
    return Settings()
