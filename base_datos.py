import sqlite3
from datetime import datetime, timezone

from periodos import a_utc_iso

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
                enviado_en TEXT,
                estado TEXT NOT NULL DEFAULT 'pendiente',
                creado_en TEXT NOT NULL
            )
            """
        )

        # CREATE TABLE IF NOT EXISTS no agrega columnas a una tabla que ya existía. Si la base
        # es anterior a enviado_en, prefiero avisar claro y ahora, en vez de que falle después
        # con un error confuso al guardar (o, peor, que guarde sin la fecha)
        columnas = [f[1] for f in conexion.execute("PRAGMA table_info(interacciones)").fetchall()]
        if "enviado_en" not in columnas:
            raise RuntimeError(
                "La tabla 'interacciones' es de una versión anterior y no tiene la columna "
                "'enviado_en'. Respalda y borra communitylab.db, y vuelve a correr el bot para "
                "reconstruirla desde Discord."
            )
        conexion.commit()
    finally:
        conexion.close()


def guardar_interaccion(origen, periodo, autor, canal, tipo, texto, hash_mensaje, enviado_en=None) -> bool:
    """Guarda un mensaje. Regresa True si era nuevo y False si ya existía (repetido)."""
    conexion = sqlite3.connect(RUTA_BD)
    try:
        # antes usaba INSERT OR IGNORE directo, pero eso gasta un id de AUTOINCREMENT
        # incluso cuando el mensaje ya existía (el contador de SQLite avanza aunque el
        # insert se descarte). Por eso primero pregunto si el hash ya existe, y solo
        # si no existe hago el INSERT: así el id solo sube con mensajes de verdad nuevos
        existe = conexion.execute(
            "SELECT 1 FROM interacciones WHERE hash = ?", (hash_mensaje,)
        ).fetchone()
        if existe:
            return False

        conexion.execute(
            """
            INSERT INTO interacciones
            (hash, origen_comunidad, periodo_referencia, autor, canal, tipo, texto, enviado_en, creado_en)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                # cuándo lo guardó el bot (la "llamada"). En UTC y con el mismo formato que
                # enviado_en, para que no dependa del reloj de la máquina donde corra (PC o Colab)
                a_utc_iso(datetime.now(timezone.utc)),
            ),
        )
        conexion.commit()
        return True
    finally:
        conexion.close()


def _corte_utc(corte) -> str:
    """
    Convierte un corte de fecha (texto ISO o datetime) al formato exacto en que se guarda
    enviado_en. Es necesario porque el filtro compara las fechas como texto: si el corte
    llegara en otro formato (por ejemplo con otra zona horaria), compararía mal y sin avisar.
    Una fecha sin zona horaria se toma como UTC. Si el texto no es una fecha, lanza ValueError.
    """
    if isinstance(corte, str):
        corte = datetime.fromisoformat(corte)
    return a_utc_iso(corte)


def listar_interacciones(canal=None, estado=None, limite=100, desde_utc=None, hasta_utc=None) -> list:
    """
    Regresa las interacciones guardadas como lista de diccionarios (las más recientes primero).

    desde_utc y hasta_utc filtran por enviado_en, la fecha real de envío en Discord:
    desde_utc SÍ incluye ese instante y hasta_utc NO lo incluye, así dos periodos seguidos
    no repiten ni se saltan mensajes. Con limite=None no hay tope de mensajes. Los mensajes
    sin fecha (paquetes armados a mano) no aparecen cuando se filtra por fechas.
    """
    conexion = sqlite3.connect(RUTA_BD)
    # row_factory hace que cada fila se pueda convertir a diccionario con sus nombres de columna
    conexion.row_factory = sqlite3.Row
    try:
        # no incluyo el hash porque es un dato interno que a mis compañeros no les sirve
        consulta = (
            "SELECT id, origen_comunidad, periodo_referencia, autor, canal, tipo, texto, enviado_en, estado, creado_en "
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
