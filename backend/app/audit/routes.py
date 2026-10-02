from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.audit.service import get_audit_logs
from app.audit.schemas import AuditLogResponse
from app.database.dependencies import get_db
from app.security.dependencies import require_role
from app.users.models import User


router = APIRouter(
    prefix="/api/v1/audit",
    tags=["Audit"]
)


@router.get(
    "/",
    response_model=list[AuditLogResponse]
)
def get_audit_logs_route(
    limit: int = Query(default=100, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    days: int = Query(default=7, ge=1, le=365),
    action: str | None = Query(default=None),
    user_id: int | None = Query(default=None, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
    
):
    return get_audit_logs(
        db=db,
        limit=limit,
        offset=offset,
        days=days,
        action=action,
        user_id=user_id
    )