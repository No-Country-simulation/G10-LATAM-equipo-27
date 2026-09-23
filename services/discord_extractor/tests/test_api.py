"""Tests de los endpoints /channels y /extract, con Discord y OCI mockeados."""

import os
from unittest.mock import AsyncMock, MagicMock, patch

os.environ.setdefault("API_KEY", "test-key")
os.environ.setdefault("DISCORD_BOT_TOKEN", "test-token")
os.environ.setdefault("DISCORD_GUILD_ID", "999")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)
HEADERS = {"X-API-Key": "test-key"}

CANALES_FAKE = [
    {"id": "10", "name": "logros-y-empleos", "type": 0},
    {"id": "11", "name": "dudas-langgraph", "type": 0},
]

MENSAJES_FAKE = {
    "10": [
        {
            "id": "1",
            "content": "Quede seleccionada para el puesto de Dev Jr de IA!",
            "timestamp": "2026-09-20T10:00:00+00:00",
            "author": {"id": "1", "username": "mariana", "global_name": "Mariana Souza", "bot": False},
            "attachments": [],
            "reactions": [],
            "message_reference": None,
        }
    ],
    "11": [
        {
            "id": "2",
            "content": "Alguien tiene un ejemplo de router en LangGraph?",
            "timestamp": "2026-09-20T11:00:00+00:00",
            "author": {"id": "2", "username": "lucas", "global_name": "Lucas Albuquerque", "bot": False},
            "attachments": [],
            "reactions": [],
            "message_reference": None,
        }
    ],
}


def _mock_discord_client():
    mock = AsyncMock()
    mock.get_guild.return_value = {"id": "999", "name": "Grupo ONE G10"}
    mock.get_text_channels.return_value = CANALES_FAKE
    mock.get_channel_messages.side_effect = lambda channel_id, **_: MENSAJES_FAKE[channel_id]
    mock.__aenter__.return_value = mock
    mock.__aexit__.return_value = False
    return mock


def test_channels_requiere_api_key():
    response = client.get("/channels")
    assert response.status_code == 401


@patch("app.main.DiscordClient")
def test_listar_canales(mock_discord_cls):
    mock_discord_cls.return_value = _mock_discord_client()

    response = client.get("/channels", headers=HEADERS)

    assert response.status_code == 200
    data = response.json()
    assert data == [
        {"id": "10", "name": "logros-y-empleos", "category": None},
        {"id": "11", "name": "dudas-langgraph", "category": None},
    ]


@patch("app.main.ObjectStorageClient")
@patch("app.main.DiscordClient")
def test_extract_sin_subir_a_oci(mock_discord_cls, mock_storage_cls):
    mock_discord_cls.return_value = _mock_discord_client()

    response = client.post(
        "/extract",
        headers=HEADERS,
        json={
            "channel_ids": ["10", "11"],
            "periodo_referencia": "Semana_04",
            "subir_a_oci": False,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "exito"
    assert data["total_interacciones_procesadas"] == 2
    assert data["interacciones_por_canal"] == {
        "logros-y-empleos": 1,
        "dudas-langgraph": 1,
    }
    assert data["almacenamiento_oci"] is None
    assert data["paquete"]["origen_comunidad"] == "Discord_Grupo_ONE_G10"
    assert len(data["paquete"]["interacciones"]) == 2
    mock_storage_cls.assert_not_called()


@patch("app.main.ObjectStorageClient")
@patch("app.main.DiscordClient")
def test_extract_sube_a_oci(mock_discord_cls, mock_storage_cls):
    mock_discord_cls.return_value = _mock_discord_client()
    mock_storage = MagicMock()
    mock_storage.subir_paquete.return_value = (
        "communitylab-discord-raw",
        "discord/Semana_04/999-20260920T100000Z.json",
    )
    mock_storage_cls.return_value = mock_storage

    response = client.post(
        "/extract",
        headers=HEADERS,
        json={"channel_ids": ["10"], "periodo_referencia": "Semana_04"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["almacenamiento_oci"] == {
        "bucket": "communitylab-discord-raw",
        "ruta_objeto": "discord/Semana_04/999-20260920T100000Z.json",
        "status": "guardado_con_exito",
    }
    assert data["paquete"] is None
    mock_storage.subir_paquete.assert_called_once()
