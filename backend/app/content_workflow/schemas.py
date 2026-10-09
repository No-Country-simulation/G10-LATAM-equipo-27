from typing import Literal

from pydantic import BaseModel, Field


PlataformaContenido = Literal[
    "linkedin",
    "x",
    "discord",
]


class CrearContenidoRequest(BaseModel):
    plataforma: PlataformaContenido
    titulo: str = Field(min_length=1, max_length=200)
    contenido: str = Field(min_length=1)
    llamada_accion: str | None = None
    hashtags: list[str] = Field(default_factory=list)
    tono: str = "profesional"
    tipo_contenido: str = "publicacion"


class ActualizarContenidoRequest(BaseModel):
    titulo: str = Field(min_length=1, max_length=200)
    contenido: str = Field(min_length=1)
    llamada_accion: str | None = None
    hashtags: list[str] = Field(default_factory=list)


class ContenidoGuardadoResponse(BaseModel):
    id: int
    estado: str
    message: str


class RevisarContenidoRequest(BaseModel):
    estado: Literal[
        "aprobado",
        "rechazado",
        "ajustes_solicitados",
    ]
    observaciones_revision: str | None = Field(
        default=None,
        max_length=2000,
    )
