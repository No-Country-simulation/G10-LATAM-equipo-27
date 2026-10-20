import os
import json
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
            "attachments": "TEXT",

            # Resultado persistente del motor de IA
            "relevancia": "INTEGER",
            "sentimiento": "TEXT",
            "sentiment_score": "REAL",
            "temas_clave": "TEXT",
            "tema": "TEXT",
            "segmento": "TEXT",
            "razonamiento": "TEXT",
            "estado_curaduria": "TEXT NOT NULL DEFAULT 'pending'",
            "descartado_en": "TEXT",
            "etapa_flujo": "TEXT NOT NULL DEFAULT 'ingesta'",
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
                interaccion_id INTEGER,
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


        columnas_contenido = {
            fila[1]
            for fila in conexion.execute(
                "PRAGMA table_info(contenidos_generados)"
            ).fetchall()
        }

        nuevas_columnas_contenido = {
            "imagen_generada_url": "TEXT",
            "imagen_generada_prompt": "TEXT",
            "plataforma": "TEXT",
            "tipo_contenido": "TEXT NOT NULL DEFAULT 'publicacion'",
            "observaciones_revision": "TEXT",
            "rechazado_en": "TEXT",
            "version": "INTEGER NOT NULL DEFAULT 1",
            "estado_publicacion": "TEXT NOT NULL DEFAULT 'no_publicado'",
            "publicado_en": "TEXT",
            "source_channel_id": "TEXT",
            "source_message_id": "TEXT",
            "discord_channel_id": "TEXT",
            "discord_message_id": "TEXT",
            "intento_publicacion_en": "TEXT",
            "error_publicacion": "TEXT",
        }

        for nombre, tipo_sql in nuevas_columnas_contenido.items():
            if nombre not in columnas_contenido:
                conexion.execute(
                    f"ALTER TABLE contenidos_generados ADD COLUMN {nombre} {tipo_sql}"
                )

        conexion.execute(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS
                idx_contenidos_discord_mensaje
            ON contenidos_generados(
                discord_channel_id,
                discord_message_id
            )
            WHERE discord_channel_id IS NOT NULL
              AND discord_message_id IS NOT NULL
            """
        )

        conexion.execute(
            """
            CREATE TABLE IF NOT EXISTS historial_revision_contenidos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                contenido_id INTEGER NOT NULL,
                estado_anterior TEXT NOT NULL,
                estado_nuevo TEXT NOT NULL,
                observaciones TEXT,
                fecha TEXT NOT NULL,
                FOREIGN KEY (contenido_id)
                    REFERENCES contenidos_generados(id)
            )
            """
        )

        conexion.execute(
            """
            CREATE INDEX IF NOT EXISTS
                idx_historial_revision_contenido
            ON historial_revision_contenidos(contenido_id, fecha)
            """
        )

        conexion.execute(
            """
            CREATE TABLE IF NOT EXISTS evaluaciones_marca (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                contenido_id INTEGER,
                plataforma TEXT NOT NULL
                    CHECK (plataforma IN ('linkedin', 'x', 'discord')),
                contenido_hash TEXT NOT NULL,
                puntuacion INTEGER NOT NULL
                    CHECK (puntuacion BETWEEN 0 AND 100),
                tono_y_voz INTEGER NOT NULL,
                estructura_y_claridad INTEGER NOT NULL,
                valores_de_marca INTEGER NOT NULL,
                seguridad_y_credibilidad INTEGER NOT NULL,
                fortalezas TEXT NOT NULL DEFAULT '[]',
                mejoras TEXT NOT NULL DEFAULT '[]',
                justificacion TEXT NOT NULL DEFAULT '',
                evaluado_en TEXT NOT NULL,
                FOREIGN KEY (contenido_id)
                    REFERENCES contenidos_generados(id)
            )
            """
        )

        conexion.execute(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS
                idx_evaluaciones_marca_contenido_version
            ON evaluaciones_marca(contenido_id, contenido_hash)
            WHERE contenido_id IS NOT NULL
            """
        )

        conexion.execute("""
            CREATE TABLE IF NOT EXISTS historial_curaduria (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                interaccion_id INTEGER NOT NULL,
                estado_anterior TEXT NOT NULL,
                estado_nuevo TEXT NOT NULL,
                fecha TEXT NOT NULL,
                FOREIGN KEY (interaccion_id) REFERENCES interacciones(id)
            )
        """)
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
    attachments=None,
) -> bool:
    """Guarda un mensaje. Regresa True si era nuevo y False si ya existÃ­a."""
    conexion = sqlite3.connect(RUTA_BD)

    try:
        # Comprobar el ID original de Discord antes del hash.
        # Esto tambien protege registros guardados con hashes antiguos.
        if channel_id and message_id:
            existe_discord = conexion.execute(
                """
                SELECT 1 FROM interacciones
                WHERE channel_id = ? AND message_id = ?
                LIMIT 1
                """,
                (str(channel_id), str(message_id)),
            ).fetchone()

            if existe_discord:
                return False

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
                author_id,
                attachments
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                json.dumps(attachments or [], ensure_ascii=False),
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
            "guild_id, guild_name, channel_id, message_id, author_id, attachments, "
            "relevancia, sentimiento, sentiment_score, temas_clave, tema, segmento, razonamiento, estado_curaduria, descartado_en, etapa_flujo "
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
    interaccion_id: int | None,
    formato: str,
    titulo: str,
    contenido: str,
    llamada_accion: str | None,
    hashtags: list[str],
    tono: str = "profesional",
    plataforma: str | None = None,
    tipo_contenido: str = "publicacion",
    imagen_generada_url: str | None = None,
    imagen_generada_prompt: str | None = None,
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
                plataforma,
                tipo_contenido,
                imagen_generada_url,
                imagen_generada_prompt,
                estado,
                creado_en,
                actualizado_en
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente_revision', ?, ?)
            """,
            (
                interaccion_id,
                formato,
                titulo,
                contenido,
                llamada_accion,
                " ".join(hashtags),
                tono,
                plataforma,
                tipo_contenido,
                imagen_generada_url,
                imagen_generada_prompt,
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
                actualizado_en,
                rechazado_en,
                plataforma,
                tipo_contenido,
                imagen_generada_url,
                imagen_generada_prompt,
                observaciones_revision,
                version,
                estado_publicacion,
                publicado_en,
                source_channel_id,
                source_message_id
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

            item["attachments"] = []

            if item.get("interaccion_id") is not None:
                fila_adjuntos = conexion.execute(
                    "SELECT attachments FROM interacciones WHERE id = ?",
                    (item["interaccion_id"],),
                ).fetchone()

                if fila_adjuntos and fila_adjuntos["attachments"]:
                    try:
                        adjuntos = json.loads(fila_adjuntos["attachments"])
                        if isinstance(adjuntos, list):
                            item["attachments"] = [
                                adjunto for adjunto in adjuntos
                                if isinstance(adjunto, dict)
                                and isinstance(adjunto.get("filename"), str)
                                and isinstance(adjunto.get("url"), str)
                                and adjunto["url"].startswith("https://")
                            ]
                    except (ValueError, TypeError):
                        pass

            resultados.append(item)

        return resultados

    finally:
        conexion.close()

def actualizar_estado_contenido(
    contenido_id: int,
    nuevo_estado: str,
    observaciones_revision: str | None = None,
) -> bool:
    """
    Cambia el estado solo si la transicion esta permitida.
    Guarda las observaciones del revisor.
    """
    transiciones = {
        "pendiente_revision": {
            "aprobado",
            "rechazado",
            "ajustes_solicitados",
        },
        "ajustes_solicitados": {
            "pendiente_revision",
        },
        "rechazado": {
            "pendiente_revision",
        },
    }

    estados_validos = {
        "pendiente_revision",
        "aprobado",
        "rechazado",
        "ajustes_solicitados",
    }

    if nuevo_estado not in estados_validos:
        raise ValueError("Estado de contenido no valido.")

    observaciones = (
        observaciones_revision.strip()
        if observaciones_revision is not None
        else None
    )

    if nuevo_estado == "ajustes_solicitados" and not observaciones:
        raise ValueError(
            "Debe indicar las observaciones para solicitar ajustes."
        )

    conexion = sqlite3.connect(RUTA_BD, timeout=10)

    try:
        conexion.execute("BEGIN IMMEDIATE")

        fila = conexion.execute(
            "SELECT estado, rechazado_en FROM contenidos_generados WHERE id = ?",
            (contenido_id,),
        ).fetchone()

        if fila is None:
            conexion.rollback()
            return False

        estado_actual = fila[0]

        if estado_actual == "rechazado" and nuevo_estado == "pendiente_revision":
            from datetime import timedelta

            fecha_rechazo = fila[1]
            if not fecha_rechazo:
                raise ValueError(
                    "No existe una fecha verificable para recuperar este rechazo."
                )

            try:
                momento = datetime.fromisoformat(
                    fecha_rechazo.replace("Z", "+00:00")
                )
                if momento.tzinfo is None:
                    momento = momento.replace(tzinfo=timezone.utc)
            except ValueError as exc:
                raise ValueError(
                    "La fecha de rechazo no es valida."
                ) from exc

            ahora_utc = datetime.now(timezone.utc)
            if ahora_utc < momento or ahora_utc > momento + timedelta(days=7):
                raise ValueError(
                    "El plazo de recuperacion de 7 dias no esta vigente."
                )

        if nuevo_estado not in transiciones.get(estado_actual, set()):
            conexion.rollback()
            raise ValueError(
                f"Transicion no permitida: "
                f"{estado_actual} -> {nuevo_estado}"
            )

        ahora = a_utc_iso(datetime.now(timezone.utc))
        rechazado_en = ahora if nuevo_estado == "rechazado" else None

        cursor = conexion.execute(
            """
            UPDATE contenidos_generados
            SET
                estado = ?,
                observaciones_revision = ?,
                rechazado_en = ?,
                actualizado_en = ?
            WHERE id = ? AND estado = ?
            """,
            (
                nuevo_estado,
                observaciones,
                rechazado_en,
                ahora,
                contenido_id,
                estado_actual,
            ),
        )

        if cursor.rowcount != 1:
            conexion.rollback()
            raise RuntimeError(
                "No fue posible confirmar la actualizacion."
            )

        conexion.execute(
            """
            INSERT INTO historial_revision_contenidos (
                contenido_id,
                estado_anterior,
                estado_nuevo,
                observaciones,
                fecha
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                contenido_id,
                estado_actual,
                nuevo_estado,
                observaciones,
                ahora,
            ),
        )

        conexion.commit()
        return True

    except Exception:
        conexion.rollback()
        raise

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

def actualizar_imagen_contenido(
    contenido_id: int,
    imagen_generada_url: str | None,
) -> bool:
    """Asocia o retira la imagen de un borrador pendiente."""
    import re

    if contenido_id <= 0:
        raise ValueError("Identificador de contenido no valido")

    if imagen_generada_url is not None:
        patron = (
            r"/api/v1/content-workflow/corporate-images/"
            r"[a-f0-9]{32}"
        )
        if re.fullmatch(patron, imagen_generada_url) is None:
            raise ValueError("Referencia de imagen corporativa no valida")

    conexion = sqlite3.connect(RUTA_BD, timeout=10)

    try:
        ahora = a_utc_iso(datetime.now(timezone.utc))

        cursor = conexion.execute(
            """
            UPDATE contenidos_generados
            SET imagen_generada_url = ?,
                actualizado_en = ?
            WHERE id = ?
              AND estado = 'pendiente_revision'
            """,
            (imagen_generada_url, ahora, contenido_id),
        )

        conexion.commit()
        return cursor.rowcount > 0

    finally:
        conexion.close()


def contar_contenidos(estado: str | None = None) -> int:
    """Cuenta los contenidos generados, opcionalmente por estado."""
    conexion = sqlite3.connect(RUTA_BD)

    try:
        if estado is None:
            consulta = "SELECT COUNT(*) FROM contenidos_generados"
            parametros = ()
        else:
            consulta = """
                SELECT COUNT(*)
                FROM contenidos_generados
                WHERE estado = ?
            """
            parametros = (estado,)

        return conexion.execute(consulta, parametros).fetchone()[0]
    finally:
        conexion.close()



def actualizar_curaduria(interaccion_id: int, estado_curaduria: str) -> bool:
    """Curaduria con recuperacion solo durante 7 dias y registro historico."""
    from datetime import timedelta
    if estado_curaduria not in {"pending", "curated", "discarded"}:
        raise ValueError("Estado de curaduria no valido")
    ahora = datetime.now(timezone.utc)
    with sqlite3.connect(RUTA_BD, timeout=10) as conexion:
        conexion.row_factory = sqlite3.Row
        fila = conexion.execute(
            "SELECT estado_curaduria, descartado_en, etapa_flujo FROM interacciones WHERE id = ?",
            (interaccion_id,),
        ).fetchone()
        if fila is None:
            return False
        anterior = fila["estado_curaduria"] or "pending"
        if anterior == estado_curaduria:
            return True
        if anterior == "discarded":
            if estado_curaduria != "pending":
                raise ValueError("Solo se permite recuperar a pendiente")
            fecha = fila["descartado_en"]
            if not fecha:
                raise ValueError("No hay fecha verificable de descarte")
            try:
                momento = datetime.fromisoformat(fecha.replace("Z", "+00:00"))
                if momento.tzinfo is None:
                    momento = momento.replace(tzinfo=timezone.utc)
            except ValueError as exc:
                raise ValueError("Fecha de descarte invalida") from exc
            if ahora > momento + timedelta(days=7):
                raise ValueError("El plazo de recuperacion de 7 dias vencio")
            if fila["etapa_flujo"] not in ("ingesta", "en_ingesta"):
                raise ValueError("Solo se recuperan mensajes de Ingesta")
        fecha_descartado = a_utc_iso(ahora) if estado_curaduria == "discarded" else None
        conexion.execute(
            "UPDATE interacciones SET estado_curaduria = ?, descartado_en = ? WHERE id = ?",
            (estado_curaduria, fecha_descartado, interaccion_id),
        )
        conexion.execute(
            "INSERT INTO historial_curaduria (interaccion_id, estado_anterior, estado_nuevo, fecha) VALUES (?, ?, ?, ?)",
            (interaccion_id, anterior, estado_curaduria, a_utc_iso(ahora)),
        )
        return True


def actualizar_etapa_flujo(interaccion_id: int, etapa_destino: str) -> bool:
    """Avanza una interaccion una etapa, sin retrocesos."""
    transiciones = {
        "ingesta": "en_analisis",
        "en_analisis": "en_redaccion",
        "en_redaccion": "en_aprobacion",
    }

    origen = next(
        (
            etapa
            for etapa, destino in transiciones.items()
            if destino == etapa_destino
        ),
        None,
    )

    if origen is None:
        raise ValueError("Etapa de destino no valida")

    conexion = sqlite3.connect(RUTA_BD, timeout=10)

    try:
        cursor = conexion.execute(
            """
            UPDATE interacciones
            SET etapa_flujo = ?
            WHERE id = ?
              AND etapa_flujo = ?
              AND COALESCE(estado_curaduria, 'pending') != 'discarded'
            """,
            (etapa_destino, interaccion_id, origen),
        )

        conexion.commit()
        return cursor.rowcount > 0

    finally:
        conexion.close()


def obtener_identidad_interaccion(interaccion_id: int) -> dict | None:
    """Consulta interna de identidad; no modifica SQLite."""
    if type(interaccion_id) is not int or interaccion_id <= 0:
        raise ValueError("El ID local debe ser un entero positivo.")

    conexion = sqlite3.connect(RUTA_BD)
    conexion.row_factory = sqlite3.Row
    try:
        fila = conexion.execute(
            """
            SELECT id, hash, origen_comunidad, canal,
                   channel_id, message_id
            FROM interacciones
            WHERE id = ?
            """,
            (interaccion_id,),
        ).fetchone()
        return dict(fila) if fila else None
    finally:
        conexion.close()


def guardar_evaluacion_marca(
    contenido: str,
    plataforma: str,
    evaluacion: dict,
    contenido_id: int | None = None,
) -> int:
    """Guarda una evaluacion real, vinculada al borrador si existe."""
    import hashlib
    import json

    if plataforma not in {"linkedin", "x", "discord"}:
        raise ValueError("Plataforma no permitida")

    texto = contenido.strip()
    if not texto:
        raise ValueError("Contenido vacio")

    huella = hashlib.sha256(
        texto.encode("utf-8")
    ).hexdigest()

    dimensiones = (
        "tono_y_voz",
        "estructura_y_claridad",
        "valores_de_marca",
        "seguridad_y_credibilidad",
    )

    valores = {
        nombre: int(evaluacion[nombre])
        for nombre in dimensiones
    }

    if any(
        valor < 0 or valor > 100
        for valor in valores.values()
    ):
        raise ValueError("Dimension fuera de rango")

    puntuacion = round(
        sum(valores.values()) / len(valores)
    )

    ahora = a_utc_iso(datetime.now(timezone.utc))

    with sqlite3.connect(RUTA_BD, timeout=10) as conexion:
        if contenido_id is not None:
            fila = conexion.execute(
                """
                SELECT contenido, COALESCE(plataforma, formato)
                FROM contenidos_generados
                WHERE id = ?
                """,
                (contenido_id,),
            ).fetchone()

            if fila is None:
                raise ValueError("Borrador inexistente")

            if (
                fila[0].strip() != texto
                or fila[1] != plataforma
            ):
                raise ValueError(
                    "La evaluacion no coincide con el borrador"
                )

        cursor = conexion.execute(
            """
            INSERT INTO evaluaciones_marca (
                contenido_id,
                plataforma,
                contenido_hash,
                puntuacion,
                tono_y_voz,
                estructura_y_claridad,
                valores_de_marca,
                seguridad_y_credibilidad,
                fortalezas,
                mejoras,
                justificacion,
                evaluado_en
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT DO UPDATE SET
                puntuacion=excluded.puntuacion,
                tono_y_voz=excluded.tono_y_voz,
                estructura_y_claridad=excluded.estructura_y_claridad,
                valores_de_marca=excluded.valores_de_marca,
                seguridad_y_credibilidad=excluded.seguridad_y_credibilidad,
                fortalezas=excluded.fortalezas,
                mejoras=excluded.mejoras,
                justificacion=excluded.justificacion,
                evaluado_en=excluded.evaluado_en
            """,
            (
                contenido_id,
                plataforma,
                huella,
                puntuacion,
                valores["tono_y_voz"],
                valores["estructura_y_claridad"],
                valores["valores_de_marca"],
                valores["seguridad_y_credibilidad"],
                json.dumps(
                    evaluacion.get("fortalezas", []),
                    ensure_ascii=False,
                ),
                json.dumps(
                    evaluacion.get("mejoras", []),
                    ensure_ascii=False,
                ),
                str(evaluacion.get("justificacion", "")),
                ahora,
            ),
        )

        if cursor.rowcount and cursor.lastrowid:
            return int(cursor.lastrowid)

        if contenido_id is not None:
            fila = conexion.execute(
                """
                SELECT id FROM evaluaciones_marca
                WHERE contenido_id = ?
                  AND contenido_hash = ?
                """,
                (contenido_id, huella),
            ).fetchone()

            if fila:
                return int(fila[0])

        raise ValueError("No se pudo registrar la evaluacion")


def obtener_estadisticas_alineacion_marca() -> dict:
    """Promedio de evaluaciones de versiones vigentes."""
    import hashlib

    with sqlite3.connect(RUTA_BD, timeout=10) as conexion:
        conexion.row_factory = sqlite3.Row

        filas = conexion.execute(
            """
            SELECT
                c.id AS contenido_id,
                c.contenido AS contenido_actual,
                e.contenido_hash,
                e.puntuacion
            FROM contenidos_generados c
            JOIN evaluaciones_marca e
              ON e.contenido_id = c.id
            JOIN interacciones i
              ON i.id = c.interaccion_id
            WHERE i.etapa_flujo = 'en_aprobacion'
              AND e.id = (
                SELECT MAX(e2.id)
                FROM evaluaciones_marca e2
                WHERE e2.contenido_id = c.id
            )
            """
        ).fetchall()

    puntuaciones = []

    for fila in filas:
        texto = (fila["contenido_actual"] or "").strip()

        huella_actual = hashlib.sha256(
            texto.encode("utf-8")
        ).hexdigest()

        if huella_actual == fila["contenido_hash"]:
            puntuaciones.append(int(fila["puntuacion"]))

    return {
        "total_evaluados": len(puntuaciones),
        "promedio": (
            round(
                sum(puntuaciones) / len(puntuaciones),
                1,
            )
            if puntuaciones
            else None
        ),
    }
