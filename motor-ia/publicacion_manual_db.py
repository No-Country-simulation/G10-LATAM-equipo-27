import sqlite3
from datetime import datetime, timezone
from urllib.parse import urlparse

from base_datos import RUTA_BD


def registrar_publicacion_manual(
    contenido_id: int,
    url_publicacion: str,
    responsable: str,
) -> dict:
    if contenido_id <= 0:
        raise ValueError("Identificador de contenido invalido.")

    url_publicacion = url_publicacion.strip()
    responsable = responsable.strip()

    if not responsable:
        raise ValueError("Debe identificar al responsable.")

    parsed = urlparse(url_publicacion)

    if parsed.scheme != "https" or not parsed.hostname:
        raise ValueError("La evidencia debe ser una URL HTTPS valida.")

    host = parsed.hostname.lower().rstrip(".")

    conexion = sqlite3.connect(RUTA_BD, timeout=10)
    conexion.row_factory = sqlite3.Row

    try:
        conexion.execute("BEGIN IMMEDIATE")

        fila = conexion.execute(
            """
            SELECT id, plataforma, estado, estado_publicacion
            FROM contenidos_generados
            WHERE id = ?
            """,
            (contenido_id,),
        ).fetchone()

        if fila is None:
            raise LookupError("El contenido no existe.")

        plataforma = fila["plataforma"]

        if plataforma not in {"linkedin", "x"}:
            raise ValueError(
                "Solo LinkedIn y X permiten confirmacion manual."
            )

        dominios = (
            {"linkedin.com", "www.linkedin.com"}
            if plataforma == "linkedin"
            else {"x.com", "www.x.com", "twitter.com", "www.twitter.com"}
        )

        if host not in dominios:
            raise ValueError(
                "La URL no corresponde a la plataforma del contenido."
            )

        if fila["estado"] != "aprobado":
            raise ValueError("El contenido debe estar aprobado.")

        if fila["estado_publicacion"] != "no_publicado":
            raise ValueError("El contenido ya tiene un estado de publicacion.")

        ahora = datetime.now(timezone.utc).isoformat()

        conexion.execute(
            """
            CREATE TABLE IF NOT EXISTS publicaciones_manuales (
                contenido_id INTEGER PRIMARY KEY,
                plataforma TEXT NOT NULL,
                url_publicacion TEXT NOT NULL,
                responsable TEXT NOT NULL,
                confirmado_en TEXT NOT NULL,
                FOREIGN KEY (contenido_id)
                    REFERENCES contenidos_generados(id)
            )
            """
        )

        cursor = conexion.execute(
            """
            UPDATE contenidos_generados
            SET estado_publicacion = 'publicado',
                publicado_en = ?,
                actualizado_en = ?
            WHERE id = ?
              AND estado = 'aprobado'
              AND estado_publicacion = 'no_publicado'
            """,
            (ahora, ahora, contenido_id),
        )

        if cursor.rowcount != 1:
            raise ValueError("No fue posible confirmar la publicacion.")

        conexion.execute(
            """
            INSERT INTO publicaciones_manuales (
                contenido_id,
                plataforma,
                url_publicacion,
                responsable,
                confirmado_en
            ) VALUES (?, ?, ?, ?, ?)
            """,
            (
                contenido_id,
                plataforma,
                url_publicacion,
                responsable,
                ahora,
            ),
        )

        conexion.commit()

        return {
            "id": contenido_id,
            "plataforma": plataforma,
            "estado_publicacion": "publicado",
            "publicado_en": ahora,
            "url_publicacion": url_publicacion,
            "responsable": responsable,
        }

    except Exception:
        conexion.rollback()
        raise
    finally:
        conexion.close()
