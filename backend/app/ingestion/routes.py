from fastapi import APIRouter

from app.ingestion.store import (
    get_message_count,
    get_messages,
)


router = APIRouter(
    prefix="/api/community",
    tags=["Community Analytics"],
)


@router.get("/messages")
def list_messages():
    return {
        "total": get_message_count(),
        "messages": get_messages(),
    }