import os
import psycopg
from src.config import config

def actualizar_estado_lote(id_mensaje: str, nuevo_estado: str) -> bool:
    """
    Actualiza el estado_revision de un mensaje específico en la tabla lotes_ia_kpis.
    Estados válidos: 'pendiente', 'procesado', 'aprobado', 'desaprobado', 'rechazado'.
    """
    supabase_url_conn = config.SUPABASE_DB_URL or os.environ.get("SUPABASE_DB_URL")
    estados_validos = ['pendiente', 'procesado', 'aprobado', 'desaprobado', 'rechazado']

    if nuevo_estado not in estados_validos:
        print(f"❌ Error: El estado '{nuevo_estado}' no es válido dentro del ecosistema.")
        return False

    try:
        with psycopg.connect(supabase_url_conn, connect_timeout=10) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE public.lotes_ia_kpis
                    SET estado_revision = %s
                    WHERE id_mensaje = %s;
                    """,
                    (nuevo_estado, str(id_mensaje))
                )
                conn.commit()
        print(f"🔄 Estado en 'lotes_ia_kpis' actualizado a: '{nuevo_estado}' para el mensaje ID: {id_mensaje}")
        return True
    except Exception as e:
        print(f"❌ Error al actualizar estado en lotes_ia_kpis: {e}")
        return False


def obtener_siguiente_lote_pendiente():
    """
    Consulta lotes en lotes_ia_kpis dando prioridad estricta a:
    1. 'pendiente' (Nuevos)
    2. 'rechazado' (Para reevaluar)
    3. 'procesado' (Borradores listos esperando revisión humana o reanudación HITL)
    Para relevancia >= 35.
    El ORDER BY real del CASE es: pendiente=1, procesado=3, rechazado=2 (DESC).
    """
    supabase_url_conn = config.SUPABASE_DB_URL or os.environ.get("SUPABASE_DB_URL")

    if not supabase_url_conn:
        print("❌ Error: La variable de entorno SUPABASE_DB_URL no está configurada.")
        return None

    try:
        with psycopg.connect(supabase_url_conn, connect_timeout=10) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id_mensaje, autor, canal_origen, comunidad, semana, fecha_envio,
                        fecha_extraccion, texto_original, relevancia, sentimiento,
                        temas_clave, segmento, razonamiento, decision_ia, estado_revision
                    FROM public.lotes_ia_kpis
                    WHERE estado_revision IN ('pendiente', 'rechazado', 'procesado') AND relevancia >= 35
                    ORDER BY
                        relevancia DESC,
                        CASE
                            WHEN estado_revision = 'pendiente' THEN 1
                            WHEN estado_revision = 'procesado' THEN 3
                            WHEN estado_revision = 'rechazado' THEN 2
                        END DESC,
                        fecha_extraccion DESC
                    LIMIT 1;
                    """
                )
                fila = cur.fetchone()

                if fila:
                    id_msg = str(fila[0])
                    estado_encontrado = str(fila[14]).lower()

                    lote = {
                        "id_mensaje": id_msg,
                        "autor": str(fila[1] if fila[1] else "Comunidad CloudEDTech"),
                        "semana": str(fila[4] if fila[4] else "Semana_01"),
                        "fecha_envio": str(fila[5]) if fila[5] else None,
                        "fecha_extraccion": str(fila[6]) if fila[6] else None,
                        "json_precurado": {
                            "id_mensaje": id_msg,
                            "autor": str(fila[1]),
                            "canal_origen": str(fila[2]),
                            "comunidad": str(fila[3]),
                            "semana": str(fila[4]),
                            "texto_original": str(fila[7]),
                            "relevancia": fila[8],
                            "sentimiento": str(fila[9]),
                            "temas_clave": fila[10],
                            "segmento": str(fila[11]),
                            "razonamiento": str(fila[12]),
                            "decision_ia": fila[13],
                            "estado_revision": estado_encontrado
                        }
                    }

                    if estado_encontrado == "procesado":
                        print(f"⚠️ Atención: El lote ID: {id_msg} ya está en estado 'procesado'. Sus borradores ya existen en las tablas de checkpoints.")
                    else:
                        actualizar_estado_lote(id_msg, "procesado")

                    print(f"📥 Lote cargado [Origen: {estado_encontrado.upper()}] | ID: {id_msg}")
                    return lote
                else:
                    print("📭 No hay lotes pendientes, rechazados ni procesados con relevancia >= 35 en lotes_ia_kpis.")
                    return None

    except Exception as e:
        print(f"❌ Error al consultar lotes_ia_kpis: {e}")
        return None

def obtener_lotes_pendientes_masivos(limite: int = 5):
    """
    Extrae los lotes pendientes o rechazados de Supabase de forma ASCENDENTE,
    enfocándose estrictamente en los de menor relevancia (< 35) para procesamiento autónomo con Gemma 4.
    """
    supabase_url_conn = config.SUPABASE_DB_URL or os.environ.get("SUPABASE_DB_URL")
    lotes_extraidos = []

    if not supabase_url_conn:
        print("❌ Error: SUPABASE_DB_URL no está configurada.")
        return []

    try:
        with psycopg.connect(supabase_url_conn, connect_timeout=10) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id_mensaje, autor, semana, fecha_envio, fecha_extraccion,
                        texto_original, relevancia, sentimiento, estado_revision, decision_ia
                    FROM public.lotes_ia_kpis
                    WHERE estado_revision IN ('pendiente', 'rechazado')
                    AND relevancia IS NOT NULL
                    AND relevancia < 35
                    ORDER BY relevancia ASC
                    LIMIT %s;
                    """,
                    (limite,)
                )

                filas = cur.fetchall()

                for fila in filas:
                    try:
                        rel = int(float(fila[6])) if fila[6] is not None else 0
                    except (ValueError, TypeError):
                        rel = 0

                    lote_dict = {
                        "id_mensaje": str(fila[0]),
                        "autor": fila[1] if fila[1] else "Comunidad",
                        "semana": fila[2] if fila[2] else "Semana_01",
                        "fecha_envio": str(fila[3]) if fila[3] else "",
                        "fecha_extraccion": str(fila[4]) if fila[4] else "",
                        "json_precurado": {
                            "id_mensaje": str(fila[0]),
                            "texto_original": fila[5] if fila[5] else "",
                            "relevancia": rel,
                            "sentimiento": str(fila[7]) if fila[7] else "Neutro",
                            "estado_revision": str(fila[8]).lower() if fila[8] else "pendiente",
                            "decision_ia": str(fila[9]).lower() if fila[9] else "",
                        },
                    }
                    lotes_extraidos.append(lote_dict)

        print(f"📥 Lotes masivos encontrados: {len(lotes_extraidos)}")
        return lotes_extraidos

    except Exception as e:
        print(f"❌ Error al obtener lotes masivos de Supabase: {e}")
        return []