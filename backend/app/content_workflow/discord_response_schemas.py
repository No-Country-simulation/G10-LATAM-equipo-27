from typing import Literal

from pydantic import BaseModel, Field, field_validator


class PublicarRespuestaDiscordRequest(BaseModel):
    interaccion_id: int = Field(gt=0)
    respuesta: str = Field(min_length=1, max_length=2000)
    confirmado: Literal[True]

    @field_validator("respuesta")
    @classmethod
    def validar_respuesta(cls, valor: str) -> str:
        respuesta = valor.strip()

        if not respuesta:
            raise ValueError("La respuesta no puede estar vacia")

        return respuesta
