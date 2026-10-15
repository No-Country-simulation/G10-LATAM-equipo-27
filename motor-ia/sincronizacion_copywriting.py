"""Sincronizacion controlada de resultados IA con Copywriting."""

import os
from datetime import datetime, timezone

from persistencia_supabase_segura import preparar_paquete_supabase


def sincronizar_lote_copywriting(
    paquete_maestro: dict,
    *,
    permitir_escritura: bool = False,
) -> int:
    """Sincroniza registros validados sin alterar estados HITL."""

    registros = preparar_paquete_supabase(paquete_maestro)

    if not permitir_escritura:
        raise RuntimeError(
            "Sincronizacion deshabilitada: requiere autorizacion explicita."
        )

    if not registros:
        return 0

    database_url = os.getenv("SUPABASE_DB_URL")

    if not database_url:
        raise RuntimeError("SUPABASE_DB_URL no esta configurada.")

    try:
        import psycopg2
        from psycopg2.extras import execute_values
    except ImportError as exc:
        raise RuntimeError("Se requiere psycopg2.") from exc

    columnas = (
        "id_mensaje",
        "autor",
        "canal_origen",
        "comunidad",
        "semana",
        "fecha_envio",
        "fecha_extraccion",
        "modelo_ia",
        "texto_original",
        "relevancia",
        "sentimiento",
        "temas_clave",
        "segmento",
        "razonamiento",
        "decision_ia",
        "analizado_en",
    )

    ahora_utc = datetime.now(timezone.utc).isoformat()

    valores = [
        tuple(
            ahora_utc if columna == "analizado_en"
            else registro.get(columna)
            for columna in columnas
        )
        for registro in registros
    ]

    sql = """
        INSERT INTO lotes_ia_kpis (
            id_mensaje, autor, canal_origen, comunidad, semana,
            fecha_envio, fecha_extraccion, modelo_ia, texto_original,
            relevancia, sentimiento, temas_clave, segmento,
            razonamiento, decision_ia, analizado_en
        )
        VALUES %s
        ON CONFLICT (id_mensaje) DO NOTHING
    """

    conexion = psycopg2.connect(
        database_url,
        sslmode="require",
        connect_timeout=5,
    )

    try:
        with conexion:
            with conexion.cursor() as cursor:
                execute_values(
                    cursor,
                    sql,
                    valores,
                    page_size=100,
                )
                insertados = cursor.rowcount

        return insertados
    finally:
        conexion.close()