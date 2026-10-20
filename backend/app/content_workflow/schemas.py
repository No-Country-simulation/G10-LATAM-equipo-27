from typing import Literal

from pydantic import BaseModel, Field


PlataformaContenido = Literal[
    "linkedin",
    "x",
    "discord",
]


class CrearContenidoRequest(BaseModel):
    interaccion_id: int | None = Field(default=None, gt=0)
    plataforma: PlataformaContenido
    titulo: str = Field(min_length=1, max_length=200)
    contenido: str = Field(min_length=1)
    llamada_accion: str | None = None
    hashtags: list[str] = Field(default_factory=list)
    tono: str = "profesional"
    tipo_contenido: str = "publicacion"
    imagen_generada_url: str | None = Field(default=None, max_length=2048)
    imagen_generada_prompt: str | None = Field(default=None, max_length=4000)


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
        "pendiente_revision",
    ]
    observaciones_revision: str | None = Field(
        default=None,
        max_length=2000,
    )
