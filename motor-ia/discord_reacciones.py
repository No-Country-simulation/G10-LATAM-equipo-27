"""Persistencia de conteos de reacciones de Discord para CloudEdTech."""

import sqlite3

from base_datos import RUTA_BD


def crear_tabla_reacciones():
    """Crea la tabla sin modificar las interacciones existentes."""
    with sqlite3.connect(RUTA_BD, timeout=30) as conexion:
        conexion.execute("""
            CREATE TABLE IF NOT EXISTS discord_reacciones (
                guild_id TEXT NOT NULL,
                channel_id TEXT NOT NULL,
                message_id TEXT NOT NULL,
                emoji TEXT NOT NULL,
                cantidad INTEGER NOT NULL DEFAULT 0,
                actualizado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (channel_id, message_id, emoji),
                CHECK (cantidad >= 0)
            )
        """)


def guardar_conteo_reaccion(
    guild_id,
    channel_id,
    message_id,
    emoji,
    cantidad,
):
    """Actualiza el conteo absoluto observado en Discord."""
    cantidad = max(0, int(cantidad))

    with sqlite3.connect(RUTA_BD, timeout=30) as conexion:
        conexion.execute("""
            INSERT INTO discord_reacciones (
                guild_id, channel_id, message_id, emoji, cantidad
            )
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(channel_id, message_id, emoji)
            DO UPDATE SET
                guild_id = excluded.guild_id,
                cantidad = excluded.cantidad,
                actualizado_en = CURRENT_TIMESTAMP
        """, (
            str(guild_id),
            str(channel_id),
            str(message_id),
            str(emoji),
            cantidad,
        ))


def obtener_reacciones(channel_id, message_id):
    """Devuelve los emojis y sus conteos para un mensaje."""
    with sqlite3.connect(RUTA_BD, timeout=30) as conexion:
        filas = conexion.execute("""
            SELECT emoji, cantidad
            FROM discord_reacciones
            WHERE channel_id = ?
              AND message_id = ?
              AND cantidad > 0
            ORDER BY cantidad DESC, emoji
        """, (str(channel_id), str(message_id))).fetchall()

    return [
        {"emoji": emoji, "cantidad": cantidad}
        for emoji, cantidad in filas
    ]

def reemplazar_reacciones_mensaje(
    guild_id, channel_id, message_id, reacciones
):
    """Sustituye los conteos anteriores por el estado real de Discord."""
    with sqlite3.connect(RUTA_BD, timeout=30) as conexion:
        conexion.execute(
            """
            DELETE FROM discord_reacciones
            WHERE channel_id = ? AND message_id = ?
            """,
            (str(channel_id), str(message_id)),
        )

        for reaccion in reacciones:
            cantidad = max(0, int(reaccion["cantidad"]))
            if cantidad == 0:
                continue

            conexion.execute(
                """
                INSERT INTO discord_reacciones
                (guild_id, channel_id, message_id, emoji, cantidad)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    str(guild_id),
                    str(channel_id),
                    str(message_id),
                    str(reaccion["emoji"]),
                    cantidad,
                ),
            )
