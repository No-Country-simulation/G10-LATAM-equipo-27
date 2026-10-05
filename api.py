from fastapi import FastAPI
from ver_json import obtener_json

app = FastAPI(
    title="CloudEdTech AI & Community API",
    version="1.0.0",
)

def adaptar_mensaje(item: dict) -> dict:
    mapa_sentimiento = {
        "Positivo": "positive",
        "Neutral": "neutral",
        "Negativo": "negative",
    }

    sentimiento = mapa_sentimiento.get(
        item.get("sentimiento"),
        "neutral",
    )

    temas = item.get("temas_clave") or ""

    keywords = [
        tema.lstrip("#").rstrip(",")
        for tema in temas.split()
        if tema.startswith("#")
    ]

    return {
        "message": {
            "platform": "discord",
            "guild_id": item.get("guild_id"),
            "guild_name": item.get("guild_name"),
            "channel_id": item.get("channel_id"),
            "channel_name": item.get("canal"),
            "message_id": item.get("message_id"),
            "author_id": item.get("author_id"),
            "author_name": item.get("autor"),
            "content": item.get("texto"),
            "created_at": item.get("enviado_en"),
        },
        "analysis": {
            "sentiment": sentimiento,
            # Confianza real generada por el modelo para la clasificación del sentimiento.
            "sentiment_score": item.get("sentiment_score") or 0.0,
            "topic": temas,
            "keywords": keywords,
            "highlight": (item.get("relevancia") or 0) >= 70,
        },
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "cloudedtech-ai-community"
    }

@app.get("/api/community/messages")
def list_messages():
    data = obtener_json()

    mensajes = [
        adaptar_mensaje(item)
        for item in data["interacciones"]
    ]

    return {
        "total": len(mensajes),
        "messages": mensajes,
    }