from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class Interaccion(BaseModel):
    # Campos originales del motor
    autor: str = Field(min_length=1)
    canal: str = Field(min_length=1)
    tipo: Optional[str] = None
    texto: str = Field(min_length=1)

    # Metadatos originales de Discord.
    # Son opcionales para mantener compatibilidad con datos históricos.
    guild_id: Optional[str] = None
    guild_name: Optional[str] = None
    channel_id: Optional[str] = None
    message_id: Optional[str] = None
    author_id: Optional[str] = None
    created_at: Optional[datetime] = None


class SolicitudActividad(BaseModel):
    origen_comunidad: str = Field(min_length=1)
    periodo_referencia: str = Field(min_length=1)
    interacciones: List[Interaccion] = Field(min_length=1)