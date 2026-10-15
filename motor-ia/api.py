from fastapi import Request
from dotenv import load_dotenv
from pathlib import Path
from typing import Literal
import os
import secrets

from fastapi import FastAPI, HTTPException, Header, Depends
from pydantic import BaseModel, Field

from servicio_contenido import generar_contenido

from publicacion_discord import (
    obtener_canales,
    publicar_contenido_discord,
)

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
    interaccion_id: int | None = Field(default=None, gt=0)
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

    if solicitud.interaccion_id is not None:
        if obtener_interaccion(solicitud.interaccion_id) is None:
            raise HTTPException(
                status_code=404,
                detail='La interaccion original no existe',
            )

    contenido_id = guardar_contenido(
        interaccion_id=solicitud.interaccion_id,
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
    formato: Literal["linkedin", "newsletter", "x", "discord"]
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
    formato: Literal["linkedin", "newsletter", "x", "discord"]
    tono: str = "profesional"


@app.post("/api/content/generate-from-interaction", dependencies=[Depends(validar_token_interno)])
def generar_desde_interaccion(solicitud: SolicitudContenidoInteraccion):
    interaccion = obtener_interaccion(solicitud.interaccion_id)

    if interaccion is None:
        raise HTTPException(
            status_code=404,
            detail="La interacción solicitada no existe.",
        )

    autor = str(interaccion.get("autor") or "").strip().lower()

    if autor.startswith("cloudedtech community bot"):
        raise HTTPException(
            status_code=422,
            detail="No se puede generar contenido desde mensajes del propio bot.",
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





@app.get(
    "/api/community/discord/recovery-preview",
    dependencies=[Depends(validar_token_interno)],
)
async def vista_previa_recuperacion_discord(
    canal_id: str = "",
    buscar: str = "",
    dias: int | None = 7,
    solo_pendientes: bool = True,
    pagina: int = 1,
):
    """Consulta mensajes de Discord sin guardarlos."""
    from recuperacion_discord import consultar_historial_discord

    if len(buscar) > 200:
        raise HTTPException(
            status_code=422,
            detail="El texto de busqueda es demasiado largo.",
        )

    try:
        return await consultar_historial_discord(
            canal_id=canal_id,
            buscar=buscar,
            dias=dias,
            solo_pendientes=solo_pendientes,
            pagina=pagina,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail="No fue posible consultar el historial de Discord.",
        ) from error


class SolicitudPublicacionDiscord(BaseModel):
    canal_id: str
    modo: str = "publicacion"
    mensaje_original_id: str | None = None


@app.get(
    "/api/content/discord-channels",
    dependencies=[Depends(validar_token_interno)],
)
def listar_canales_publicacion():
    return {
        "items": obtener_canales(),
    }


@app.post(
    "/api/content/{contenido_id}/publish",
    dependencies=[Depends(validar_token_interno)],
)
async def publicar_contenido(
    contenido_id: int,
    solicitud: SolicitudPublicacionDiscord,
):
    if contenido_id <= 0:
        raise HTTPException(
            status_code=422,
            detail="ID de contenido no valido.",
        )

    try:
        return await publicar_contenido_discord(
            contenido_id=contenido_id,
            canal_id=solicitud.canal_id,
            modo=solicitud.modo,
            mensaje_original_id=solicitud.mensaje_original_id,
        )

    except LookupError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        ) from error

    except ValueError as error:
        raise HTTPException(
            status_code=409,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=(
                "No se pudo confirmar la publicacion. "
                "Revise el estado antes de reintentar."
            ),
        ) from error


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


@app.get("/api/community/messages")
def consultar_mensajes_comunidad(limite: int = 100):
    """Consulta interacciones almacenadas para Ingesta Discord."""
    import json
    from base_datos import listar_interacciones

    limite = max(1, min(limite, 500))
    registros = listar_interacciones(limite=limite)

    def palabras_clave(valor):
        if not valor:
            return []
        if isinstance(valor, list):
            return [str(item).strip() for item in valor if str(item).strip()]
        try:
            parsed = json.loads(valor)
            if isinstance(parsed, list):
                return [str(item).strip() for item in parsed if str(item).strip()]
        except (TypeError, ValueError):
            pass
        return [item.strip() for item in str(valor).replace(";", ",").split(",") if item.strip()]

    def normalizar_sentimiento(valor):
        texto = str(valor or "").strip().lower()
        if texto in ("positivo", "positive"):
            return "positive"
        if texto in ("negativo", "negative"):
            return "negative"
        return "neutral"

    def obtener_adjuntos(valor):
        if not valor:
            return []
        try:
            datos = json.loads(valor) if isinstance(valor, str) else valor
        except (TypeError, ValueError):
            return []

        if not isinstance(datos, list):
            return []

        adjuntos = []
        for archivo in datos:
            if not isinstance(archivo, dict):
                continue

            url = str(archivo.get("url") or "").strip()
            nombre = str(archivo.get("filename") or "").strip()

            if not url.startswith("https://") or not nombre:
                continue

            adjuntos.append({
                "id": str(archivo.get("id") or ""),
                "filename": nombre,
                "content_type": archivo.get("content_type"),
                "size": archivo.get("size") or 0,
                "url": url,
            })

        return adjuntos

    mensajes = []

    for registro in registros:
        r = dict(registro)
        canal = str(r.get("canal") or "").lstrip("#")
        score = r.get("sentiment_score")
        relevancia = r.get("relevancia")

        mensajes.append({
            "message": {
                "platform": "discord",
                "guild_id": str(r.get("guild_id") or ""),
                "guild_name": str(r.get("guild_name") or ""),
                "channel_id": str(r.get("channel_id") or ""),
                "channel_name": canal,
                "interaction_id": int(r["id"]),
                "message_id": str(r.get("message_id") or r.get("id") or ""),
                "author_id": str(r.get("author_id") or ""),
                "author_name": str(r.get("autor") or "Usuario"),
                "content": str(r.get("texto") or ""),
                "created_at": str(r.get("enviado_en") or r.get("creado_en") or ""),
                "attachments": obtener_adjuntos(r.get("attachments")),
            },
            "analysis": {
                "sentiment": normalizar_sentimiento(r.get("sentimiento")),
                "sentiment_score": float(score) if score is not None else 0.0,
                "relevance": int(relevancia) if relevancia is not None else 0,
                "curation_status": str(r.get("estado_curaduria") or "pending"),
                "workflow_stage": str(r.get("etapa_flujo") or "ingesta"),
                "topic": str(r.get("tema") or "SIN_CLASIFICAR"),
                "keywords": palabras_clave(r.get("temas_clave")),
                "highlight": bool(
                    relevancia is not None and float(relevancia) >= 80
                ),
            },
        })

    return {
        "total": len(mensajes),
        "messages": mensajes,
    }



@app.patch("/api/community/messages/{interaccion_id}/curation")
def cambiar_curaduria_comunidad(
    interaccion_id: int,
    payload: dict,
    _autorizado: None = Depends(validar_token_interno),
):
    """Actualiza la curaduria humana de una interaccion."""
    from fastapi import HTTPException
    from base_datos import actualizar_curaduria

    estado = payload.get("status")

    if estado not in ("pending", "curated", "discarded"):
        raise HTTPException(
            status_code=422,
            detail="Estado de curaduria no valido",
        )

    actualizado = actualizar_curaduria(interaccion_id, estado)

    if not actualizado:
        raise HTTPException(
            status_code=404,
            detail="Interaccion no encontrada",
        )

    return {
        "id": interaccion_id,
        "curation_status": estado,
        "updated": True,
    }



@app.patch("/api/community/messages/{interaccion_id}/workflow")
def cambiar_etapa_comunidad(
    interaccion_id: int,
    payload: dict,
    _autorizado: None = Depends(validar_token_interno),
):
    """Avanza una interaccion a la siguiente etapa de trabajo."""
    from base_datos import actualizar_etapa_flujo

    etapa = payload.get("stage")

    if etapa not in ("en_analisis", "en_redaccion", "en_aprobacion"):
        raise HTTPException(
            status_code=422,
            detail="Etapa de destino no valida",
        )

    actualizado = actualizar_etapa_flujo(interaccion_id, etapa)

    if not actualizado:
        raise HTTPException(
            status_code=409,
            detail="Transicion no permitida, mensaje descartado o inexistente",
        )

    return {
        "id": interaccion_id,
        "workflow_stage": etapa,
        "updated": True,
    }


@app.get(
    "/api/community/messages/{interaccion_id}",
    dependencies=[Depends(validar_token_interno)],
)
def consultar_interaccion_individual(interaccion_id: int):
    if interaccion_id <= 0:
        raise HTTPException(
            status_code=422,
            detail="El identificador debe ser positivo.",
        )

    interaccion = obtener_interaccion(interaccion_id)

    if interaccion is None:
        raise HTTPException(
            status_code=404,
            detail="La interaccion no existe.",
        )

    return {
        "interaccion_id": interaccion["id"],
        "guild_id": interaccion.get("guild_id"),
        "channel_id": interaccion.get("channel_id"),
        "message_id": interaccion.get("message_id"),
        "autor": interaccion.get("autor"),
        "texto": interaccion.get("texto"),
    }
