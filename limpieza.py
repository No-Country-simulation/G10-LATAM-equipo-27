import hashlib


def limpiar_texto(texto: str) -> str:
    # quito los espacios y saltos de línea del inicio y del final, y junto los espacios
    # o saltos repetidos en uno solo, para que "hola   mundo" y "hola mundo" queden igual.
    # no toqué los emojis a propósito: después le sirven a la IA para detectar el sentimiento
    return " ".join(texto.split())


def calcular_hash(origen: str, canal: str, autor: str, texto_limpio: str) -> str:
    # con esto identifico si un mensaje ya llegó antes (evitar repetidos).
    # no incluí el periodo a propósito: si n8n vuelve a mandar el mismo mensaje
    # en otra corrida, debe contar como repetido aunque cambie la semana.
    # pasé todo a minúsculas para que "Hola" y "hola" den el mismo hash
    cadena = f"{origen}|{canal}|{autor}|{texto_limpio}".lower()
    return hashlib.sha256(cadena.encode("utf-8")).hexdigest()
