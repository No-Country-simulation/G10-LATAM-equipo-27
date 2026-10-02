from typing import Any


# Almacenamiento temporal para desarrollo local.
# Se perderá al reiniciar el backend.
messages_store: list[dict[str, Any]] = []


def add_message(message: dict[str, Any]) -> None:
    messages_store.append(message)


def get_messages() -> list[dict[str, Any]]:
    return list(reversed(messages_store))


def get_message_count() -> int:
    return len(messages_store)