import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from app.content_workflow.discord_publisher import (
    publicar_respuesta_discord,
    verificar_destino_discord,
)
from app.content_workflow.discord_response_schemas import (
    PublicarRespuestaDiscordRequest,
)
from app.content_workflow.discord_response_service import (
    confirmar_publicacion,
    registrar_resultado_desconocido,
    reservar_respuesta,
)
from app.content_workflow.service import solicitar_motor
from app.database.dependencies import get_db
from app.security.dependencies import require_role
from app.users.models import User


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/content-workflow",
    tags=["Discord Responses"],
)


@router.get("/complaints/{interaccion_id}/publish-preview")
async def consultar_vista_previa_discord(
    interaccion_id: int,
    usuario: User = Depends(require_role("community_manager")),
):
    if interaccion_id <= 0:
        raise HTTPException(
            status_code=422,
            detail="Identificador de interaccion invalido",
        )

    interaccion = await run_in_threadpool(
        solicitar_motor,
        "GET",
        f"/api/community/messages/{interaccion_id}",
    )

    if interaccion.get("interaccion_id") != interaccion_id:
        raise HTTPException(
            status_code=502,
            detail="El Motor IA devolvio una interaccion diferente",
        )

    try:
        guild_id = int(interaccion["guild_id"])
        channel_id = int(interaccion["channel_id"])
        message_id = int(interaccion["message_id"])
    except (KeyError, ValueError, TypeError) as error:
        raise HTTPException(
            status_code=502,
            detail="Identificadores de Discord invalidos",
        ) from error

    if min(guild_id, channel_id, message_id) <= 0:
        raise HTTPException(
            status_code=502,
            detail="Identificadores de Discord invalidos",
        )

    original = await verificar_destino_discord(
        guild_id,
        channel_id,
        message_id,
    )

    return {
        "interaccion_id": interaccion_id,
        "guild_id": str(guild_id),
        "channel_id": str(channel_id),
        "channel_name": original.channel.name,
        "source_message_id": str(message_id),
        "author": str(original.author),
        "original_content": original.content,
        "ready": True,
    }



@router.get("/complaints/published-responses")
def consultar_respuestas_publicadas(
    db: Session = Depends(get_db),
    usuario: User = Depends(require_role("community_manager")),
):
    from app.content_workflow.discord_response_model import DiscordResponse

    registros = (
        db.query(DiscordResponse.interaccion_id)
        .filter(DiscordResponse.estado == "publicado")
        .order_by(DiscordResponse.interaccion_id)
        .all()
    )

    return {
        "interaction_ids": [registro[0] for registro in registros]
    }


@router.post("/complaints/publish-response")
async def publicar_respuesta_queja(
    solicitud: PublicarRespuestaDiscordRequest,
    db: Session = Depends(get_db),
    usuario: User = Depends(require_role("community_manager")),
):
    interaccion = await run_in_threadpool(
        solicitar_motor,
        "GET",
        f"/api/community/messages/{solicitud.interaccion_id}",
    )

    if interaccion.get("interaccion_id") != solicitud.interaccion_id:
        raise HTTPException(
            status_code=502,
            detail="El Motor IA devolvio una interaccion diferente",
        )

    try:
        guild_id = int(interaccion["guild_id"])
        channel_id = int(interaccion["channel_id"])
        message_id = int(interaccion["message_id"])
    except (KeyError, ValueError, TypeError) as error:
        raise HTTPException(
            status_code=502,
            detail="La interaccion no contiene identificadores validos",
        ) from error

    if min(guild_id, channel_id, message_id) <= 0:
        raise HTTPException(
            status_code=502,
            detail="Identificadores de Discord invalidos",
        )

    await verificar_destino_discord(
        guild_id,
        channel_id,
        message_id,
    )

    registro = await run_in_threadpool(
        reservar_respuesta,
        db,
        interaccion_id=solicitud.interaccion_id,
        usuario_id=usuario.id,
        respuesta=solicitud.respuesta,
        guild_id=str(guild_id),
        channel_id=str(channel_id),
        source_message_id=str(message_id),
    )

    try:
        discord_message_id = await publicar_respuesta_discord(
            guild_id,
            channel_id,
            message_id,
            solicitud.respuesta,
        )
    except Exception as error:
        logger.exception(
            "Resultado de publicacion Discord desconocido. "
            "Interaccion: %s",
            solicitud.interaccion_id,
        )

        try:
            await run_in_threadpool(
                registrar_resultado_desconocido,
                db,
                registro,
                type(error).__name__,
            )
        except Exception:
            logger.exception(
                "No se pudo registrar el resultado desconocido"
            )

        raise HTTPException(
            status_code=503,
            detail=(
                "No se pudo confirmar la publicacion. "
                "El reenvio automatico esta bloqueado."
            ),
        ) from error

    try:
        await run_in_threadpool(
            confirmar_publicacion,
            db,
            registro,
            discord_message_id,
        )
    except Exception as error:
        logger.exception(
            "Discord publico la respuesta, pero fallo el registro"
        )

        try:
            db.rollback()
            await run_in_threadpool(
                registrar_resultado_desconocido,
                db,
                registro,
                (
                    "Discord confirmo el mensaje "
                    f"{discord_message_id}, pero fallo el registro"
                ),
            )
        except Exception:
            logger.exception(
                "No se pudo actualizar el estado tras el fallo"
            )

        raise HTTPException(
            status_code=503,
            detail=(
                "Discord devolvio confirmacion de envio, "
                "pero fallo el registro en PostgreSQL. "
                "No vuelva a enviar la respuesta."
            ),
        ) from error

    return {
        "estado": "publicado",
        "interaccion_id": solicitud.interaccion_id,
        "discord_message_id": discord_message_id,
        "channel_id": str(channel_id),
    }
