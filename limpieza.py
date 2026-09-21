def limpiar_texto(texto: str) -> str:
    # quito los espacios y saltos de línea del inicio y del final, y junto los espacios
    # o saltos repetidos en uno solo, para que "hola   mundo" y "hola mundo" queden igual.
    # no toqué los emojis a propósito: después le sirven a la IA para detectar el sentimiento
    return " ".join(texto.split())
