"""Smoke test del endpoint /health (no requiere credenciales)."""

import os

# Los Settings exigen api_key/discord_bot_token/discord_guild_id al importar
# app.main; para este smoke test se completan con valores dummy.
os.environ.setdefault("API_KEY", "test-key")
os.environ.setdefault("DISCORD_BOT_TOKEN", "test-token")
os.environ.setdefault("DISCORD_GUILD_ID", "123")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)


def test_health_no_requiere_api_key():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
