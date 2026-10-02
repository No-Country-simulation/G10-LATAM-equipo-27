from datetime import date, timedelta

from app.oci_storage.schemas import WeeklyPeriod
from sqlalchemy.orm import Session

from app.oci_storage.models import OCIWeeklySync


def get_previous_week_period() -> WeeklyPeriod:
    today = date.today()

    current_week_start = today - timedelta(days=today.weekday())

    previous_week_end = current_week_start - timedelta(days=1)
    previous_week_start = previous_week_end - timedelta(days=6)

    return WeeklyPeriod(
        start_date=previous_week_start,
        end_date=previous_week_end,
        status="pending"
    )

def get_existing_weekly_sync(
    db: Session,
    start_date: date,
    end_date: date
):
    return (
        db.query(OCIWeeklySync)
        .filter(
            OCIWeeklySync.start_date == start_date,
            OCIWeeklySync.end_date == end_date,
            OCIWeeklySync.status.in_(["pending", "synced"])
        )
        .first()
    )

def create_weekly_sync(
    db: Session,
    start_date: date,
    end_date: date,
    created_by: int
) -> OCIWeeklySync:
    sync = OCIWeeklySync(
        start_date=start_date,
        end_date=end_date,
        status="pending",
        created_by=created_by
    )

    try:
        db.add(sync)
        db.commit()
        db.refresh(sync)

        return sync
    except Exception:
        db.rollback()
        raise