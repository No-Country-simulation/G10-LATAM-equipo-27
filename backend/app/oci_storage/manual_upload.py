import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

MAX_BYTES = 10 * 1024 * 1024


def store_manual_json(data: bytes) -> dict:
    if len(data) > MAX_BYTES:
        raise ValueError("El archivo supera 10 MB")

    try:
        parsed = json.loads(data.decode("utf-8-sig"))
    except (UnicodeError, ValueError) as exc:
        raise ValueError("El archivo no contiene JSON valido") from exc

    directory = Path(
        os.getenv(
            "CLOUDEDTECH_MANUAL_REPORTS_DIR",
            str(Path.home() / ".cloudedtech" / "manual-reports"),
        )
    )
    directory.mkdir(parents=True, exist_ok=True)

    filename = (
        "manual-"
        + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        + "-"
        + uuid.uuid4().hex[:12]
        + ".json"
    )

    destination = directory / filename
    payload = json.dumps(
        parsed, ensure_ascii=False, indent=2
    ).encode("utf-8")

    with destination.open("xb") as output:
        output.write(payload)

    return {
        "status": "saved_locally",
        "filename": filename,
        "size": len(payload),
        "storage": "backend_local",
        "message": "Archivo JSON guardado en el servidor",
    }
