import sqlite3
from base_datos import RUTA_BD


def migrar():
    conexion = sqlite3.connect(RUTA_BD)

    try:
        conexion.execute("PRAGMA foreign_keys = ON")
        conexion.execute("BEGIN IMMEDIATE")

        conexion.execute("""
            CREATE TABLE contenidos_generados_nueva (
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
        """)

        conexion.execute("""
            INSERT INTO contenidos_generados_nueva (
                id, interaccion_id, formato, titulo, contenido,
                llamada_accion, hashtags, tono, estado,
                creado_en, actualizado_en
            )
            SELECT
                id, interaccion_id, formato, titulo, contenido,
                llamada_accion, hashtags, tono, estado,
                creado_en, actualizado_en
            FROM contenidos_generados
        """)

        conexion.execute("DROP TABLE contenidos_generados")

        conexion.execute("""
            ALTER TABLE contenidos_generados_nueva
            RENAME TO contenidos_generados
        """)

        errores = conexion.execute(
            "PRAGMA foreign_key_check"
        ).fetchall()

        if errores:
            raise RuntimeError(
                f"Errores de integridad referencial: {errores}"
            )

        conexion.commit()
        print("Migración completada correctamente.")

    except Exception:
        conexion.rollback()
        raise

    finally:
        conexion.close()


if __name__ == "__main__":
    migrar()
