"""Validacion local de identidad mediante SHA-256.

No establece conexiones externas ni modifica datos.
"""

import hmac

from limpieza import calcular_hash, limpiar_texto


def validar_integridad_hash(interaccion: dict, identidad: dict) -> bool:
    """Comprueba que el hash almacenado corresponda al mensaje local."""
    if not isinstance(interaccion, dict):
        return False

    if not isinstance(identidad, dict):
        return False

    if interaccion.get("id") != identidad.get("id"):
        return False

    if type(interaccion.get("id")) is not int:
        return False

    if interaccion["id"] <= 0:
        return False

    origen = interaccion.get("origen_comunidad")
    canal = interaccion.get("canal")
    autor = interaccion.get("autor")
    texto = interaccion.get("texto")
    hash_guardado = identidad.get("hash")

    if not all(
        isinstance(valor, str)
        for valor in (origen, canal, autor, texto, hash_guardado)
    ):
        return False

    if identidad.get("origen_comunidad") != origen:
        return False

    if identidad.get("canal") != canal:
        return False

    if len(hash_guardado) != 64:
        return False

    try:
        int(hash_guardado, 16)
    except ValueError:
        return False

    texto_limpio = limpiar_texto(texto)
    hash_calculado = calcular_hash(
        origen, canal, autor, texto_limpio
    )

    return hmac.compare_digest(
        hash_calculado,
        hash_guardado.lower()
    )
