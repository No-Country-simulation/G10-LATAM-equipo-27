"""Punto de entrada de la API de ingesta de Discord."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException

from app.config import Settings, get_settings
from app.discord_client import DiscordAPIError, DiscordClient, datetime_to_snowflake
from app.schemas import (
    AlmacenamientoOCI,
    CanalInfo,
    ExtractRequest,
    ExtractResponse,
    PaqueteInteracciones,
)
from app.security import require_api_key
from app.storage import ObjectStorageClient
from app.transform import mensaje_a_interaccion

app = FastAPI(
    title="CommunityLab - Discord Extractor",
    description=(
        "Servicio de ingesta que lee mensajes de canales de Discord y los deja "
        "listos, en formato de interacciones CommunityLab, en OCI Object Storage."
    ),
    version="0.1.0",
)


@app.get("/health", tags=["salud"])
def health() -> dict:
    """Chequeo de vida, sin autenticacion (usado por probes/monitoreo)."""
    return {"status": "ok"}


@app.get("/channels", response_model=list[CanalInfo], dependencies=[Depends(require_api_key)])
async def listar_canales(settings: Settings = Depends(get_settings)) -> list[CanalInfo]:
    """Canales de texto disponibles en el servidor configurado (DISCORD_GUILD_ID)."""
    async with DiscordClient(settings) as discord:
        try:
            canales = await discord.get_text_channels(settings.discord_guild_id)
        except DiscordAPIError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc

    return [CanalInfo(id=c["id"], name=c["name"]) for c in canales]


@app.post("/extract", response_model=ExtractResponse, dependencies=[Depends(require_api_key)])
async def extraer_interacciones(
    body: ExtractRequest, settings: Settings = Depends(get_settings)
) -> ExtractResponse:
    """Lee los canales pedidos, arma el paquete de interacciones y (opcionalmente)
    lo sube a OCI Object Storage."""
    async with DiscordClient(settings) as discord:
        try:
            guild = await discord.get_guild(settings.discord_guild_id)
            canales = await discord.get_text_channels(settings.discord_guild_id)
            nombres_por_id = {c["id"]: c["name"] for c in canales}

            after = datetime_to_snowflake(body.desde) if body.desde else None
            before = datetime_to_snowflake(body.hasta) if body.hasta else None

            interacciones = []
            interacciones_por_canal: dict[str, int] = {}
            for channel_id in body.channel_ids:
                nombre_canal = nombres_por_id.get(channel_id, channel_id)
                mensajes = await discord.get_channel_messages(
                    channel_id,
                    after=after,
                    before=before,
                    max_mensajes=body.max_mensajes_por_canal,
                )
                nuevas = [
                    interaccion
                    for m in mensajes
                    if (interaccion := mensaje_a_interaccion(m, canal_nombre=nombre_canal))
                ]
                interacciones.extend(nuevas)
                interacciones_por_canal[nombre_canal] = len(nuevas)
        except DiscordAPIError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc

    paquete = PaqueteInteracciones(
        origen_comunidad=f"Discord_{guild.get('name', settings.discord_guild_id).replace(' ', '_')}",
        periodo_referencia=body.periodo_referencia,
        extraido_en=datetime.now(timezone.utc),
        interacciones=interacciones,
    )

    almacenamiento = None
    if body.subir_a_oci:
        try:
            storage = ObjectStorageClient(settings)
            bucket, ruta_objeto = storage.subir_paquete(paquete)
            almacenamiento = AlmacenamientoOCI(
                bucket=bucket, ruta_objeto=ruta_objeto, status="guardado_con_exito"
            )
        except Exception as exc:  # noqa: BLE001 - se reporta al cliente, no se oculta
            raise HTTPException(
                status_code=502, detail=f"Fallo al subir a OCI Object Storage: {exc}"
            ) from exc

    return ExtractResponse(
        status="exito",
        total_interacciones_procesadas=len(interacciones),
        interacciones_por_canal=interacciones_por_canal,
        almacenamiento_oci=almacenamiento,
        paquete=None if body.subir_a_oci else paquete,
    )
