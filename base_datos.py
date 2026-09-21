import sqlite3
from datetime import datetime

# el archivo de la base se crea solo en la carpeta del proyecto (lo agregué al .gitignore como *.db)
RUTA_BD = "communitylab.db"


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
        conexion.commit()
    finally:
        conexion.close()


def guardar_interaccion(origen, periodo, autor, canal, tipo, texto, hash_mensaje) -> bool:
    """Guarda un mensaje. Regresa True si era nuevo y False si ya existía (repetido)."""
    conexion = sqlite3.connect(RUTA_BD)
    try:
        # INSERT OR IGNORE: si el hash ya existe no da error, simplemente no inserta nada
        cursor = conexion.execute(
            """
            INSERT OR IGNORE INTO interacciones
            (hash, origen_comunidad, periodo_referencia, autor, canal, tipo, texto, creado_en)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
            ),
        )
        conexion.commit()
        # rowcount vale 1 si insertó y 0 si lo ignoró por repetido
        return cursor.rowcount == 1
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
            "SELECT id, origen_comunidad, periodo_referencia, autor, canal, tipo, texto, estado, creado_en "
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
