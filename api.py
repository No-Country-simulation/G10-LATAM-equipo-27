from dotenv import load_dotenv
from pathlib import Path
from typing import Literal
import os
import secrets

from fastapi import FastAPI, HTTPException, Header, Depends
from pydantic import BaseModel

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


load_dotenv(Path(__file__).resolve().parent / '.env')

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


def validar_token_interno(
    x_internal_token: str | None = Header(default=None),
) -> None:
    esperado = os.getenv("MOTOR_INTERNAL_TOKEN")

    if not esperado:
        raise HTTPException(
            status_code=503,
            detail="Credencial interna no configurada",
        )

    if not x_internal_token or not secrets.compare_digest(
        x_internal_token,
        esperado,
    ):
        raise HTTPException(
            status_code=403,
            detail="Acceso interno no autorizado",
        )



class SolicitudGuardarBorrador(BaseModel):
    plataforma: Literal["linkedin", "x", "discord"]
    titulo: str
    contenido: str
    llamada_accion: str | None = None
    hashtags: list[str] = []
    tono: str = "profesional"
    tipo_contenido: str = "publicacion"


@app.post(
    "/api/content/drafts",
    dependencies=[Depends(validar_token_interno)],
)
def guardar_borrador_contenido(
    solicitud: SolicitudGuardarBorrador,
):
    titulo = solicitud.titulo.strip()
    contenido = solicitud.contenido.strip()

    if not titulo or not contenido:
        raise HTTPException(
            status_code=422,
            detail="El titulo y el contenido son obligatorios",
        )

    contenido_id = guardar_contenido(
        interaccion_id=None,
        formato=solicitud.plataforma,
        titulo=titulo,
        contenido=contenido,
        llamada_accion=solicitud.llamada_accion,
        hashtags=solicitud.hashtags,
        tono=solicitud.tono,
        plataforma=solicitud.plataforma,
        tipo_contenido=solicitud.tipo_contenido,
    )

    if not contenido_id:
        raise HTTPException(
            status_code=500,
            detail="No se pudo guardar el borrador",
        )

    return {
        "id": contenido_id,
        "estado": "pendiente_revision",
        "message": "Borrador enviado a revision",
    }


class SolicitudContenido(BaseModel):
    texto: str
    canal: str
    formato: Literal["linkedin", "newsletter"]
    tono: str = "profesional"


@app.post("/api/content/generate", dependencies=[Depends(validar_token_interno)])
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


@app.post("/api/content/generate-from-interaction", dependencies=[Depends(validar_token_interno)])
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
    estado: Literal[
        "aprobado",
        "rechazado",
        "ajustes_solicitados",
    ]
    observaciones_revision: str | None = None


@app.patch(
    "/api/content/{contenido_id}/status",
    dependencies=[Depends(validar_token_interno)],
)
def cambiar_estado_contenido(
    contenido_id: int,
    solicitud: ActualizacionEstadoContenido,
):
    observaciones = (
        solicitud.observaciones_revision.strip()
        if solicitud.observaciones_revision is not None
        else None
    )

    if solicitud.estado == "ajustes_solicitados" and not observaciones:
        raise HTTPException(
            status_code=422,
            detail="Debe indicar las observaciones para solicitar ajustes.",
        )

    try:
        actualizado = actualizar_estado_contenido(
            contenido_id=contenido_id,
            nuevo_estado=solicitud.estado,
            observaciones_revision=observaciones,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=409,
            detail=str(error),
        ) from error

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
# Generación de respuestas a quejas de Discord
from servicio_respuestas import generar_respuesta_queja


class SolicitudRespuestaQueja(BaseModel):
    interaccion_id: int


@app.post(
    "/api/community/complaints/generate-response",
    dependencies=[Depends(validar_token_interno)],
)
def generar_respuesta_desde_queja(solicitud: SolicitudRespuestaQueja):
    interaccion = obtener_interaccion(solicitud.interaccion_id)

    if interaccion is None:
        raise HTTPException(
            status_code=404,
            detail="La interacción solicitada no existe.",
        )

    if not (interaccion.get("texto") or "").strip():
        raise HTTPException(
            status_code=422,
            detail="La interacción no contiene texto para responder.",
        )

    resultado = generar_respuesta_queja(
        texto=interaccion["texto"],
        canal=interaccion.get("canal") or "Discord",
    )

    return {
        "interaccion_id": interaccion["id"],
        "respuesta": resultado["respuesta"],
        "estado": "borrador",
        "requiere_revision": True,
    }


# Consulta de interacciones negativas candidatas a quejas.
# No implica que todas sean quejas confirmadas.
@app.get("/api/community/complaints")
def listar_posibles_quejas():
    from base_datos import listar_interacciones

    interacciones = listar_interacciones(limite=100)

    candidatas = [
        {
            "id": item["id"],
            "texto": item["texto"],
            "autor": item["autor"],
            "canal": item["canal"],
            "enviado_en": item["enviado_en"],
            "sentimiento": item["sentimiento"],
            "sentiment_score": item["sentiment_score"],
            "relevancia": item["relevancia"],
            "estado_analisis": item["estado"],
            "channel_id": item["channel_id"],
            "message_id": item["message_id"],
            "clasificacion": "candidata",
        }
        for item in interacciones
        if (item.get("sentimiento") or "").strip().lower() == "negativo"
    ]

    return {
        "items": candidatas,
        "total": len(candidatas),
        "clasificacion": "candidatas_por_sentimiento",
    }
