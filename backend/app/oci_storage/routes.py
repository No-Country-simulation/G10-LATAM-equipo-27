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
    tags=["OCI Storage"]
)


@router.get("/status")
def get_oci_storage_status(
    current_user: User = Depends(require_role("admin"))
):
    return {
        "status": "ready",
        "message": "Módulo OCI Storage disponible"
    }


@router.get(
    "/weekly-period",
    response_model=WeeklyPeriod
)
def get_weekly_period(
    current_user: User = Depends(require_role("admin"))
):
    return get_previous_week_period()


@router.post("/weekly-sync")
def start_weekly_sync(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    period = get_previous_week_period()

    existing_sync = get_existing_weekly_sync(
        db=db,
        start_date=period.start_date,
        end_date=period.end_date
    )

    if existing_sync:
        if existing_sync.status == "pending":
            return {
                "status": "already_pending",
                "message": "Esta semana ya tiene una sincronización pendiente",
                "sync_id": existing_sync.id
            }

        return {
            "status": "already_synced",
            "message": "Esta semana ya fue sincronizada",
            "sync_id": existing_sync.id
        }

    sync = create_weekly_sync(
        db=db,
        start_date=period.start_date,
        end_date=period.end_date,
        created_by=current_user.id
    )

    return {
        "status": sync.status,
        "message": "Sincronización semanal preparada",
        "sync_id": sync.id,
        "start_date": sync.start_date,
        "end_date": sync.end_date
    }