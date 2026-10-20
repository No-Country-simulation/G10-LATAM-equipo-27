import re
import sqlite3
from datetime import datetime, timedelta

import base_datos
from periodos import FECHA_INICIO, ZONA_PROYECTO, semana_de


def periodo_semanal(etiqueta):
    match = re.fullmatch(
        r"(\d{4})-semana-(\d{2})",
        str(etiqueta or "").strip(),
    )
    if not match:
        raise ValueError("Formato de semana invalido")

    anio = int(match.group(1))
    numero = int(match.group(2))

    if numero < 1:
        raise ValueError("La semana debe ser mayor que cero")

    inicio = FECHA_INICIO + timedelta(weeks=numero - 1)
    fin = inicio + timedelta(days=6)

    if inicio.year != anio:
        raise ValueError("La semana no corresponde al anio indicado")

    return inicio, fin


def cargar_paquete_semanal(etiqueta):
    inicio, fin = periodo_semanal(etiqueta)

    aprobados = []
    descartados = []
    pendientes_curaduria = []

    with sqlite3.connect(base_datos.RUTA_BD) as conn:
        conn.row_factory = sqlite3.Row

        columnas = {
            row[1]
            for row in conn.execute(
                "PRAGMA table_info(interacciones)"
            ).fetchall()
        }

        necesarias = {
            "id", "autor", "canal", "texto", "enviado_en",
            "estado", "relevancia", "sentimiento",
            "temas_clave", "segmento", "razonamiento",
            "estado_curaduria",
        }

        if not necesarias.issubset(columnas):
            raise RuntimeError(
                "La base de datos no contiene todas las columnas requeridas"
            )

        filas = conn.execute(
            """
            SELECT id, autor, canal, texto, enviado_en,
                   estado, relevancia, sentimiento,
                   temas_clave, segmento, razonamiento,
                   estado_curaduria
            FROM interacciones
            WHERE estado = 'analizado'
              AND enviado_en IS NOT NULL
            """
        ).fetchall()

    for fila in filas:
        dato = dict(fila)

        try:
            fecha = datetime.fromisoformat(dato["enviado_en"])
            if fecha.tzinfo is None:
                continue
            fecha_local = fecha.astimezone(ZONA_PROYECTO).date()
        except (TypeError, ValueError):
            continue

        if fecha_local > fin:
            continue

        if inicio > FECHA_INICIO and fecha_local < inicio:
            continue

        if semana_de(fecha) != (
            (inicio - FECHA_INICIO).days // 7 + 1
        ):
            continue

        estado_curaduria = (
            dato.get("estado_curaduria") or "pending"
        ).lower()

        if estado_curaduria not in {"curated", "discarded", "pending"}:
            continue

        item = {
            "id_mensaje": dato["id"],
            "autor": dato["autor"],
            "canal_origen": dato["canal"],
            "comunidad": "Discord",
            "semana": etiqueta,
            "fecha_envio": dato["enviado_en"],
            "texto_original": dato["texto"],
            "kpis": {
                "relevancia": int(dato["relevancia"] or 0),
                "sentimiento": dato["sentimiento"] or "Neutral",
                "temas_clave": dato["temas_clave"] or "N/A",
                "segmento": dato["segmento"] or "General",
                "razonamiento": dato["razonamiento"] or "",
            },
        }

        if estado_curaduria == "discarded":
            descartados.append(item)
        elif estado_curaduria == "curated":
            aprobados.append(item)
        else:
            pendientes_curaduria.append(item)

    return {
        "aprobados": aprobados,
        "descartados": descartados,
        "pendientes_curaduria": pendientes_curaduria,
    }
