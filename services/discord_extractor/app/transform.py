"""Transforma mensajes crudos de la API de Discord al formato de Interaccion."""

from __future__ import annotations

from typing import Any

from app.schemas import Interaccion


def _nombre_autor(mensaje: dict[str, Any]) -> str:
    """Apodo del servidor si esta disponible, si no el nombre global/usuario."""
    member = mensaje.get("member") or {}
    if member.get("nick"):
        return member["nick"]
    author = mensaje.get("author") or {}
    return author.get("global_name") or author.get("username") or "desconocido"


def _es_de_bot(mensaje: dict[str, Any]) -> bool:
    """True solo para bots automatizados reales, no para mensajes de webhook.

    Discord marca author.bot=True tanto en mensajes de bots automatizados
    como en mensajes enviados via webhook (por ejemplo, scripts que simulan
    distintos usuarios para generar datos de prueba). Estos ultimos traen
    ademas un webhook_id y deben tratarse como contenido normal de la
    comunidad, no descartarse.
    """
    author = mensaje.get("author") or {}
    return bool(author.get("bot")) and not mensaje.get("webhook_id")


def mensaje_a_interaccion(mensaje: dict[str, Any], *, canal_nombre: str) -> Interaccion | None:
    """Convierte un mensaje de Discord en una Interaccion, o None si debe descartarse.

    Se descartan los mensajes de bots automatizados reales (ver _es_de_bot)
    y los que no tienen texto (por ejemplo, mensajes que solo traen un
    adjunto o un embed sin contenido).
    """
    if _es_de_bot(mensaje):
        return None

    texto = (mensaje.get("content") or "").strip()
    if not texto:
        return None

    referencia = mensaje.get("message_reference") or {}
    reacciones = sum(r.get("count", 0) for r in mensaje.get("reactions") or [])
    adjuntos = [a["url"] for a in mensaje.get("attachments") or [] if a.get("url")]

    return Interaccion(
        id=mensaje["id"],
        autor=_nombre_autor(mensaje),
        canal=f"#{canal_nombre}",
        texto=texto,
        fecha=mensaje["timestamp"],
        respuesta_a=referencia.get("message_id"),
        reacciones=reacciones,
        adjuntos=adjuntos,
    )
