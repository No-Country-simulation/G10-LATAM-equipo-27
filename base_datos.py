import os
import sqlite3
from datetime import datetime, timezone

from periodos import a_utc_iso

# la base se crea junto a este archivo (lo agreguÃ© al .gitignore como *.db). AsÃ­ queda en el
# mismo lugar en la PC y en Colab, donde el cÃ³digo vive en Drive y por eso la base tambiÃ©n
# sobrevive si Colab se desconecta. Antes era un nombre suelto que dependÃ­a de desde quÃ©
# carpeta se corriera el programa
RUTA_BD = os.path.join(os.path.dirname(os.path.abspath(__file__)), "communitylab.db")


def crear_tabla() -> None:
    conexion = sqlite3.connect(RUTA_BD)
    try:
        # el campo hash es UNIQUE: si intento guardar un mensaje repetido, SQLite lo ignora.
        # "estado" es el que van a usar despuÃ©s las demÃ¡s etapas (pendiente, analizado, etc.)
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
                enviado_en TEXT,
                estado TEXT NOT NULL DEFAULT 'pendiente',
                creado_en TEXT NOT NULL
            )
            """
        )
        # MigraciÃ³n compatible con bases existentes.
        # CREATE TABLE IF NOT EXISTS no agrega columnas nuevas a una tabla
        # que ya existe, por lo que aÃ±adimos Ãºnicamente las que falten.
        columnas_existentes = {
            fila[1]
            for fila in conexion.execute(
                "PRAGMA table_info(interacciones)"
            ).fetchall()
        }

        nuevas_columnas = {
            # Fecha real de envÃ­o del mensaje en Discord
            "enviado_en": "TEXT",

            # Metadatos originales de Discord
            "guild_id": "TEXT",
            "guild_name": "TEXT",
            "channel_id": "TEXT",
            "message_id": "TEXT",
            "author_id": "TEXT",

            # Resultado persistente del motor de IA
            "relevancia": "INTEGER",
            "sentimiento": "TEXT",
            "sentiment_score": "REAL",
            "temas_clave": "TEXT",
            "tema": "TEXT",
            "segmento": "TEXT",
            "razonamiento": "TEXT",
        }

        for nombre, tipo_sql in nuevas_columnas.items():
            if nombre not in columnas_existentes:
                conexion.execute(
                    f"ALTER TABLE interacciones ADD COLUMN {nombre} {tipo_sql}"
                )
        conexion.execute(
            """
            CREATE TABLE IF NOT EXISTS contenidos_generados (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                interaccion_id INTEGER NOT NULL,
                formato TEXT NOT NULL,
                titulo TEXT NOT NULL,
                contenido TEXT NOT NULL,
                llamada_accion TEXT,
                hashtags TEXT,
                tono TEXT NOT NULL DEFAULT 'profesional',
                estado TEXT NOT NULL DEFAULT 'pendiente_revision',
                creado_en TEXT NOT NULL,
                actualizado_en TEXT NOT NULL,
                FOREIGN KEY (interaccion_id)
                    REFERENCES interacciones(id)
            )
            """
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
    enviado_en=None,
    guild_id=None,
    guild_name=None,
    channel_id=None,
    message_id=None,
    author_id=None,
) -> bool:
    """Guarda un mensaje. Regresa True si era nuevo y False si ya existÃ­a."""
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
                enviado_en,
                creado_en,
                guild_id,
                guild_name,
                channel_id,
                message_id,
                author_id
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
                enviado_en,
                a_utc_iso(datetime.now(timezone.utc)),
                guild_id,
                guild_name,
                channel_id,
                message_id,
                author_id,
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
    tema,
    segmento,
    razonamiento,
) -> bool:
    """Guarda el resultado del anÃ¡lisis de IA en una interacciÃ³n existente."""
    conexion = sqlite3.connect(RUTA_BD)

    try:
        cursor = conexion.execute(
            """
            UPDATE interacciones
            SET relevancia = ?,
                sentimiento = ?,
                sentiment_score = ?,
                temas_clave = ?,
                tema = ?,
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
                tema,
                segmento,
                razonamiento,
                id_mensaje,
            ),
        )

        conexion.commit()
        return cursor.rowcount > 0

    finally:
        conexion.close()


def _corte_utc(corte) -> str:
    """
    Convierte un corte de fecha (texto ISO o datetime) al formato exacto en que se guarda
    enviado_en. Es necesario porque el filtro compara las fechas como texto: si el corte
    llegara en otro formato (por ejemplo con otra zona horaria), compararÃ­a mal y sin avisar.
    Una fecha sin zona horaria se toma como UTC. Si el texto no es una fecha, lanza ValueError.
    """
    if isinstance(corte, str):
        corte = datetime.fromisoformat(corte)
    return a_utc_iso(corte)


def listar_interacciones(canal=None, estado=None, limite=100, desde_utc=None, hasta_utc=None) -> list:
    """
    Regresa las interacciones guardadas como lista de diccionarios (las mÃ¡s recientes primero).

    desde_utc y hasta_utc filtran por enviado_en, la fecha real de envÃ­o en Discord:
    desde_utc SÃ incluye ese instante y hasta_utc NO lo incluye, asÃ­ dos periodos seguidos
    no repiten ni se saltan mensajes. Con limite=None no hay tope de mensajes. Los mensajes
    sin fecha (paquetes armados a mano) no aparecen cuando se filtra por fechas.
    """
    conexion = sqlite3.connect(RUTA_BD)
    # row_factory hace que cada fila se pueda convertir a diccionario con sus nombres de columna
    conexion.row_factory = sqlite3.Row
    try:
        # no incluyo el hash porque es un dato interno que a mis compaÃ±eros no les sirve
        consulta = (
            "SELECT "
            "id, origen_comunidad, periodo_referencia, "
            "autor, canal, tipo, texto, enviado_en, estado, creado_en, "
            "guild_id, guild_name, channel_id, message_id, author_id, "
            "relevancia, sentimiento, sentiment_score, temas_clave, tema, segmento, razonamiento "
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
        if desde_utc:
            condiciones.append("enviado_en >= ?")
            parametros.append(_corte_utc(desde_utc))
        if hasta_utc:
            condiciones.append("enviado_en < ?")
            parametros.append(_corte_utc(hasta_utc))
        if condiciones:
            consulta += " WHERE " + " AND ".join(condiciones)
        consulta += " ORDER BY id DESC"
        if limite is not None:
            consulta += " LIMIT ?"
            parametros.append(limite)

        filas = conexion.execute(consulta, parametros).fetchall()
        return [dict(fila) for fila in filas]
    finally:
        conexion.close()

def obtener_interaccion(interaccion_id: int) -> dict | None:
    """
    Regresa una interacción específica por su ID.
    Devuelve None si no existe.
    """
    conexion = sqlite3.connect(RUTA_BD)
    conexion.row_factory = sqlite3.Row

    try:
        fila = conexion.execute(
            """
            SELECT
                id, origen_comunidad, periodo_referencia,
                autor, canal, tipo, texto, enviado_en, estado, creado_en,
                guild_id, guild_name, channel_id, message_id, author_id,
                relevancia, sentimiento, sentiment_score, temas_clave,
                tema, segmento, razonamiento
            FROM interacciones
            WHERE id = ?
            """,
            (interaccion_id,),
        ).fetchone()

        return dict(fila) if fila else None

    finally:
        conexion.close()

def guardar_contenido(
    interaccion_id: int,
    formato: str,
    titulo: str,
    contenido: str,
    llamada_accion: str | None,
    hashtags: list[str],
    tono: str = "profesional",
) -> int:
    """
    Guarda un borrador generado por IA y devuelve su ID.
    """
    conexion = sqlite3.connect(RUTA_BD)

    try:
        ahora = a_utc_iso(datetime.now(timezone.utc))

        cursor = conexion.execute(
            """
            INSERT INTO contenidos_generados (
                interaccion_id,
                formato,
                titulo,
                contenido,
                llamada_accion,
                hashtags,
                tono,
                estado,
                creado_en,
                actualizado_en
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente_revision', ?, ?)
            """,
            (
                interaccion_id,
                formato,
                titulo,
                contenido,
                llamada_accion,
                " ".join(hashtags),
                tono,
                ahora,
                ahora,
            ),
        )

        conexion.commit()
        return cursor.lastrowid

    finally:
        conexion.close()

def listar_contenidos(estado=None, limite=100) -> list:
    """
    Lista los contenidos generados, mostrando primero los más recientes.
    """
    conexion = sqlite3.connect(RUTA_BD)
    conexion.row_factory = sqlite3.Row

    try:
        consulta = """
            SELECT
                id,
                interaccion_id,
                formato,
                titulo,
                contenido,
                llamada_accion,
                hashtags,
                tono,
                estado,
                creado_en,
                actualizado_en
            FROM contenidos_generados
        """

        parametros = []

        if estado:
            consulta += " WHERE estado = ?"
            parametros.append(estado)

        consulta += " ORDER BY id DESC LIMIT ?"
        parametros.append(limite)

        filas = conexion.execute(consulta, parametros).fetchall()

        resultados = []

        for fila in filas:
            item = dict(fila)

            item["hashtags"] = (
                item["hashtags"].split()
                if item["hashtags"]
                else []
            )

            resultados.append(item)

        return resultados

    finally:
        conexion.close()

def actualizar_estado_contenido(
    contenido_id: int,
    nuevo_estado: str,
) -> bool:
    """
    Actualiza el estado de un contenido generado.
    Devuelve True si el contenido existe y fue actualizado.
    """
    estados_validos = {
        "pendiente_revision",
        "aprobado",
        "rechazado",
    }

    if nuevo_estado not in estados_validos:
        raise ValueError("Estado de contenido no válido.")

    conexion = sqlite3.connect(RUTA_BD)

    try:
        ahora = a_utc_iso(datetime.now(timezone.utc))

        cursor = conexion.execute(
            """
            UPDATE contenidos_generados
            SET estado = ?, actualizado_en = ?
            WHERE id = ?
            """,
            (
                nuevo_estado,
                ahora,
                contenido_id,
            ),
        )

        conexion.commit()

        return cursor.rowcount > 0

    finally:
        conexion.close()
    
def actualizar_contenido(
    contenido_id: int,
    titulo: str,
    contenido: str,
    llamada_accion: str,
    hashtags: list[str],
) -> bool:
    """
    Permite editar manualmente un borrador generado por IA.
    """
    conexion = sqlite3.connect(RUTA_BD)

    try:
        ahora = a_utc_iso(datetime.now(timezone.utc))

        cursor = conexion.execute(
            """
            UPDATE contenidos_generados
            SET
                titulo = ?,
                contenido = ?,
                llamada_accion = ?,
                hashtags = ?,
                actualizado_en = ?
            WHERE id = ?
                AND estado = 'pendiente_revision'
            """,
            (
                titulo,
                contenido,
                llamada_accion,
                " ".join(hashtags),
                ahora,
                contenido_id,
            ),
        )

        conexion.commit()

        return cursor.rowcount > 0

    finally:
        conexion.close()