from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.security.dependencies import require_role
from app.users.models import User
from app.database.dependencies import get_db
from app.oci_storage.schemas import WeeklyPeriod
from app.oci_storage.service import (
    get_previous_week_period,
    get_existing_weekly_sync,
    create_weekly_sync,
)

router = APIRouter(
    prefix="/api/v1/oci-storage",
    tags=["OCI Storage"],
)


@router.get("/status")
def get_oci_storage_status(
    current_user: User = Depends(
        require_role("admin", "community_manager")
    ),
):
    return {
        "status": "ready",
        "message": "Modulo OCI Storage disponible",
    }


@router.get("/weekly-period", response_model=WeeklyPeriod)
def get_weekly_period(
    current_user: User = Depends(
        require_role("admin", "community_manager")
    ),
):
    return get_previous_week_period()


@router.post("/weekly-sync")
def start_weekly_sync(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("admin", "community_manager")
    ),
):
    from datetime import date, datetime
    from fastapi import HTTPException
    from app.oci_storage.motor_bridge import generar_reporte_motor

    period = get_previous_week_period()
    project_start = date(2026, 9, 21)
    number = ((period.start_date - project_start).days // 7) + 1

    if number < 1:
        raise HTTPException(
            status_code=400,
            detail="El proyecto aun no tiene semanas completas",
        )

    label = f"{period.start_date.year}-semana-{number:02d}"

    sync = get_existing_weekly_sync(
        db=db,
        start_date=period.start_date,
        end_date=period.end_date,
    )

    if sync and sync.status in {"synced", "saved_locally"}:
        return {
            "status": "already_synced",
            "message": "El reporte semanal ya fue generado",
            "sync_id": sync.id,
            "semana": label,
            "storage_status": sync.status,
        }

    if sync is None:
        sync = create_weekly_sync(
            db=db,
            start_date=period.start_date,
            end_date=period.end_date,
            created_by=current_user.id,
        )

    result = generar_reporte_motor(label)

    if result.get("exito") is not True:
        raise HTTPException(
            status_code=502,
            detail="El Motor IA no confirmo el reporte semanal",
        )

    storage_status = result.get("status")
    if storage_status not in {"synced", "saved_locally"}:
        raise HTTPException(
            status_code=502,
            detail="Estado de almacenamiento no confirmado",
        )

    sync.status = storage_status
    sync.object_name = (
        f"activos/{label}/paquete-distribucion.json"
        if storage_status == "synced"
        else f"{label}.json"
    )
    sync.synced_at = datetime.utcnow()

    try:
        db.commit()
        db.refresh(sync)
    except Exception:
        db.rollback()
        raise

    return {
        "status": sync.status,
        "message": (
            "Reporte guardado en OCI"
            if sync.status == "synced"
            else "Reporte guardado en almacenamiento local del Motor IA"
        ),
        "sync_id": sync.id,
        "semana": label,
        "start_date": sync.start_date,
        "end_date": sync.end_date,
        "object_name": sync.object_name,
        "resumen": result.get("resumen", {}),
    }
from fastapi import HTTPException, Query
from oci.exceptions import ServiceError

from app.oci_storage.object_service import (
    list_json_objects,
    get_json_object,
)


@router.get("/objects")
def list_oci_json_objects(
    prefix: str = Query(default="", max_length=255),
    limit: int = Query(default=100, ge=1, le=1000),
    current_user: User = Depends(
        require_role("admin", "community_manager")
    ),
):
    try:
        return {
            "objects": list_json_objects(prefix=prefix, limit=limit)
        }
    except (RuntimeError, ServiceError) as exc:
        raise HTTPException(
            status_code=503,
            detail="No se pudo consultar OCI Object Storage",
        ) from exc


@router.get("/objects/content")
def read_oci_json_object(
    object_name: str = Query(min_length=1, max_length=1024),
    current_user: User = Depends(
        require_role("admin", "community_manager")
    ),
):
    try:
        return {
            "object_name": object_name,
            "content": get_json_object(object_name),
        }
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc
    except (RuntimeError, ServiceError) as exc:
        raise HTTPException(
            status_code=503,
            detail="No se pudo obtener el archivo JSON desde OCI",
        ) from exc


@router.get("/reports")
def list_weekly_reports(
    current_user: User = Depends(
        require_role("admin", "community_manager")
    ),
):
    from app.oci_storage.motor_bridge import consultar_reportes_motor

    return consultar_reportes_motor()


from app.oci_storage.notification_settings import (
    NotificationSettings,
    load_settings,
    save_settings,
    public_settings,
)


@router.get("/notification-settings")
def get_notification_settings(
    current_user: User = Depends(require_role("admin", "community_manager")),
):
    return public_settings(load_settings())


@router.put("/notification-settings")
def update_notification_settings(
    settings: NotificationSettings,
    current_user: User = Depends(require_role("admin", "community_manager")),
):
    previous = load_settings()
    if not settings.webhook:
        settings.webhook = previous.webhook
    save_settings(settings)
    return public_settings(settings)


from fastapi import File, UploadFile
from app.oci_storage.manual_upload import MAX_BYTES, store_manual_json


@router.post("/manual-upload")
async def upload_manual_json(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role("admin", "community_manager")),
):
    if not file.filename or not file.filename.lower().endswith(".json"):
        raise HTTPException(status_code=400, detail="Solo se admiten archivos JSON")

    data = await file.read(MAX_BYTES + 1)
    await file.close()

    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="El archivo supera 10 MB")

    try:
        return store_manual_json(data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
