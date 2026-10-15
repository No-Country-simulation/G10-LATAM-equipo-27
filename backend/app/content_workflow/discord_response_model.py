from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class DiscordResponse(Base):
    __tablename__ = "discord_responses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    interaccion_id: Mapped[int] = mapped_column(
        Integer, unique=True, nullable=False
    )

    authorized_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    respuesta: Mapped[str] = mapped_column(Text, nullable=False)

    guild_id: Mapped[str] = mapped_column(String(32), nullable=False)
    channel_id: Mapped[str] = mapped_column(String(32), nullable=False)
    source_message_id: Mapped[str] = mapped_column(String(32), nullable=False)

    discord_message_id: Mapped[str | None] = mapped_column(
        String(32), nullable=True
    )

    estado: Mapped[str] = mapped_column(
        String(30), nullable=False, server_default="enviando"
    )

    intento_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    publicado_en: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    error_detalle: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
