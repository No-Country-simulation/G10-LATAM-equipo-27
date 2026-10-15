from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.content_workflow.discord_response_model import DiscordResponse


def reservar_respuesta(
    db: Session,
    *,
    interaccion_id: int,
    usuario_id: int,
    respuesta: str,
    guild_id: str,
    channel_id: str,
    source_message_id: str,
) -> DiscordResponse:
    registro = DiscordResponse(
        interaccion_id=interaccion_id,
        authorized_by_user_id=usuario_id,
        respuesta=respuesta,
        guild_id=guild_id,
        channel_id=channel_id,
        source_message_id=source_message_id,
        estado="enviando",
    )

    try:
        db.add(registro)
        db.commit()
        db.refresh(registro)
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=(
                "Esta interaccion ya tiene un intento de respuesta "
                "registrado. No se permite el reenvio automatico."
            ),
        ) from error

    return registro


def confirmar_publicacion(
    db: Session,
    registro: DiscordResponse,
    discord_message_id: str,
) -> None:
    registro.discord_message_id = discord_message_id
    registro.estado = "publicado"
    registro.publicado_en = datetime.now(timezone.utc)
    registro.error_detalle = None
    db.commit()


def registrar_resultado_desconocido(
    db: Session,
    registro: DiscordResponse,
    detalle: str,
) -> None:
    registro.estado = "resultado_desconocido"
    registro.error_detalle = detalle[:2000]
    db.commit()
