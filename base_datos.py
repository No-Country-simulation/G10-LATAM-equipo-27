import sqlite3
from datetime import datetime

# a diferencia de la PC, aquí apunta a Drive: así la base sobrevive si Colab se
# desconecta o se reinicia. Vive en la misma carpeta que el código (Opción B),
# separada de la base que usa la Opción A en /content/drive/MyDrive/CommunityLab/
import os
RUTA_BD = os.path.join(os.path.dirname(os.path.abspath(__file__)), "communitylab.db")


def crear_tabla() -> None:
    conexion = sqlite3.connect(RUTA_BD)
    try:
        # el campo hash es UNIQUE: si intento guardar un mensaje repetido, SQLite lo ignora.
        # "estado" es el que van a usar después las demás etapas (pendiente, analizado, etc.)
        conexion.execute(
            """
            CREATE TABLE IF NOT EXISTS interacciones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hash TEXT UNIQUE NOT NULL,
                origen_comunidad TEXT NOT NULL,
                periodo_referencia TEXT NOT NULL,
                autor TEXT NOT NULL,
                canal TEXT NOT NULL,
                tipo TEXT,
                texto TEXT NOT NULL,
                estado TEXT NOT NULL DEFAULT 'pendiente',
                creado_en TEXT NOT NULL
            )
            """
        )
                # Migración compatible con bases existentes.
        # SQLite no agrega columnas nuevas mediante CREATE TABLE IF NOT EXISTS,
        # por eso comprobamos cuáles faltan y las añadimos individualmente.
        columnas_existentes = {
            fila[1]
            for fila in conexion.execute(
                "PRAGMA table_info(interacciones)"
            ).fetchall()
        }

        nuevas_columnas = {
    # Metadatos originales de Discord
    "guild_id": "TEXT",
    "guild_name": "TEXT",
    "channel_id": "TEXT",
    "message_id": "TEXT",
    "author_id": "TEXT",
    "created_at": "TEXT",

    # Resultado del motor de IA
    # AI results
"relevancia": "INTEGER",
"sentimiento": "TEXT",
"sentiment_score": "REAL",
"temas_clave": "TEXT",
"segmento": "TEXT",
"razonamiento": "TEXT",
}

        for nombre, tipo_sql in nuevas_columnas.items():
            if nombre not in columnas_existentes:
                conexion.execute(
                    f"ALTER TABLE interacciones ADD COLUMN {nombre} {tipo_sql}"
                )


        conexion.commit()
    finally:
        conexion.close()


def guardar_interaccion(
    origen,
    periodo,
    autor,
    canal,
    tipo,
    texto,
    hash_mensaje,
    guild_id=None,
    guild_name=None,
    channel_id=None,
    message_id=None,
    author_id=None,
    created_at=None,
) -> bool:
    """Guarda un mensaje. Regresa True si era nuevo y False si ya existía."""
    conexion = sqlite3.connect(RUTA_BD)

    try:
        existe = conexion.execute(
            "SELECT 1 FROM interacciones WHERE hash = ?",
            (hash_mensaje,),
        ).fetchone()

        if existe:
            return False

        conexion.execute(
            """
            INSERT INTO interacciones (
                hash,
                origen_comunidad,
                periodo_referencia,
                autor,
                canal,
                tipo,
                texto,
                creado_en,
                guild_id,
                guild_name,
                channel_id,
                message_id,
                author_id,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                hash_mensaje,
                origen,
                periodo,
                autor,
                canal,
                tipo,
                texto,
                datetime.now().isoformat(timespec="seconds"),
                guild_id,
                guild_name,
                channel_id,
                message_id,
                author_id,
                created_at.isoformat() if created_at else None,
            ),
        )

        conexion.commit()
        return True

    finally:
        conexion.close()

def guardar_analisis(
    id_mensaje,
    relevancia,
    sentimiento,
    sentiment_score,
    temas_clave,
    segmento,
    razonamiento,
) -> bool:
    """Guarda el resultado del análisis de IA en una interacción existente."""
    conexion = sqlite3.connect(RUTA_BD)

    try:
        cursor = conexion.execute(
            """
            UPDATE interacciones
            SET relevancia = ?,
                sentimiento = ?,
                sentiment_score = ?,
                temas_clave = ?,
                segmento = ?,
                razonamiento = ?,
                estado = 'analizado'
            WHERE id = ?
            """,
            (
                relevancia,
                sentimiento,
                sentiment_score,
                temas_clave,
                segmento,
                razonamiento,
                id_mensaje,
            ),
        )

        conexion.commit()
        return cursor.rowcount > 0

    finally:
        conexion.close()


def listar_interacciones(canal=None, estado=None, limite=100) -> list:
    """Regresa las interacciones guardadas como lista de diccionarios (las más recientes primero)."""
    conexion = sqlite3.connect(RUTA_BD)
    # row_factory hace que cada fila se pueda convertir a diccionario con sus nombres de columna
    conexion.row_factory = sqlite3.Row
    try:
        # no incluyo el hash porque es un dato interno que a mis compañeros no les sirve
        consulta = (
    "SELECT "
    "id, origen_comunidad, periodo_referencia, "
    "autor, canal, tipo, texto, estado, creado_en, "
    "guild_id, guild_name, channel_id, message_id, author_id, created_at, "
    "relevancia, sentimiento, sentiment_score, temas_clave, segmento, razonamiento "
    "FROM interacciones"
)
        condiciones = []
        parametros = []
        if canal:
            condiciones.append("canal = ?")
            parametros.append(canal)
        if estado:
            condiciones.append("estado = ?")
            parametros.append(estado)
        if condiciones:
            consulta += " WHERE " + " AND ".join(condiciones)
        consulta += " ORDER BY id DESC LIMIT ?"
        parametros.append(limite)

        filas = conexion.execute(consulta, parametros).fetchall()
        return [dict(fila) for fila in filas]
    finally:
        conexion.close()
