from datetime import date

from pydantic import BaseModel


class WeeklyPeriod(BaseModel):
    start_date: date
    end_date: date
    status: str