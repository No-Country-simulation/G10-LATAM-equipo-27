import os
from datetime import datetime, timezone
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

from periodos import a_utc_iso

load_dotenv()

def obtener_conexion():
    """Retorna una conexión segura a PostgreSQL (Supabase) usando variables de entorno."""
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return psycopg2.connect(database_url, sslmode="require")

    # Si no existe DATABASE_URL, usa las variables separadas (ninguna con contraseñas quemadas)
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        database=os.getenv("DB_NAME", "postgres"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        port=os.getenv("DB_PORT", "6543"),
        sslmode="require",
    )

def crear_tabla() -> None:
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # el campo hash es UNIQUE: si intento guardar un mensaje repetido, la base lo ignora.
            # "estado" es el que van a usar después las demás etapas (pendiente, analizado, etc.)
            # En Postgres usamos SERIAL en vez de AUTOINCREMENT
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS interacciones (
                    id SERIAL PRIMARY KEY,
                    hash VARCHAR(128) UNIQUE NOT NULL,
                    origen_comunidad VARCHAR(100) NOT NULL,
                    periodo_referencia VARCHAR(100) NOT NULL,
                    autor VARCHAR(100) NOT NULL,
                    canal VARCHAR(100) NOT NULL,
                    tipo VARCHAR(50),
                    texto TEXT NOT NULL,
                    enviado_en VARCHAR(100),
                    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
                    creado_en VARCHAR(100) NOT NULL
                );
                """
            )
        conexion.commit()
    finally:
        conexion.close()


def guardar_interaccion(
    origen, periodo, autor, canal, tipo, texto, hash_mensaje, enviado_en=None
) -> bool:
    """Guarda un mensaje. Regresa True si era nuevo y False si ya existía (repetido)."""
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # antes usaba INSERT directo/ignorar, pero eso gasta un id
            # incluso cuando el mensaje ya existía (el contador avanza aunque el
            # insert se descarte). Por eso primero pregunto si el hash ya existe, y solo
            # si no existe hago el INSERT: así el id solo sube con mensajes de verdad nuevos
            cursor.execute(
                "SELECT 1 FROM interacciones WHERE hash = %s;", (hash_mensaje,)
            )
            if cursor.fetchone():
                return False

            cursor.execute(
                """
                INSERT INTO interacciones
                (hash, origen_comunidad, periodo_referencia, autor, canal, tipo, texto, enviado_en, creado_en)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
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
    """Convierte un corte de fecha (texto ISO o datetime) al formato exacto en que se guarda

    enviado_en. Es necesario porque el filtro compara las fechas como texto: si el corte
    llegara en otro formato (por ejemplo con otra zona horaria), compararía mal y sin avisar.
    Una fecha sin zona horaria se toma como UTC. Si el texto no es una fecha, lanza ValueError.
    """
    if isinstance(corte, str):
        corte = datetime.fromisoformat(corte)
    return a_utc_iso(corte)


def listar_interacciones(
    canal=None, estado=None, limite=100, desde_utc=None, hasta_utc=None
) -> list:
    """Regresa las interacciones guardadas como lista de diccionarios (las más recientes primero).

    desde_utc y hasta_utc filtran por enviado_en, la fecha real de envío en Discord:
    desde_utc SÍ incluye ese instante y hasta_utc NO lo incluye, así dos periodos seguidos
    no repiten ni se saltan mensajes. Con limite=None no hay tope de mensajes. Los mensajes
    sin fecha (paquetes armados a mano) no aparecen cuando se filtra por fechas.
    """
    conexion = obtener_conexion()
    try:
        # RealDictCursor devuelve cada fila directamente como un diccionario con sus nombres de columna
        with conexion.cursor(cursor_factory=RealDictCursor) as cursor:
            # no incluyo el hash porque es un dato interno que a mis compañeros no les sirve
            consulta = (
                "SELECT id, origen_comunidad, periodo_referencia, autor, canal,"
                " tipo, texto, enviado_en, estado, creado_en FROM"
                " interacciones"
            )
            condiciones = []
            parametros = []
            if canal:
                condiciones.append("canal = %s")
                parametros.append(canal)
            if estado:
                condiciones.append("estado = %s")
                parametros.append(estado)
            if desde_utc:
                condiciones.append("enviado_en >= %s")
                parametros.append(_corte_utc(desde_utc))
            if hasta_utc:
                condiciones.append("enviado_en < %s")
                parametros.append(_corte_utc(hasta_utc))

            if condiciones:
                consulta += " WHERE " + " AND ".join(condiciones)
            consulta += " ORDER BY id DESC"
            if limite is not None:
                consulta += " LIMIT %s"
                parametros.append(limite)

            cursor.execute(consulta, parametros)
            filas = cursor.fetchall()
            return [dict(fila) for fila in filas]
    finally:
        conexion.close()