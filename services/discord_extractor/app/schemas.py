"""Modelos Pydantic: entrada de la API y formato de salida CommunityLab."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class Interaccion(BaseModel):
    """Una interaccion individual, en el formato que consume el pipeline de IA."""

    id: str
    autor: str
    canal: str
    tipo: str = "sin_clasificar"
    texto: str
    fecha: datetime
    respuesta_a: str | None = None
    reacciones: int = 0
    adjuntos: list[str] = Field(default_factory=list)


class PaqueteInteracciones(BaseModel):
    """El JSON completo que se sube a OCI Object Storage."""

    origen_comunidad: str
    periodo_referencia: str
    extraido_en: datetime
    interacciones: list[Interaccion]


class CanalInfo(BaseModel):
    """Respuesta de GET /channels."""

    id: str
    name: str
    category: str | None = None


class ExtractRequest(BaseModel):
    """Cuerpo de POST /extract."""

    channel_ids: list[str] = Field(..., min_length=1)
    desde: datetime | None = None
    hasta: datetime | None = None
    max_mensajes_por_canal: int = Field(default=500, ge=1, le=5000)
    periodo_referencia: str
    subir_a_oci: bool = True


class AlmacenamientoOCI(BaseModel):
    bucket: str
    ruta_objeto: str
    status: str


class ExtractResponse(BaseModel):
    """Respuesta de POST /extract."""

    status: str
    total_interacciones_procesadas: int
    interacciones_por_canal: dict[str, int]
    almacenamiento_oci: AlmacenamientoOCI | None = None
    paquete: PaqueteInteracciones | None = None
