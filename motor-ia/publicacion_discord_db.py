import sqlite3
from datetime import datetime, timezone

from base_datos import RUTA_BD


def ahora_utc():
    return datetime.now(timezone.utc).isoformat()


def reservar_publicacion(contenido_id: int, canal_id: str) -> dict:
    """
    Reserva una publicacion de manera atomica.
    Solo permite contenidos aprobados y no publicados.
    """
    conexion = sqlite3.connect(RUTA_BD, timeout=10)
    conexion.row_factory = sqlite3.Row

    try:
        conexion.execute("BEGIN IMMEDIATE")

        fila = conexion.execute(
            """
            SELECT id, titulo, contenido, llamada_accion,
                   hashtags, estado, estado_publicacion
            FROM contenidos_generados
            WHERE id = ?
            """,
            (contenido_id,),
        ).fetchone()

        if fila is None:
            raise LookupError("El contenido no existe.")

        if fila["estado"] != "aprobado":
            raise ValueError("El contenido debe estar aprobado.")

        if fila["estado_publicacion"] != "no_publicado":
            raise ValueError(
                "El contenido ya tiene un intento de publicacion."
            )

        cursor = conexion.execute(
            """
            UPDATE contenidos_generados
            SET estado_publicacion = 'enviando',
                discord_channel_id = ?,
                intento_publicacion_en = ?,
                error_publicacion = NULL
            WHERE id = ?
              AND estado = 'aprobado'
              AND estado_publicacion = 'no_publicado'
            """,
            (canal_id, ahora_utc(), contenido_id),
        )

        if cursor.rowcount != 1:
            raise ValueError("No se pudo reservar la publicacion.")

        conexion.commit()
        return dict(fila)

    except Exception:
        conexion.rollback()
        raise
    finally:
        conexion.close()


def confirmar_publicacion(
    contenido_id: int,
    canal_id: str,
    mensaje_id: str,
) -> None:
    conexion = sqlite3.connect(RUTA_BD, timeout=10)

    try:
        conexion.execute("BEGIN IMMEDIATE")

        cursor = conexion.execute(
            """
            UPDATE contenidos_generados
            SET estado_publicacion = 'publicado',
                discord_message_id = ?,
                publicado_en = ?,
                error_publicacion = NULL
            WHERE id = ?
              AND estado_publicacion IN (
                  'enviando',
                  'resultado_desconocido'
              )
              AND discord_channel_id = ?
              AND (
                   discord_message_id IS NULL
                   OR discord_message_id = ?
               )
            """,
            (mensaje_id, ahora_utc(), contenido_id, canal_id, mensaje_id),
        )

        if cursor.rowcount != 1:
            raise ValueError(
                "No se pudo confirmar la publicacion."
            )

        conexion.commit()

    except Exception:
        conexion.rollback()
        raise
    finally:
        conexion.close()


def marcar_resultado_desconocido(
    contenido_id: int,
    detalle: str,
) -> None:
    conexion = sqlite3.connect(RUTA_BD, timeout=10)

    try:
        conexion.execute(
            """
            UPDATE contenidos_generados
            SET estado_publicacion = 'resultado_desconocido',
                error_publicacion = ?
            WHERE id = ?
              AND estado_publicacion = 'enviando'
            """,
            (detalle[:500], contenido_id),
        )
        conexion.commit()
    finally:
        conexion.close()


def liberar_reserva_sin_envio(
    contenido_id: int,
    canal_id: str,
) -> bool:
    """
    Libera una reserva solamente cuando el llamador
    garantiza que NO se invoco el envio a Discord.

    Nunca debe utilizarse despues de llamar a channel.send().
    """
    conexion = sqlite3.connect(RUTA_BD, timeout=10)

    try:
        conexion.execute("BEGIN IMMEDIATE")

        cursor = conexion.execute(
            """
            UPDATE contenidos_generados
            SET estado_publicacion = 'no_publicado',
                discord_channel_id = NULL,
                intento_publicacion_en = NULL,
                error_publicacion = NULL
            WHERE id = ?
              AND discord_channel_id = ?
              AND estado_publicacion = 'enviando'
              AND discord_message_id IS NULL
            """,
            (contenido_id, str(canal_id)),
        )

        conexion.commit()

        return cursor.rowcount == 1

    except Exception:
        conexion.rollback()
        raise

    finally:
        conexion.close()


def registrar_mensaje_pendiente(
    contenido_id: int,
    canal_id: str,
    mensaje_id: str,
    detalle: str,
) -> bool:
    """
    Conserva el ID confirmado por Discord cuando falla
    la confirmacion definitiva en SQLite.

    No marca la publicacion como publicada.
    Requiere conciliacion antes de habilitar reintentos.
    """
    conexion = sqlite3.connect(RUTA_BD, timeout=10)

    try:
        conexion.execute("BEGIN IMMEDIATE")

        cursor = conexion.execute(
            """
            UPDATE contenidos_generados
            SET estado_publicacion = 'resultado_desconocido',
                discord_message_id = ?,
                error_publicacion = ?
            WHERE id = ?
              AND discord_channel_id = ?
              AND estado_publicacion IN (
                  'enviando',
                  'resultado_desconocido'
              )
              AND (
                  discord_message_id IS NULL
                  OR discord_message_id = ?
              )
            """,
            (
                str(mensaje_id),
                str(detalle)[:500],
                contenido_id,
                str(canal_id),
                str(mensaje_id),
            ),
        )

        conexion.commit()
        return cursor.rowcount == 1

    except Exception:
        conexion.rollback()
        raise

    finally:
        conexion.close()


def listar_publicaciones_pendientes_conciliacion() -> list[dict]:
    """
    Consulta publicaciones que requieren revision.

    No modifica estados ni habilita reintentos.
    """
    conexion = sqlite3.connect(RUTA_BD, timeout=10)
    conexion.row_factory = sqlite3.Row

    try:
        filas = conexion.execute(
            """
            SELECT
                id,
                titulo,
                estado,
                estado_publicacion,
                discord_channel_id,
                discord_message_id,
                intento_publicacion_en,
                publicado_en,
                error_publicacion
            FROM contenidos_generados
            WHERE estado_publicacion IN (
                'enviando',
                'resultado_desconocido'
            )
            ORDER BY intento_publicacion_en ASC, id ASC
            """
        ).fetchall()

        return [dict(fila) for fila in filas]

    finally:
        conexion.close()
