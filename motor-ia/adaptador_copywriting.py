"""Adaptador de resultados IA locales hacia Copywriting."""

import json

from base_datos import obtener_interaccion
from integracion_identidad_persistencia import preparar_desde_identidad_local


def preparar_resultado_copywriting(
    id_local: int,
    *,
    permitir_conexion: bool = False,
) -> dict:
    """Prepara un resultado ya analizado; no escribe en Supabase."""
    interaccion = obtener_interaccion(id_local)

    if interaccion is None:
        raise ValueError("Interaccion local no encontrada.")

    if interaccion.get("estado") != "analizado":
        raise ValueError("La interaccion no tiene analisis finalizado.")

    relevancia = interaccion.get("relevancia")

    if type(relevancia) is not int or not 0 <= relevancia <= 100:
        raise ValueError("Relevancia invalida.")

    temas = interaccion.get("temas_clave")

    if isinstance(temas, str):
        try:
            temas = json.loads(temas)
        except json.JSONDecodeError:
            pass

    if isinstance(temas, (list, dict)):
        temas = json.dumps(temas, ensure_ascii=False)

    datos_ia = {
        "texto_original": interaccion["texto"],
        "autor": interaccion["autor"],
        "canal_origen": interaccion["canal"],
        "kpis": {
            "relevancia": relevancia,
            "sentimiento": interaccion.get("sentimiento"),
            "temas_clave": temas,
            "segmento": interaccion.get("segmento"),
            "razonamiento": interaccion.get("razonamiento"),
        },
    }

    decision = "aprobado" if relevancia >= 70 else "descartado"

    return preparar_desde_identidad_local(
        id_local,
        datos_ia,
        decision,
        permitir_conexion=permitir_conexion,
    )
