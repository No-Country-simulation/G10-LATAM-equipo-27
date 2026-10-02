import re

from app.analytics_mock.schemas import MessageAnalysis
from app.discord_connector.schemas import DiscordMessage


POSITIVE_WORDS = {
    "bueno",
    "buena",
    "excelente",
    "genial",
    "fácil",
    "facil",
    "rápido",
    "rapido",
    "mejor",
    "gustó",
    "gusto",
    "útil",
    "util",
    "bien",
}

NEGATIVE_WORDS = {
    "malo",
    "mala",
    "error",
    "problema",
    "lento",
    "lenta",
    "difícil",
    "dificil",
    "falla",
    "fallo",
    "peor",
}

TOPICS = {
    "empleo": {
        "empleo",
        "trabajo",
        "laboral",
        "vacante",
        "oportunidad",
    },
    "plataforma": {
        "plataforma",
        "aplicación",
        "aplicacion",
        "sistema",
        "página",
        "pagina",
    },
    "rendimiento": {
        "rápido",
        "rapido",
        "lento",
        "lenta",
        "velocidad",
        "respuesta",
        "carga",
    },
}


def analyze_message(
    message: DiscordMessage,
) -> MessageAnalysis:

    text = message.content.lower()

    words = re.findall(
        r"\b[\wáéíóúñü]+\b",
        text,
        flags=re.UNICODE,
    )

    positive_count = sum(
        word in POSITIVE_WORDS
        for word in words
    )

    negative_count = sum(
        word in NEGATIVE_WORDS
        for word in words
    )

    if positive_count > negative_count:
        sentiment = "positive"
        score = 0.85

    elif negative_count > positive_count:
        sentiment = "negative"
        score = 0.85

    else:
        sentiment = "neutral"
        score = 0.50

    topic = "general"

    for topic_name, topic_words in TOPICS.items():
        if any(word in topic_words for word in words):
            topic = topic_name
            break

    keywords = [
        word
        for word in words
        if len(word) >= 5
    ][:5]

    highlight = (
        sentiment != "neutral"
        and len(message.content) >= 40
    )

    return MessageAnalysis(
        sentiment=sentiment,
        sentiment_score=score,
        topic=topic,
        keywords=keywords,
        highlight=highlight,
    )