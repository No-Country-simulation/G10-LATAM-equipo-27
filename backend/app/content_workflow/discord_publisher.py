import discord
from fastapi import HTTPException

from app.discord_connector.bot import bot
from app.discord_connector.config import (
    DISCORD_GUILD_ID,
    DISCORD_CHANNEL_IDS,
)


async def verificar_destino_discord(
    guild_id: int,
    channel_id: int,
    source_message_id: int,
) -> discord.Message:
    if guild_id != DISCORD_GUILD_ID:
        raise HTTPException(
            status_code=403,
            detail="Servidor Discord no autorizado",
        )

    if channel_id not in DISCORD_CHANNEL_IDS:
        raise HTTPException(
            status_code=403,
            detail="Canal Discord no autorizado",
        )

    if bot.is_closed() or not bot.is_ready():
        raise HTTPException(
            status_code=503,
            detail="El bot de Discord no esta disponible",
        )

    guild = bot.get_guild(guild_id)

    if guild is None:
        raise HTTPException(
            status_code=503,
            detail="Servidor no disponible para el bot",
        )

    channel = guild.get_channel(channel_id)

    if not isinstance(channel, discord.TextChannel):
        raise HTTPException(
            status_code=422,
            detail="Canal de texto no valido",
        )

    try:
        original = await channel.fetch_message(source_message_id)
    except discord.NotFound as error:
        raise HTTPException(
            status_code=404,
            detail="El mensaje original no existe",
        ) from error
    except discord.Forbidden as error:
        raise HTTPException(
            status_code=403,
            detail="Sin permisos para consultar el mensaje",
        ) from error
    except discord.HTTPException as error:
        raise HTTPException(
            status_code=503,
            detail="No se pudo verificar el mensaje en Discord",
        ) from error

    if original.guild.id != guild_id or original.channel.id != channel_id:
        raise HTTPException(
            status_code=409,
            detail="El mensaje no coincide con el destino",
        )

    permisos = channel.permissions_for(guild.me)

    if not (
        permisos.view_channel
        and permisos.send_messages
        and permisos.read_message_history
    ):
        raise HTTPException(
            status_code=403,
            detail="El bot no tiene permisos suficientes",
        )

    return original


async def publicar_respuesta_discord(
    guild_id: int,
    channel_id: int,
    source_message_id: int,
    respuesta: str,
) -> str:
    if not respuesta.strip() or len(respuesta) > 2000:
        raise HTTPException(
            status_code=422,
            detail="La respuesta debe contener entre 1 y 2000 caracteres",
        )

    original = await verificar_destino_discord(
        guild_id,
        channel_id,
        source_message_id,
    )

    enviado = await original.reply(
        content=respuesta,
        mention_author=False,
        allowed_mentions=discord.AllowedMentions.none(),
    )

    return str(enviado.id)
