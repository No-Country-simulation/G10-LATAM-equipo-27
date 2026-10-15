import discord

from app.discord_connector.config import (
    DISCORD_BOT_TOKEN,
    DISCORD_GUILD_ID,
    DISCORD_CHANNEL_IDS,
)
from app.discord_connector.schemas import DiscordMessage
from app.ingestion.service import ingest_discord_message


intents = discord.Intents.default()
intents.message_content = True


class CloudedTechBot(discord.Client):

    async def on_ready(self):
        print("=" * 60)
        print("CloudedTech Community Bot conectado correctamente")
        print(f"Bot: {self.user}")

        guild = self.get_guild(DISCORD_GUILD_ID)

        if guild:
            print(f"Servidor autorizado: {guild.name}")
            print(f"Canales autorizados: {len(DISCORD_CHANNEL_IDS)}")
        else:
            print("ADVERTENCIA: No se encontró el servidor autorizado.")

        print("=" * 60)

    async def on_message(self, message):


        # Ignorar mensajes de bots
        if message.author.bot:
            return

        # Ignorar mensajes privados
        if message.guild is None:
            return

        # Solo servidor autorizado
        if message.guild.id != DISCORD_GUILD_ID:
            return

        # Solo canales autorizados
        if message.channel.id not in DISCORD_CHANNEL_IDS:
            return

        # Normalizar el mensaje de Discord
        discord_message = DiscordMessage(
            guild_id=str(message.guild.id),
            guild_name=message.guild.name,
            channel_id=str(message.channel.id),
            channel_name=message.channel.name,
            message_id=str(message.id),
            author_id=str(message.author.id),
            author_name=str(message.author),
            content=message.content,
            created_at=message.created_at,
        )   

        print("\n[COMMUNITYLAB] Mensaje normalizado")
        print(
            discord_message.model_dump_json(
                indent=2
            )
        )
        
        await ingest_discord_message(discord_message)


bot = CloudedTechBot(intents=intents)


if __name__ == "__main__":
    bot.run(DISCORD_BOT_TOKEN)