import json
import os
from pathlib import Path
from threading import Lock

from pydantic import BaseModel, Field

_LOCK = Lock()


class NotificationSettings(BaseModel):
    enabled: bool = False
    daily: bool = False
    weekly: bool = False
    notificationEmailEnabled: bool = False
    notificationWebhookEnabled: bool = False
    email: str = Field(default="", max_length=320)
    webhook: str = Field(default="", max_length=2048)
    format: str = Field(default="json-v2", pattern="^json-v[12]$")


def _settings_path() -> Path:
    directory = Path(
        os.getenv(
            "CLOUDEDTECH_SETTINGS_DIR",
            str(Path.home() / ".cloudedtech" / "settings"),
        )
    )
    directory.mkdir(parents=True, exist_ok=True)
    return directory / "report_notifications.json"


def load_settings() -> NotificationSettings:
    with _LOCK:
        path = _settings_path()
        if not path.exists():
            return NotificationSettings()
        return NotificationSettings.model_validate_json(
            path.read_text(encoding="utf-8")
        )


def save_settings(settings: NotificationSettings) -> None:
    with _LOCK:
        path = _settings_path()
        temp = path.with_suffix(".tmp")
        try:
            temp.write_text(
                settings.model_dump_json(indent=2),
                encoding="utf-8",
            )
            os.chmod(temp, 0o600)
            temp.replace(path)
        finally:
            if temp.exists():
                temp.unlink()


def public_settings(settings: NotificationSettings) -> dict:
    result = settings.model_dump()
    result["webhook"] = ""
    result["webhook_configured"] = bool(settings.webhook)
    return result
