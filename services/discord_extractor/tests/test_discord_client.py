"""Tests del cliente REST de Discord: paginacion y manejo de rate limit."""

import httpx
import pytest
import respx

from app.config import Settings
from app.discord_client import DiscordClient, datetime_to_snowflake
from datetime import datetime, timezone


def _settings() -> Settings:
    return Settings(
        api_key="test-key",
        discord_bot_token="test-token",
        discord_guild_id="1",
        discord_api_base="https://discord.test/api/v10",
    )


@pytest.mark.asyncio
async def test_get_text_channels_filtra_por_tipo():
    with respx.mock(base_url="https://discord.test/api/v10") as mock:
        mock.get("/guilds/1/channels").respond(
            200,
            json=[
                {"id": "10", "name": "general", "type": 0},
                {"id": "11", "name": "voz", "type": 2},
                {"id": "12", "name": "anuncios", "type": 5},
                {"id": "13", "name": "categoria", "type": 4},
            ],
        )
        async with DiscordClient(_settings()) as client:
            canales = await client.get_text_channels("1")

    assert [c["id"] for c in canales] == ["10", "12"]


@pytest.mark.asyncio
async def test_get_channel_messages_pagina_con_before():
    lote_1 = [{"id": str(i), "content": f"msg {i}"} for i in range(100, 0, -1)]
    lote_2 = [{"id": str(i), "content": f"msg {i}"} for i in range(150, 100, -1)]

    with respx.mock(base_url="https://discord.test/api/v10") as mock:
        route = mock.get("/channels/10/messages")
        route.side_effect = [
            httpx.Response(200, json=lote_1),
            httpx.Response(200, json=lote_2),
        ]
        async with DiscordClient(_settings()) as client:
            mensajes = await client.get_channel_messages("10", max_mensajes=150)

    assert len(mensajes) == 150
    assert route.call_count == 2
    segunda_llamada = route.calls[1].request.url.params
    assert segunda_llamada["before"] == "1"


@pytest.mark.asyncio
async def test_get_channel_messages_reintenta_ante_rate_limit():
    with respx.mock(base_url="https://discord.test/api/v10") as mock:
        route = mock.get("/channels/10/messages")
        route.side_effect = [
            httpx.Response(429, json={"retry_after": 0.01}),
            httpx.Response(200, json=[{"id": "1", "content": "hola"}]),
        ]
        async with DiscordClient(_settings()) as client:
            mensajes = await client.get_channel_messages("10", max_mensajes=10)

    assert mensajes == [{"id": "1", "content": "hola"}]
    assert route.call_count == 2


def test_datetime_to_snowflake_es_determinista():
    dt = datetime(2024, 1, 1, tzinfo=timezone.utc)
    assert datetime_to_snowflake(dt) == datetime_to_snowflake(dt)
    assert datetime_to_snowflake(dt).isdigit()
