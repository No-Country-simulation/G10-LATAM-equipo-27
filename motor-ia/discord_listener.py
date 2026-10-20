"""Escucha de mensajes nuevos de Discord para CloudEdTech."""

import os
import asyncio
import logging

import discord
from dotenv import load_dotenv

from armar_json_bot_python import construir_paquete
from base_datos import crear_tabla
from discord_reacciones import crear_tabla_reacciones, reemplazar_reacciones_mensaje
from procesamiento import procesar_actividad

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
logger = logging.getLogger("cloudedtech.discord")

intents = discord.Intents.default()
intents.message_content = True
intents.reactions = True

client = discord.Client(intents=intents)


@client.event
async def on_ready():
    logger.info("Bot conectado: %s", client.user)
    for guild in client.guilds:
        logger.info("Servidor: %s", guild.name)
        for channel in guild.text_channels:
            logger.info("Canal disponible: #%s (%s)", channel.name, channel.id)


@client.event
async def on_message(message):
    if message.author.bot or message.guild is None:
        return

    if not message.content.strip():
        return

    try:
        paquete = construir_paquete([message])
        if not paquete:
            return

        resultado = await asyncio.to_thread(
            procesar_actividad,
            paquete,
        )

        logger.info(
            "Mensaje %s en #%s: %s",
            message.id,
            message.channel.name,
            resultado,
        )
    except Exception:
        logger.exception(
            "Error procesando mensaje %s",
            message.id,
        )



CANALES_PERMITIDOS_REACCIONES = {
    1550016804418621452,
    1551309664397033513,
    1559244209884504245,
    1559244522842488942,
    1551309281041715230,
    1551309330198953994,
}


SERVIDOR_DISCORD_AUTORIZADO = 1550016802891898890
_bloqueo_reacciones = asyncio.Lock()


async def sincronizar_reaccion(payload):
    """Sincroniza el estado completo del mensaje desde Discord."""
    if payload.guild_id != SERVIDOR_DISCORD_AUTORIZADO:
        return

    if payload.channel_id not in CANALES_PERMITIDOS_REACCIONES:
        return

    async with _bloqueo_reacciones:
        try:
            canal = client.get_channel(payload.channel_id)

            if canal is None:
                canal = await client.fetch_channel(payload.channel_id)

            mensaje = await canal.fetch_message(payload.message_id)

            reacciones = [
                {
                    "emoji": str(reaccion.emoji),
                    "cantidad": reaccion.count,
                }
                for reaccion in mensaje.reactions
            ]

            await asyncio.to_thread(
                reemplazar_reacciones_mensaje,
                payload.guild_id,
                payload.channel_id,
                payload.message_id,
                reacciones,
            )

            logger.info(
                "Reacciones sincronizadas: mensaje=%s emojis=%s",
                payload.message_id,
                len(reacciones),
            )

        except discord.NotFound:
            logger.warning(
                "Mensaje no disponible para sincronizar: %s",
                payload.message_id,
            )
        except Exception:
            logger.exception(
                "Error sincronizando reacciones del mensaje %s",
                payload.message_id,
            )


@client.event
async def on_raw_reaction_add(payload):
    await sincronizar_reaccion(payload)


@client.event
async def on_raw_reaction_remove(payload):
    await sincronizar_reaccion(payload)



def main():
    token = os.getenv("DISCORD_BOT_TOKEN") or os.getenv("DISCORD_TOKEN")
    if not token:
        raise RuntimeError(
            "Falta DISCORD_BOT_TOKEN o DISCORD_TOKEN en el entorno."
        )

    crear_tabla()
    crear_tabla_reacciones()
    client.run(token)


if __name__ == "__main__":
    main()