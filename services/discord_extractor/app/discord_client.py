"""Cliente REST minimo de Discord (API v10) para leer canales y mensajes.

No usa el gateway/websocket: para extraer historial alcanza con la API REST.
Referencia: https://discord.com/developers/docs/reference
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any

import httpx

from app.config import Settings

# Discord representa las fechas de creacion de un objeto en su ID (snowflake).
# Formula oficial: https://discord.com/developers/docs/reference#snowflakes
_DISCORD_EPOCH_MS = 1_420_070_400_000


class DiscordAPIError(RuntimeError):
    """Error no recuperable al hablar con la API de Discord."""


def datetime_to_snowflake(dt: datetime) -> str:
    """Convierte un datetime a un snowflake valido para los filtros before/after."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    ms = int(dt.timestamp() * 1000) - _DISCORD_EPOCH_MS
    return str(ms << 22)


class DiscordClient:
    """Cliente async con reintento automatico ante rate limit (HTTP 429)."""

    def __init__(self, settings: Settings, http_client: httpx.AsyncClient | None = None):
        self._settings = settings
        self._owns_client = http_client is None
        self._client = http_client or httpx.AsyncClient(
            base_url=settings.discord_api_base,
            headers={
                "Authorization": f"Bot {settings.discord_bot_token}",
                "User-Agent": "CommunityLab-DiscordExtractor (https://github.com/No-Country-simulation/G10-LATAM-equipo-27, 0.1.0)",
            },
            timeout=15.0,
        )

    async def aclose(self) -> None:
        if self._owns_client:
            await self._client.aclose()

    async def __aenter__(self) -> "DiscordClient":
        return self

    async def __aexit__(self, *exc_info: object) -> None:
        await self.aclose()

    async def _request(self, method: str, path: str, **kwargs: Any) -> Any:
        """GET/POST con reintento ante 429, respetando el 'retry_after' de Discord."""
        for _ in range(5):
            response = await self._client.request(method, path, **kwargs)
            if response.status_code == 429:
                payload = response.json()
                retry_after = float(payload.get("retry_after", 1.0))
                await asyncio.sleep(retry_after)
                continue
            if response.status_code >= 400:
                raise DiscordAPIError(
                    f"Discord respondio {response.status_code} en {method} {path}: {response.text}"
                )
            return response.json()
        raise DiscordAPIError(f"Demasiados rate limits consecutivos en {method} {path}")

    async def get_guild(self, guild_id: str) -> dict[str, Any]:
        """Informacion basica del servidor (usada para el nombre en el paquete)."""
        return await self._request("GET", f"/guilds/{guild_id}")

    async def get_text_channels(self, guild_id: str) -> list[dict[str, Any]]:
        """Canales de texto (type 0) y de anuncios (type 5) del servidor."""
        channels: list[dict[str, Any]] = await self._request("GET", f"/guilds/{guild_id}/channels")
        return [c for c in channels if c.get("type") in (0, 5)]

    async def get_channel_messages(
        self,
        channel_id: str,
        *,
        after: str | None = None,
        before: str | None = None,
        max_mensajes: int = 500,
    ) -> list[dict[str, Any]]:
        """Pagina el historial de un canal (mas reciente primero), hasta max_mensajes."""
        mensajes: list[dict[str, Any]] = []
        cursor_before = before

        while len(mensajes) < max_mensajes:
            params: dict[str, Any] = {"limit": min(100, max_mensajes - len(mensajes))}
            if cursor_before:
                params["before"] = cursor_before
            elif after:
                params["after"] = after

            lote: list[dict[str, Any]] = await self._request(
                "GET", f"/channels/{channel_id}/messages", params=params
            )
            if not lote:
                break

            mensajes.extend(lote)

            if after and not cursor_before:
                # Paginando hacia adelante (after): Discord devuelve el lote mas
                # antiguo primero, seguimos desde el mas nuevo del lote.
                if len(lote) < params["limit"]:
                    break
                after = lote[-1]["id"]
            else:
                # Paginando hacia atras (before, por defecto): seguimos desde
                # el mensaje mas antiguo recibido.
                cursor_before = lote[-1]["id"]
                if len(lote) < params["limit"]:
                    break

        return mensajes[:max_mensajes]
