"""Adaptador de identidad SQLite-Supabase. Solo lectura."""

import os
import re
from dataclasses import dataclass

_HASH_SHA256 = re.compile(r"^[0-9a-fA-F]{64}$")


@dataclass(frozen=True)
class ResultadoCorrespondencia:
    encontrado: bool
    id_supabase: int | None
    motivo: str


def validar_hash(hash_mensaje: str) -> str:
    if not isinstance(hash_mensaje, str):
        raise ValueError("El hash debe ser texto.")
    if not _HASH_SHA256.fullmatch(hash_mensaje):
        raise ValueError("Hash SHA256 invalido.")
    return hash_mensaje.lower()


def buscar_id_supabase(
    hash_mensaje: str,
    *,
    permitir_conexion: bool = False,
) -> ResultadoCorrespondencia:
    hash_validado = validar_hash(hash_mensaje)

    if not permitir_conexion:
        return ResultadoCorrespondencia(
            False, None, "conexion_deshabilitada"
        )

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        return ResultadoCorrespondencia(
            False, None, "database_url_no_configurada"
        )

    try:
        import psycopg2
    except ImportError as exc:
        raise RuntimeError("Se requiere psycopg2.") from exc

    conexion = psycopg2.connect(database_url, sslmode='require', connect_timeout=5)
    try:
        conexion.set_session(readonly=True, autocommit=True)
        with conexion.cursor() as cursor:
            cursor.execute(
                "SELECT id FROM interacciones WHERE hash = %s LIMIT 2",
                (hash_validado,),
            )
            filas = cursor.fetchall()

        if not filas:
            return ResultadoCorrespondencia(
                False, None, "sin_correspondencia"
            )
        if len(filas) != 1:
            return ResultadoCorrespondencia(
                False, None, "correspondencia_ambigua"
            )
        return ResultadoCorrespondencia(
            True, int(filas[0][0]), "correspondencia_encontrada"
        )
    finally:
        conexion.close()
