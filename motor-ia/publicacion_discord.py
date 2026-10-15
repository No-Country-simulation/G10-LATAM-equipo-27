import asyncio
import os
from pathlib import Path

import discord
from dotenv import load_dotenv

from base_datos import RUTA_BD
from publicacion_discord_db import (
    reservar_publicacion,
    confirmar_publicacion,
    marcar_resultado_desconocido,
    liberar_reserva_sin_envio,
    registrar_mensaje_pendiente,
)

import sqlite3


CANALES_AUTORIZADOS = {
    "1550016804418621452": "general",
    "1551309664397033513": "faq",
    "1559244209884504245": "pqrs",
    "1559244522842488942": "notificaciones",
    "1551309281041715230": "chat-egresados",
    "1551309330198953994": "oportunidades-laborales",
}


def obtener_canales():
    return [
        {"id": canal_id, "nombre": nombre}
        for canal_id, nombre in CANALES_AUTORIZADOS.items()
    ]


def construir_mensaje(item: dict) -> str:
    partes = [
        str(item.get("titulo") or "").strip(),
        str(item.get("contenido") or "").strip(),
        str(item.get("llamada_accion") or "").strip(),
    ]

    hashtags = item.get("hashtags")

    if isinstance(hashtags, str):
        hashtags = hashtags.strip()
    elif isinstance(hashtags, list):
        hashtags = " ".join(str(tag) for tag in hashtags)
    else:
        hashtags = ""

    if hashtags:
        partes.append(hashtags)

    mensaje = "\n\n".join(
        parte for parte in partes if parte
    )

    if not mensaje:
        raise ValueError("El contenido esta vacio.")

    if len(mensaje) > 2000:
        raise ValueError(
            "El mensaje supera los 2000 caracteres."
        )

    return mensaje


def obtener_contenido(contenido_id: int) -> dict:
    conexion = sqlite3.connect(RUTA_BD)
    conexion.row_factory = sqlite3.Row

    try:
        fila = conexion.execute(
            """
            SELECT id, titulo, contenido,
                   llamada_accion, hashtags,
                   estado, estado_publicacion
            FROM contenidos_generados
            WHERE id = ?
            """,
            (contenido_id,),
        ).fetchone()

        if fila is None:
            raise LookupError("El contenido no existe.")

        return dict(fila)

    finally:
        conexion.close()



async def publicar_contenido_discord(
    contenido_id: int,
    canal_id: str,
    modo: str = "publicacion",
    mensaje_original_id: str | None = None,
) -> dict:
    if modo not in {"publicacion", "respuesta"}:
        raise ValueError("Modo de publicacion invalido.")

    if modo == "respuesta":
        if not mensaje_original_id or not str(mensaje_original_id).isdigit():
            raise ValueError("Mensaje original invalido.")

    canal_id = str(canal_id)

    if modo == "respuesta":
        with sqlite3.connect(RUTA_BD) as conexion:
            conexion.row_factory = sqlite3.Row
            origen = conexion.execute(
                """
                SELECT i.channel_id, i.message_id, i.autor
                FROM contenidos_generados AS c
                JOIN interacciones AS i ON i.id = c.interaccion_id
                WHERE c.id = ?
                """,
                (contenido_id,),
            ).fetchone()

        if origen is None:
            raise ValueError("El contenido no tiene una interaccion original.")

        if str(origen["channel_id"] or "") != canal_id:
            raise ValueError("El canal no coincide con el mensaje original.")

        if str(origen["message_id"] or "") != str(mensaje_original_id):
            raise ValueError("El mensaje original no pertenece al contenido.")

        autor = str(origen["autor"] or "").lower()
        if "cloudedtech community bot" in autor:
            raise ValueError("No se permite responder a mensajes del propio bot.")

    if canal_id not in CANALES_AUTORIZADOS:
        raise ValueError("Canal de Discord no autorizado.")

    item = obtener_contenido(contenido_id)

    if item["estado"] != "aprobado":
        raise ValueError("El contenido debe estar aprobado.")

    if item["estado_publicacion"] != "no_publicado":
        raise ValueError(
            "El contenido ya tiene un intento de publicacion."
        )

    mensaje = construir_mensaje(item)

    env_path = Path(__file__).resolve().parent / ".env"
    load_dotenv(dotenv_path=env_path)

    token = os.getenv("DISCORD_TOKEN")

    if not token:
        raise RuntimeError("DISCORD_TOKEN no configurado.")

    intents = discord.Intents.default()
    intents.guilds = True

    client = discord.Client(intents=intents)

    resultado = {}
    iniciado = False
    reservado = False
    envio_iniciado = False

    @client.event
    async def on_ready():
        nonlocal iniciado, reservado, envio_iniciado

        if iniciado:
            return

        iniciado = True

        try:
            canal = client.get_channel(int(canal_id))

            if not isinstance(canal, discord.TextChannel):
                raise RuntimeError(
                    "El canal no esta disponible."
                )

            miembro = canal.guild.me

            if miembro is None:
                raise RuntimeError(
                    "No se pudo verificar el bot."
                )

            permisos = canal.permissions_for(miembro)

            if not (
                permisos.view_channel
                and permisos.send_messages
            ):
                raise PermissionError(
                    "Permisos insuficientes."
                )

            if modo == "respuesta":
                try:
                    mensaje_origen = await canal.fetch_message(int(mensaje_original_id))
                except discord.NotFound as error:
                    raise ValueError("El mensaje original ya no existe.") from error
                except discord.Forbidden as error:
                    raise ValueError("Sin permisos para consultar el mensaje.") from error
                if mensaje_origen.author.id == client.user.id:
                    raise ValueError("No se permite responder al propio bot.")

            reservar_publicacion(
                contenido_id,
                canal_id,
            )

            reservado = True

            # Desde este punto no se puede garantizar
            # que un fallo implique ausencia de envio.
            envio_iniciado = True

            referencia = None

            if modo == "respuesta":
                referencia = discord.MessageReference(
                    message_id=int(mensaje_original_id),
                    channel_id=canal.id,
                    guild_id=canal.guild.id,
                    fail_if_not_exists=True,
                )

            enviado = await canal.send(
                mensaje,
                reference=referencia,
                allowed_mentions=discord.AllowedMentions.none(),
            )

            resultado["mensaje_id"] = str(enviado.id)

            confirmar_publicacion(
                contenido_id,
                canal_id,
                resultado["mensaje_id"],
            )

            resultado["estado_publicacion"] = "publicado"

        except asyncio.CancelledError:
            if reservado:
                if envio_iniciado:
                    try:
                        if resultado.get("mensaje_id"):
                            registrar_mensaje_pendiente(
                                contenido_id,
                                canal_id,
                                resultado["mensaje_id"],
                                "Envio cancelado antes de finalizar.",
                            )
                        else:
                            marcar_resultado_desconocido(
                                contenido_id,
                                "Envio cancelado; resultado desconocido.",
                            )
                    except Exception:
                        pass
                else:
                    # No se llamo a Discord: conservar la reserva
                    # si no puede liberarse de forma segura.
                    try:
                        liberar_reserva_sin_envio(
                            contenido_id,
                            canal_id,
                        )
                    except Exception:
                        pass

            raise

        except Exception as error:
            resultado["error"] = str(error)

            if reservado:
                if envio_iniciado:
                    if resultado.get("mensaje_id"):
                        registrar_mensaje_pendiente(
                            contenido_id,
                            canal_id,
                            resultado["mensaje_id"],
                            str(error),
                        )
                    else:
                        marcar_resultado_desconocido(
                            contenido_id,
                            str(error),
                        )
                else:
                    liberar_reserva_sin_envio(
                        contenido_id,
                        canal_id,
                    )

        finally:
            await client.close()

    try:
        await asyncio.wait_for(
            client.start(token, reconnect=False),
            timeout=60,
        )

    except Exception as error:
        if reservado:
            if envio_iniciado:
                marcar_resultado_desconocido(
                    contenido_id,
                    str(error),
                )
            else:
                liberar_reserva_sin_envio(
                    contenido_id,
                    canal_id,
                )

        raise RuntimeError(
            "Fallo la conexion o publicacion en Discord."
        ) from error

    finally:
        if not client.is_closed():
            await client.close()

    if "error" in resultado:
        raise RuntimeError(resultado["error"])

    if resultado.get("estado_publicacion") != "publicado":
        raise RuntimeError(
            "Discord no confirmo la publicacion."
        )

    return {
        "id": contenido_id,
        "canal_id": canal_id,
        "mensaje_id": resultado["mensaje_id"],
        "estado_publicacion": "publicado",
    }
