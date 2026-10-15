from datetime import datetime

from pydantic import BaseModel


class DiscordMessage(BaseModel):
    platform: str = "discord"

    guild_id: str
    guild_name: str

    channel_id: str
    channel_name: str

    message_id: str

    author_id: str
    author_name: str

    content: str
    created_at: datetime