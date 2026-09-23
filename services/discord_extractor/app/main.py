"""Punto de entrada de la API de ingesta de Discord."""

from fastapi import FastAPI

app = FastAPI(
    title="CommunityLab - Discord Extractor",
    description=(
        "Servicio de ingesta que lee mensajes de canales de Discord y los deja "
        "listos, en formato de interacciones CommunityLab, en OCI Object Storage."
    ),
    version="0.1.0",
)


@app.get("/health", tags=["salud"])
def health() -> dict:
    """Chequeo de vida, sin autenticacion (usado por probes/monitoreo)."""
    return {"status": "ok"}


# Los endpoints /channels y /extract, protegidos con app.security.require_api_key,
# se agregan en una fase posterior una vez que exista el cliente de Discord
# y el cliente de OCI Object Storage.
