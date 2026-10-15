import os
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path

import discord
from dotenv import load_dotenv

from base_datos import RUTA_BD
from publicacion_discord import CANALES_AUTORIZADOS


MAX_INSPECCION = 300
TAMANO_PAGINA = 20


def obtener_ids_recuperados():
    with sqlite3.connect(RUTA_BD) as conexion:
        filas = conexion.execute(
            """
            SELECT channel_id, message_id
            FROM interacciones
            WHERE channel_id IS NOT NULL
              AND message_id IS NOT NULL
            """
        ).fetchall()

    return {
        (str(canal), str(mensaje))
        for canal, mensaje in filas
    }


async def consultar_historial_discord(
    canal_id: str = "",
    buscar: str = "",
    dias: int | None = 7,
    solo_pendientes: bool = True,
    pagina: int = 1,
):
    if canal_id and canal_id not in CANALES_AUTORIZADOS:
        raise ValueError("Canal no autorizado.")

    if pagina < 1:
        raise ValueError("Pagina invalida.")

    if dias is not None and dias not in (1, 7, 30):
        raise ValueError("Periodo invalido.")

    load_dotenv(Path(__file__).resolve().parent / ".env")

    token = os.getenv("DISCORD_TOKEN") or os.getenv("DISCORD_BOT_TOKEN")
    if not token:
        raise RuntimeError("Token de Discord no configurado.")

    ids_existentes = obtener_ids_recuperados()

    fecha_minima = (
        datetime.now(timezone.utc) - timedelta(days=dias)
        if dias is not None
        else None
    )

    canales = (
        {canal_id: CANALES_AUTORIZADOS[canal_id]}
        if canal_id
        else CANALES_AUTORIZADOS
    )

    resultados = []
    busqueda = buscar.strip().casefold()

    intents = discord.Intents.default()
    intents.message_content = True
    intents.guilds = True

    client = discord.Client(intents=intents)

    @client.event
    async def on_ready():
        try:
            for identificador, nombre in canales.items():
                canal = client.get_channel(int(identificador))

                if canal is None:
                    canal = await client.fetch_channel(int(identificador))

                async for mensaje in canal.history(
                    limit=MAX_INSPECCION,
                    after=fecha_minima,
                ):
                    if not mensaje.content.strip():
                        continue

                    recuperado = (
                        str(identificador),
                        str(mensaje.id),
                    ) in ids_existentes

                    if solo_pendientes and recuperado:
                        continue

                    autor = str(mensaje.author)
                    texto = mensaje.content

                    if busqueda and busqueda not in (
                        autor + " " + texto
                    ).casefold():
                        continue

                    resultados.append({
                        "message_id": str(mensaje.id),
                        "channel_id": str(identificador),
                        "canal": nombre,
                        "autor": autor,
                        "texto": texto,
                        "fecha": mensaje.created_at.isoformat(),
                        "recuperado": recuperado,
                    })
        finally:
            await client.close()

    try:
        await client.start(token)
    finally:
        if not client.is_closed():
            await client.close()

    resultados.sort(
        key=lambda item: item["fecha"],
        reverse=True,
    )

    inicio = (pagina - 1) * TAMANO_PAGINA
    fin = inicio + TAMANO_PAGINA

    return {
        "mensajes": resultados[inicio:fin],
        "total": len(resultados),
        "pagina": pagina,
        "tamano_pagina": TAMANO_PAGINA,
        "limite_inspeccion_por_canal": MAX_INSPECCION,
    }
