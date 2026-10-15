from sqlalchemy.orm import Session

from app.audit.models import AuditLog
from app.users.models import User
from datetime import datetime, timedelta


def create_audit_log(
    db: Session,
    action: str,
    resource_type: str,
    user_id: int | None = None,
    resource_id: str | None = None,
    details: str | None = None,
) -> AuditLog:
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        
        
    )

    try:
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)

        return audit_log
    
    except Exception:
        db.rollback()
        raise


def get_audit_logs(
    db: Session,
    limit: int = 100,
    offset: int = 0,
    days: int = 7,
    action: str | None = None,
    user_id: int | None = None,
):
    limit_date = datetime.utcnow() - timedelta(days=days)

    query = (
        db.query(AuditLog, User.username)
        .outerjoin(User, AuditLog.user_id == User.id)
        .filter(AuditLog.created_at >= limit_date)
    )

    if action:
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)


    
    results = (
        query
        .order_by(AuditLog.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    logs = []

    for audit_log, username in results:
        audit_log.username = username
        logs.append(audit_log)

    return logs