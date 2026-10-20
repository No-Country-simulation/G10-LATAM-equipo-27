"""Sincroniza reacciones existentes de mensajes Discord ya registrados."""

import asyncio
import logging
import os
import sqlite3

import discord
from dotenv import load_dotenv

from base_datos import RUTA_BD
from discord_reacciones import (
    crear_tabla_reacciones,
    reemplazar_reacciones_mensaje,
)

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
logger = logging.getLogger("cloudedtech.reacciones.historicas")

CANALES_AUTORIZADOS = {
    1550016804418621452,
    1551309664397033513,
    1559244209884504245,
    1559244522842488942,
    1551309281041715230,
    1551309330198953994,
}

PAUSA_SEGUNDOS = 1.5


def obtener_mensajes_registrados():
    with sqlite3.connect(RUTA_BD, timeout=30) as conexion:
        filas = conexion.execute(
            """
            SELECT guild_id, channel_id, message_id
            FROM interacciones
            WHERE channel_id IS NOT NULL
              AND message_id IS NOT NULL
            ORDER BY id ASC
            """
        ).fetchall()

    return [
        (guild_id, int(channel_id), int(message_id))
        for guild_id, channel_id, message_id in filas
        if str(channel_id).isdigit()
        and str(message_id).isdigit()
        and int(channel_id) in CANALES_AUTORIZADOS
    ]


async def sincronizar():
    token = os.getenv("DISCORD_BOT_TOKEN") or os.getenv("DISCORD_TOKEN")

    if not token:
        raise RuntimeError("Falta el token de Discord.")

    mensajes = obtener_mensajes_registrados()
    logger.info("Mensajes registrados para consultar: %s", len(mensajes))

    intents = discord.Intents.default()
    intents.reactions = True

    client = discord.Client(intents=intents)

    @client.event
    async def on_ready():
        logger.info("Conexion de lectura establecida con Discord.")

        consultados = 0
        sincronizados = 0
        errores = 0

        try:
            crear_tabla_reacciones()

            for guild_id, channel_id, message_id in mensajes:
                try:
                    canal = client.get_channel(channel_id)

                    if canal is None:
                        canal = await client.fetch_channel(channel_id)

                    mensaje = await canal.fetch_message(message_id)
                    consultados += 1

                    reacciones = [
                        {
                            "emoji": str(reaccion.emoji),
                            "cantidad": reaccion.count,
                        }
                        for reaccion in mensaje.reactions
                    ]

                    await asyncio.to_thread(
                        reemplazar_reacciones_mensaje,
                        guild_id,
                        channel_id,
                        message_id,
                        reacciones,
                    )

                    sincronizados += len(reacciones)

                except (discord.NotFound, discord.Forbidden):
                    errores += 1
                    logger.warning(
                        "Mensaje inaccesible: canal=%s mensaje=%s",
                        channel_id,
                        message_id,
                    )

                except Exception:
                    errores += 1
                    logger.exception(
                        "Error consultando mensaje %s",
                        message_id,
                    )

                await asyncio.sleep(PAUSA_SEGUNDOS)

        finally:
            logger.info(
                "Finalizado: consultados=%s emojis=%s errores=%s",
                consultados,
                sincronizados,
                errores,
            )
            await client.close()

    await client.start(token)


if __name__ == "__main__":
    asyncio.run(sincronizar())
