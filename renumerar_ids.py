"""
Esto es una migración de una sola vez, no parte del flujo normal del proyecto.
Corrige los huecos que ya existen en el id (por ejemplo el salto de 27 a 42),
que se generaron antes de corregir guardar_interaccion en base_datos.py.

Cómo funciona: renombra la tabla actual, crea una tabla nueva con el mismo diseño,
copia todas las filas en el mismo orden en que ya estaban (para no alterar cuál
mensaje llegó primero) y borra la tabla vieja. Al copiarlas a una tabla nueva con
AUTOINCREMENT, los ids salen consecutivos solos.

Por seguridad, antes de tocar nada hace una copia del archivo .db con la fecha
de hoy en el nombre, por si algo saliera mal y hubiera que volver atrás.
"""
import shutil
import sqlite3
from datetime import datetime

from base_datos import RUTA_BD


def renumerar_ids() -> None:
    # copia de respaldo antes de tocar nada
    fecha = datetime.now().strftime("%Y%m%d_%H%M%S")
    respaldo = f"{RUTA_BD}.respaldo_{fecha}"
    shutil.copyfile(RUTA_BD, respaldo)
    print(f"Respaldo guardado en: {respaldo}")

    conexion = sqlite3.connect(RUTA_BD)
    try:
        total_antes = conexion.execute("SELECT COUNT(*) FROM interacciones").fetchone()[0]

        conexion.execute("ALTER TABLE interacciones RENAME TO interacciones_old")
        conexion.execute(
            """
            CREATE TABLE interacciones (
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
        conexion.execute(
            """
            INSERT INTO interacciones
            (hash, origen_comunidad, periodo_referencia, autor, canal, tipo, texto, enviado_en, estado, creado_en)
            SELECT hash, origen_comunidad, periodo_referencia, autor, canal, tipo, texto, enviado_en, estado, creado_en
            FROM interacciones_old ORDER BY id
            """
        )
        conexion.execute("DROP TABLE interacciones_old")
        conexion.commit()

        total_despues = conexion.execute("SELECT COUNT(*) FROM interacciones").fetchone()[0]
        assert total_antes == total_despues, "algo salió mal: no coincide el número de filas"

        print(f"Listo: {total_despues} filas, ids ahora consecutivos del 1 al {total_despues}.")
    finally:
        conexion.close()


if __name__ == "__main__":
    renumerar_ids()
