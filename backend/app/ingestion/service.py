from app.analytics_mock.service import analyze_message
from app.discord_connector.schemas import DiscordMessage
from app.ingestion.store import add_message


async def ingest_discord_message(
    message: DiscordMessage,
) -> None:

    analysis = analyze_message(message)

    record = {
        "message": message.model_dump(mode="json"),
        "analysis": analysis.model_dump(),
    }

    add_message(record)

    print("\n" + "=" * 60)
    print("[INGESTION]")
    print("✓ Mensaje recibido y procesado")
    print(f"✓ Canal: #{message.channel_name}")
    print(f"✓ Sentimiento: {analysis.sentiment}")
    print(f"✓ Tema: {analysis.topic}")
    print("✓ Guardado temporalmente")
    print("=" * 60)