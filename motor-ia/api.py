from fastapi import Request
from dotenv import load_dotenv
from pathlib import Path
from typing import Literal
import os
import secrets

from fastapi import FastAPI, HTTPException, Header, Depends
from pydantic import BaseModel, Field

from evaluador_marca import evaluar_alineacion_marca
from servicio_contenido import generar_contenido

from publicacion_discord import (
    obtener_canales,
    publicar_contenido_discord,
)

from fastapi.middleware.cors import CORSMiddleware
from ver_json import obtener_json

from base_datos import (
    crear_tabla,
    obtener_interaccion,
    guardar_contenido,
    listar_contenidos,
    actualizar_estado_contenido,
    actualizar_contenido,
)
from base_datos import guardar_evaluacion_marca
from base_datos import obtener_estadisticas_alineacion_marca

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

@app.on_event("startup")
def inicializar_base_datos():
    crear_tabla()
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
    imagen_generada_url: str | None = Field(default=None, max_length=2048)
    imagen_generada_prompt: str | None = Field(default=None, max_length=4000)


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
        imagen_generada_url=solicitud.imagen_generada_url,
        imagen_generada_prompt=solicitud.imagen_generada_prompt,
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



class SolicitudAlineacionMarca(BaseModel):
    contenido: str = Field(min_length=1)
    plataforma: Literal["linkedin", "x", "discord"]
    origen: str = ""
    contenido_id: int | None = Field(default=None, gt=0)


@app.post(
    "/api/content/brand-alignment",
    dependencies=[Depends(validar_token_interno)],
)
def evaluar_marca_contenido(solicitud: SolicitudAlineacionMarca):
    resultado = evaluar_alineacion_marca(
        contenido=solicitud.contenido,
        plataforma=solicitud.plataforma,
        origen=solicitud.origen,
    )

    # Las evaluaciones preliminares no se registran en Analytics.
    # Solo el endpoint /brand-alignment/commit confirma la version final.
    resultado["registrada"] = False

    return resultado


class ConfirmarAlineacionMarcaRequest(BaseModel):
    contenido_id: int = Field(gt=0)
    contenido: str = Field(min_length=1)
    plataforma: Literal["linkedin", "x", "discord"]
    evaluacion: dict


@app.post("/api/content/brand-alignment/commit", dependencies=[Depends(validar_token_interno)])
def confirmar_alineacion_marca(solicitud: ConfirmarAlineacionMarcaRequest):
    # No se ejecuta una nueva evaluación; se confirma la última realizada.
    campos = ("tono_y_voz", "estructura_y_claridad", "valores_de_marca", "seguridad_y_credibilidad")
    try:
        if any(type(solicitud.evaluacion.get(c)) is not int or not 0 <= solicitud.evaluacion[c] <= 100 for c in campos):
            raise ValueError("Dimensiones de marca invalidas")
        if type(solicitud.evaluacion.get("puntuacion")) is not int:
            raise ValueError("Puntuacion invalida")
        if solicitud.evaluacion["puntuacion"] != round(sum(solicitud.evaluacion[c] for c in campos) / 4):
            raise ValueError("Puntuacion incoherente")
        evaluacion_id = guardar_evaluacion_marca(
            contenido=solicitud.contenido, plataforma=solicitud.plataforma,
            evaluacion=solicitud.evaluacion, contenido_id=solicitud.contenido_id,
        )
    except (ValueError, KeyError, TypeError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"registrada": True, "evaluacion_id": evaluacion_id}


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

class ActualizacionImagenContenido(BaseModel):
    imagen_generada_url: str | None = None


@app.patch(
    "/api/content/{contenido_id}/image",
    dependencies=[Depends(validar_token_interno)],
)
def actualizar_imagen_borrador(
    contenido_id: int,
    solicitud: ActualizacionImagenContenido,
):
    from base_datos import actualizar_imagen_contenido

    try:
        actualizado = actualizar_imagen_contenido(
            contenido_id=contenido_id,
            imagen_generada_url=solicitud.imagen_generada_url,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error

    if not actualizado:
        raise HTTPException(
            status_code=409,
            detail="El borrador no existe o no esta pendiente de revision.",
        )

    return {
        "id": contenido_id,
        "estado": "pendiente_revision",
        "imagen_generada_url": solicitud.imagen_generada_url,
        "message": "Imagen del borrador actualizada correctamente.",
    }


class ActualizacionEstadoContenido(BaseModel):
    estado: Literal[
        "aprobado",
        "rechazado",
        "ajustes_solicitados",
        "pendiente_revision",
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


class MensajeDiscordParaRecuperar(BaseModel):
    channel_id: str = Field(pattern=r"^\d{15,22}$")
    message_id: str = Field(pattern=r"^\d{15,22}$")


class SolicitudRecuperacionDiscord(BaseModel):
    mensajes: list[MensajeDiscordParaRecuperar] = Field(
        min_length=1,
        max_length=20,
    )


@app.post(
    "/api/community/discord/recover-selected",
    dependencies=[Depends(validar_token_interno)],
)
async def recuperar_mensajes_discord_seleccionados(
    solicitud: SolicitudRecuperacionDiscord,
):
    """Recupera mensajes seleccionados sin publicar en Discord."""
    import asyncio
    import discord

    from armar_json_bot_python import construir_paquete
    from procesamiento import procesar_actividad
    from publicacion_discord import CANALES_AUTORIZADOS

    for item in solicitud.mensajes:
        if item.channel_id not in CANALES_AUTORIZADOS:
            raise HTTPException(
                status_code=422,
                detail="Se solicito un canal no autorizado.",
            )

    seleccion = {
        (item.channel_id, item.message_id)
        for item in solicitud.mensajes
    }

    if len(seleccion) != len(solicitud.mensajes):
        raise HTTPException(
            status_code=422,
            detail="La seleccion contiene mensajes repetidos.",
        )

    token = os.getenv("DISCORD_TOKEN") or os.getenv("DISCORD_BOT_TOKEN")

    if not token:
        raise HTTPException(
            status_code=503,
            detail="Token de Discord no configurado.",
        )

    intents = discord.Intents.default()
    intents.message_content = True
    intents.guilds = True

    client = discord.Client(intents=intents)
    encontrados = []
    no_encontrados = []

    @client.event
    async def on_ready():
        try:
            for channel_id, message_id in seleccion:
                try:
                    canal = client.get_channel(int(channel_id))
                    if canal is None:
                        canal = await client.fetch_channel(int(channel_id))

                    mensaje = await canal.fetch_message(int(message_id))

                    if mensaje.author.bot or not mensaje.content.strip():
                        no_encontrados.append(message_id)
                        continue

                    encontrados.append(mensaje)

                except (discord.NotFound, discord.Forbidden):
                    no_encontrados.append(message_id)
        finally:
            await client.close()

    try:
        await asyncio.wait_for(client.start(token), timeout=90)
    except asyncio.TimeoutError as error:
        raise HTTPException(
            status_code=504,
            detail="Tiempo de espera agotado al consultar Discord.",
        ) from error
    except discord.DiscordException as error:
        raise HTTPException(
            status_code=502,
            detail="No fue posible consultar los mensajes de Discord.",
        ) from error
    finally:
        if not client.is_closed():
            await client.close()

    resultado = {
        "status": "exito",
        "total_solicitados": len(seleccion),
        "encontrados": len(encontrados),
        "no_encontrados": no_encontrados,
        "guardadas_nuevas": 0,
        "repetidas_omitidas": 0,
    }

    if encontrados:
        paquete = construir_paquete(encontrados)
        if paquete:
            procesamiento = procesar_actividad(paquete)

            if procesamiento.get("status") != "exito":
                raise HTTPException(
                    status_code=500,
                    detail="No fue posible procesar los mensajes recuperados.",
                )

            resultado["guardadas_nuevas"] = procesamiento["guardadas_nuevas"]
            resultado["repetidas_omitidas"] = procesamiento["repetidas_omitidas"]

    return resultado

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



def normalizar_temas_enoc(valor):
    """Convierte listas JSON o texto separado por comas en temas."""
    import json

    if valor is None:
        return []

    if isinstance(valor, str):
        try:
            valor = json.loads(valor)
        except (ValueError, TypeError):
            pass

    if isinstance(valor, list):
        return [
            str(tema).strip()
            for tema in valor
            if str(tema).strip()
        ]

    return [
        tema.strip()
        for tema in str(valor).split(",")
        if tema.strip()
    ]


@app.get("/api/community/analytics")
def analytics():
    resultado = {
        "sentiment": {
            "distribution": obtener_distribucion_sentimiento(),
            "evolution": obtener_evolucion_sentimiento(),
        },
        "topics": obtener_distribucion_temas(),
        "activity_heatmap": obtener_actividad_audiencia(),
        "hashtags": obtener_hashtags(),
        "brand_alignment": obtener_estadisticas_alineacion_marca(),
    }

    # Datos adicionales de solo lectura; no alteran los KPI locales.
    try:
        from collections import Counter
        from integracion_lectura_supabase import obtener_analisis_vinculados

        datos = obtener_analisis_vinculados()
        items = datos["items"]

        resultado["integration"] = {
            "available": True,
            "total_enoc": datos["total_enoc"],
            "total_vinculados": datos["total_vinculados"],
            "total_excluidos": datos["total_excluidos"],
            "decisiones_ia": dict(Counter(
                str(item["decision_ia"]) for item in items
            )),
            "estados_hitl": dict(Counter(
                str(item["estado_revision"]) for item in items
            )),
            "sentimientos_enoc": dict(Counter(
                str(item["sentimiento"]).strip()
                for item in items
            )),
            "temas_enoc": dict(Counter(
                tema
                for item in items
                for tema in normalizar_temas_enoc(item.get("temas_clave"))
            )),
            "relevancia_enoc": {
                "registros": len([
                    item for item in items
                    if item.get("relevancia") is not None
                ]),
                "promedio": round(
                    sum(
                        float(item["relevancia"])
                        for item in items
                        if item.get("relevancia") is not None
                    ) / max(1, sum(
                        item.get("relevancia") is not None
                        for item in items
                    )),
                    2,
                ),
            },
        }
    except Exception:
        resultado["integration"] = {"available": False}

    # Estadisticas integradas de mensajes verificados.
    # Ante un fallo de Supabase, conservar indicadores locales.
    try:
        from estadisticas_integradas import obtener_estadisticas_integradas

        estadisticas = obtener_estadisticas_integradas()
        resultado["sentiment"]["distribution"] = (
            estadisticas["sentiment"]["distribution"]
        )
        resultado["topics"] = estadisticas["topics"]
        resultado["integration"]["estadisticas_combinadas"] = (
            estadisticas["metadata"]
        )
    except Exception:
        pass

    return resultado# Generación de respuestas a quejas de Discord
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
    from discord_reacciones import obtener_reacciones

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
                "reactions": obtener_reacciones(
                    r.get("channel_id"),
                    r.get("message_id"),
                ) if r.get("channel_id") and r.get("message_id") else [],
            },
            "analysis": {
                "sentiment": normalizar_sentimiento(r.get("sentimiento")),
                "sentiment_score": float(score) if score is not None else 0.0,
                "relevance": int(relevancia) if relevancia is not None else 0,
                "curation_status": str(r.get("estado_curaduria") or "pending"),
                "discarded_at": r.get("descartado_en"),
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

    try:
        actualizado = actualizar_curaduria(interaccion_id, estado)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error

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


# Register OCI report routes after all application endpoints.
from oci_report_routes import router as oci_report_router

app.include_router(
    oci_report_router,
    dependencies=[Depends(validar_token_interno)],
)
