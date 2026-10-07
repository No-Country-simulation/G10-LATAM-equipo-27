from typing import Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from servicio_contenido import generar_contenido
from fastapi.middleware.cors import CORSMiddleware
from ver_json import obtener_json
from servicio_contenido import generar_contenido
from fastapi.middleware.cors import CORSMiddleware
from ver_json import obtener_json

from base_datos import (
    obtener_interaccion,
    guardar_contenido,
    listar_contenidos,
    actualizar_estado_contenido,
    actualizar_contenido,
)

from servicio_dashboard import (
    obtener_dashboard,
    obtener_distribucion_sentimiento,
    obtener_distribucion_temas,
    obtener_evolucion_sentimiento,
    obtener_actividad_audiencia,
    obtener_hashtags,
)

app = FastAPI(
    title="CloudEdTech AI & Community API",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def adaptar_mensaje(item: dict) -> dict:
    mapa_sentimiento = {
        "Positivo": "positive",
        "Neutral": "neutral",
        "Negativo": "negative",
    }

    sentimiento = mapa_sentimiento.get(
        item.get("sentimiento"),
        "neutral",
    )

    temas = item.get("temas_clave") or ""

    keywords = [
        tema.lstrip("#").rstrip(",")
        for tema in temas.split()
        if tema.startswith("#")
    ]

    return {
        "message": {
            "platform": "discord",
            "guild_id": item.get("guild_id"),
            "guild_name": item.get("guild_name"),
            "channel_id": item.get("channel_id"),
            "channel_name": item.get("canal"),
            "message_id": item.get("message_id"),
            "author_id": item.get("author_id"),
            "author_name": item.get("autor"),
            "content": item.get("texto"),
            "created_at": item.get("enviado_en"),
        },
        "analysis": {
            "sentiment": sentimiento,
            # Confianza real generada por el modelo para la clasificación del sentimiento.
            "sentiment_score": item.get("sentiment_score") or 0.0,
            "topic": temas,
            "keywords": keywords,
            "highlight": (item.get("relevancia") or 0) >= 70,
        },
    }
class SolicitudContenido(BaseModel):
    texto: str
    canal: str
    formato: Literal["linkedin", "newsletter"]
    tono: str = "profesional"


@app.post("/api/content/generate")
def generar_borrador(solicitud: SolicitudContenido):
    return generar_contenido(
        texto=solicitud.texto,
        canal=solicitud.canal,
        formato=solicitud.formato,
        tono=solicitud.tono,
    )

class SolicitudContenidoInteraccion(BaseModel):
    interaccion_id: int
    formato: Literal["linkedin", "newsletter"]
    tono: str = "profesional"


@app.post("/api/content/generate-from-interaction")
def generar_desde_interaccion(solicitud: SolicitudContenidoInteraccion):
    interaccion = obtener_interaccion(solicitud.interaccion_id)

    if interaccion is None:
        raise HTTPException(
            status_code=404,
            detail="La interacción solicitada no existe.",
        )

    contenido = generar_contenido(
        texto=interaccion["texto"],
        canal=interaccion["canal"],
        formato=solicitud.formato,
        tono=solicitud.tono,
    )
    contenido_id = guardar_contenido(
        interaccion_id=interaccion["id"],
        formato=contenido["formato"],
        titulo=contenido["titulo"],
        contenido=contenido["contenido"],
        llamada_accion=contenido["llamada_accion"],
        hashtags=contenido["hashtags"],
        tono=solicitud.tono,
    )

    return {
        "contenido_id": contenido_id,
        "interaccion_id": interaccion["id"],
        "origen": {
            "plataforma": "discord",
            "canal": interaccion["canal"],
            "tema": interaccion["tema"],
            "segmento": interaccion["segmento"],
        },
        "borrador": contenido,
        "estado": "pendiente_revision",
    }

@app.get("/api/community/dashboard")
def dashboard():
    return obtener_dashboard()

@app.get("/api/content")
def obtener_contenidos(estado: str | None = None):
    return {
        "items": listar_contenidos(estado=estado),
    }

class ActualizacionEstadoContenido(BaseModel):
    estado: Literal["aprobado", "rechazado"]


@app.patch("/api/content/{contenido_id}/status")
def cambiar_estado_contenido(
    contenido_id: int,
    solicitud: ActualizacionEstadoContenido,
):
    actualizado = actualizar_estado_contenido(
        contenido_id=contenido_id,
        nuevo_estado=solicitud.estado,
    )

    if not actualizado:
        raise HTTPException(
            status_code=404,
            detail="El contenido solicitado no existe.",
        )

    return {
        "id": contenido_id,
        "estado": solicitud.estado,
        "message": "Estado actualizado correctamente.",
    }

@app.get("/api/community/analytics")
def analytics():
    return {
    "sentiment": {
        "distribution": obtener_distribucion_sentimiento(),
        "evolution": obtener_evolucion_sentimiento(),
    },
    "topics": obtener_distribucion_temas(),
    "activity_heatmap": obtener_actividad_audiencia(),
    "hashtags": obtener_hashtags(),
}