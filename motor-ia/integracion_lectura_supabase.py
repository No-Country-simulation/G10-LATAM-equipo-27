"""Lectura segura de analisis de Enoc vinculados por identidad de Tania."""

import os
import sqlite3
from pathlib import Path

import psycopg2
from dotenv import load_dotenv


def obtener_analisis_vinculados() -> dict:
    """Consulta tres bases en modo lectura, sin modificar registros."""
    load_dotenv(Path(__file__).with_name(".env"))

    ruta_local = Path(__file__).with_name("communitylab.db")
    conexiones = []

    try:
        local = sqlite3.connect(
            f"file:{ruta_local.resolve().as_posix()}?mode=ro",
            uri=True,
        )
        conexiones.append(local)

        tania = psycopg2.connect(
            os.environ["DATABASE_URL"],
            sslmode="require",
            connect_timeout=8,
        )
        tania.set_session(readonly=True, autocommit=True)
        conexiones.append(tania)

        enoc = psycopg2.connect(
            os.environ["SUPABASE_DB_URL"],
            sslmode="require",
            connect_timeout=8,
        )
        enoc.set_session(readonly=True, autocommit=True)
        conexiones.append(enoc)

        locales = {
            str(hash_mensaje).lower(): int(id_local)
            for id_local, hash_mensaje in local.execute(
                "SELECT id, hash FROM interacciones WHERE hash IS NOT NULL"
            )
        }

        with tania.cursor() as cursor:
            cursor.execute(
                "SELECT id, hash, autor, texto FROM public.interacciones"
            )
            mensajes_tania = {
                int(id_mensaje): (str(hash_mensaje).lower(), autor, texto)
                for id_mensaje, hash_mensaje, autor, texto
                in cursor.fetchall()
            }

        with enoc.cursor() as cursor:
            cursor.execute("""
                SELECT
                    id_mensaje,
                    autor,
                    texto_original,
                    relevancia,
                    sentimiento,
                    temas_clave,
                    segmento,
                    decision_ia,
                    estado_revision
                FROM public.lotes_ia_kpis
            """)
            analisis = cursor.fetchall()

        vinculados = []
        excluidos = 0

        for registro in analisis:
            (
                id_mensaje, autor, texto, relevancia,
                sentimiento, temas, segmento, decision,
                estado_revision,
            ) = registro

            mensaje_tania = mensajes_tania.get(int(id_mensaje))

            if mensaje_tania is None:
                excluidos += 1
                continue

            hash_mensaje, autor_tania, texto_tania = mensaje_tania

            if autor != autor_tania or texto != texto_tania:
                excluidos += 1
                continue

            id_local = locales.get(hash_mensaje)

            if id_local is None:
                excluidos += 1
                continue

            vinculados.append({
                "id_local": id_local,
                "id_tania": int(id_mensaje),
                "relevancia": relevancia,
                "sentimiento": sentimiento,
                "temas_clave": temas,
                "segmento": segmento,
                "decision_ia": decision,
                "estado_revision": estado_revision,
            })

        return {
            "total_enoc": len(analisis),
            "total_vinculados": len(vinculados),
            "total_excluidos": excluidos,
            "items": vinculados,
        }

    finally:
        for conexion in conexiones:
            conexion.close()
