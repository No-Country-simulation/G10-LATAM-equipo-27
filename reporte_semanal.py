import json
import os
import re
from collections import Counter
from datetime import datetime, timezone

from periodos import a_utc_iso
from oci_uploader import subir_json_a_oci


def validar_etiqueta(etiqueta: str) -> str:
    etiqueta = etiqueta.strip()
    if not re.fullmatch(r"\d{4}-semana-\d{2}", etiqueta):
        raise ValueError("Formato inválido. Usa AAAA-semana-NN (ej. 2026-semana-40)")
    return etiqueta


def _temas(item: dict) -> list:
    t = item.get("kpis", {}).get("temas_clave", [])
    if isinstance(t, str):
        t = re.findall(r"#\w+", t)  # extrae cada #hashtag
    return [x for x in t if x and x.upper() != "N/A"]


def generar_reporte_semanal(semana_nombre: str, paquete: dict) -> dict:
    semana_nombre = validar_etiqueta(semana_nombre)
    aprobados = paquete.get("aprobados", [])
    descartados = paquete.get("descartados", [])
    todos = aprobados + descartados

    if not todos:
        raise ValueError("No hay mensajes analizados. Ejecuta el análisis (sección 2) primero.")

    sentimiento = Counter(i["kpis"].get("sentimiento", "Sin dato") for i in todos)
    temas = Counter(t for i in todos for t in _temas(i))
    segmentos = Counter(
        i["kpis"].get("segmento") for i in todos
        if i["kpis"].get("segmento") not in (None, "N/A")
    )

    ruta_oci = f"activos/{semana_nombre}/paquete-distribucion.json"
    reporte = {
        "metadata": {
            "proyecto": "CommunityLab",
            "semana": semana_nombre,
            "version_esquema": "1.0",
            "generado_en": a_utc_iso(datetime.now(timezone.utc)),
            "oci_storage": {
                "bucket": os.getenv("OCI_BUCKET_NAME", "communitylab-assets"),
                "ruta": ruta_oci,
            },
        },
        "resumen_metricas": {
            "total_mensajes": len(todos),
            "total_aprobados": len(aprobados),
            "total_descartados": len(descartados),
            "sentimiento": dict(sentimiento),
            "temas_tendencia": [{"tema": t, "menciones": n} for t, n in temas.most_common(5)],
            "segmentos": dict(segmentos),
        },
        "activos_copywriting": {"aprobados": aprobados, "descartados": descartados},
    }

    os.makedirs("reportes", exist_ok=True)
    nombre_archivo = f"reportes/{semana_nombre}.json"
    with open(nombre_archivo, "w", encoding="utf-8") as f:
        json.dump(reporte, f, ensure_ascii=False, indent=2)

    resultado = subir_json_a_oci(nombre_archivo, ruta_oci)
    if resultado is False:  # compatible con tu uploader actual y con el nuevo
        raise RuntimeError("No se pudo subir a OCI (revisa credenciales). El JSON local sí se guardó.")

    return reporte