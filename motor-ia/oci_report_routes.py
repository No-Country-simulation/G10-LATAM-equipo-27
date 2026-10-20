import json
import os
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from oci_report_data import cargar_paquete_semanal, periodo_semanal
from reporte_semanal import generar_reporte_semanal
from periodos import FECHA_INICIO, ZONA_PROYECTO, semana_de


router = APIRouter(prefix="/api/v1/oci-storage", tags=["oci-storage"])


class WeeklySyncRequest(BaseModel):
    semana: str | None = None


def reports_directory():
    value = os.getenv(
        "CLOUDEDTECH_REPORTS_DIR",
        str(Path(__file__).resolve().parent / "reportes"),
    )
    return Path(value).expanduser().resolve()


def current_week_label():
    now = datetime.now(timezone.utc).astimezone(ZONA_PROYECTO)
    number = semana_de(now)
    start = FECHA_INICIO + timedelta(weeks=number - 1)
    return f"{start.year}-semana-{number:02d}"


@router.get("/weekly-period")
def weekly_period():
    label = current_week_label()
    start, end = periodo_semanal(label)
    return {
        "semana": label,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "status": "available",
    }


@router.get("/reports")
def list_reports():
    folder = reports_directory()
    reports = []

    if folder.exists():
        for path in sorted(folder.glob("*.json"), reverse=True):
            if not re.fullmatch(
                r"\d{4}-semana-\d{2}\.json",
                path.name,
            ):
                continue

            try:
                data = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, ValueError):
                continue

            metadata = data.get("metadata") or {}
            storage = metadata.get("oci_storage") or {}

            reports.append({
                "semana": metadata.get("semana", path.stem),
                "nombre_archivo": path.name,
                "tamano_bytes": path.stat().st_size,
                "generado_en": metadata.get("generado_en"),
                "subido_oci": bool(storage.get("subido", False)),
                "proveedor": storage.get("proveedor", "local"),
                "resumen_metricas": data.get("resumen_metricas", {}),
                "reporte": data,
            })

    return {"reports": reports, "total": len(reports)}


@router.post("/weekly-sync")
def weekly_sync(payload: WeeklySyncRequest):
    label = payload.semana or current_week_label()

    try:
        periodo_semanal(label)
        paquete = cargar_paquete_semanal(label)

        total = sum(len(items) for items in paquete.values())
        if total == 0:
            raise HTTPException(
                status_code=400,
                detail="No existen mensajes analizados para esta semana",
            )

        reporte = generar_reporte_semanal(label, paquete)

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    storage = reporte["metadata"]["oci_storage"]

    return {
        "exito": True,
        "status": (
            "synced" if storage.get("subido") else "saved_locally"
        ),
        "semana": label,
        "subido_oci": bool(storage.get("subido")),
        "resumen": reporte["resumen_metricas"],
        "reporte": reporte,
    }
