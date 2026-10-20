import json
import os
import re
from collections import Counter
from datetime import datetime, timezone

from periodos import a_utc_iso


def validar_etiqueta(etiqueta: str) -> str:
    etiqueta = etiqueta.strip()
    if not re.fullmatch(r"\d{4}-semana-\d{2}", etiqueta):
        raise ValueError("Formato inv├ílido. Usa AAAA-semana-NN (ej. 2026-semana-40)")
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
    pendientes_curaduria = paquete.get("pendientes_curaduria", [])
    todos = aprobados + descartados + pendientes_curaduria

    if not todos:
        raise ValueError("No existen mensajes analizados para esta semana. ├ílisis (secci├│n 2) primero.")

    sentimiento = Counter(i["kpis"].get("sentimiento", "Sin dato") for i in todos)
    temas = Counter(t for i in todos for t in _temas(i))
    segmentos = Counter(
        i["kpis"].get("segmento") for i in todos
        if i["kpis"].get("segmento") not in (None, "N/A")
    )

    ruta_oci = f"activos/{semana_nombre}/paquete-distribucion.json"
    reporte = {
        "metadata": {
            "proyecto": "CloudEdTech",
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
            "total_pendientes_curaduria": len(pendientes_curaduria),
            "sentimiento": dict(sentimiento),
            "temas_tendencia": [{"tema": t, "menciones": n} for t, n in temas.most_common(5)],
            "segmentos": dict(segmentos),
        },
        "activos_copywriting": {"aprobados": aprobados, "descartados": descartados,
            "pendientes_curaduria": pendientes_curaduria},
    }

    storage_provider = os.getenv(
        "CLOUDEDTECH_STORAGE_PROVIDER", "local"
    ).strip().lower()

    if storage_provider not in {"local", "oci"}:
        raise ValueError("Proveedor de almacenamiento no soportado")

    reports_dir = os.path.abspath(
        os.path.expanduser(
            os.getenv(
                "CLOUDEDTECH_REPORTS_DIR",
                os.path.join(os.path.dirname(__file__), "reportes"),
            )
        )
    )
    os.makedirs(reports_dir, exist_ok=True)

    nombre_archivo = os.path.join(
        reports_dir, f"{semana_nombre}.json"
    )

    storage_metadata = reporte["metadata"]["oci_storage"]
    storage_metadata["subido"] = False
    storage_metadata["proveedor"] = storage_provider
    storage_metadata["almacenamiento_local"] = True

    temporal = nombre_archivo + ".tmp"
    try:
        with open(temporal, "w", encoding="utf-8") as f:
            json.dump(reporte, f, ensure_ascii=False, indent=2)
        os.replace(temporal, nombre_archivo)
    finally:
        if os.path.exists(temporal):
            os.remove(temporal)

    if storage_provider == "oci":
        from oci_uploader import subir_json_a_oci

        try:
            storage_metadata["subido"] = bool(
                subir_json_a_oci(nombre_archivo, ruta_oci)
            )
        except Exception:
            storage_metadata["subido"] = False

        if storage_metadata["subido"]:
            storage_metadata["almacenamiento_local"] = True
        else:
            storage_metadata["error_subida"] = (
                "No se pudo subir el reporte a OCI"
            )

        temporal = nombre_archivo + ".tmp"
        try:
            with open(temporal, "w", encoding="utf-8") as f:
                json.dump(reporte, f, ensure_ascii=False, indent=2)
            os.replace(temporal, nombre_archivo)
        finally:
            if os.path.exists(temporal):
                os.remove(temporal)

    return reporte
