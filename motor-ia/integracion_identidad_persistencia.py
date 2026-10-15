"""Integracion controlada de identidad y preparacion de resultados."""

from base_datos import obtener_interaccion, obtener_identidad_interaccion
from validador_hash_local import validar_integridad_hash
from puente_identidad import resolver_identidad_supabase
from persistencia_supabase_segura import preparar_registro_supabase


def preparar_desde_identidad_local(
    id_local: int,
    datos_ia: dict,
    decision: str,
    *,
    permitir_conexion: bool = False,
) -> dict:
    """Prepara resultados solo con identidad y datos locales validados."""
    if type(id_local) is not int or id_local <= 0:
        raise ValueError("El ID local debe ser positivo.")

    if not isinstance(datos_ia, dict):
        raise TypeError("Los datos de IA deben ser un diccionario.")

    for campo in ("id_mensaje", "id_supabase", "identidad_validada"):
        if campo in datos_ia:
            raise ValueError(f"No se acepta el campo externo: {campo}")

    interaccion = obtener_interaccion(id_local)
    identidad_local = obtener_identidad_interaccion(id_local)

    if interaccion is None or identidad_local is None:
        raise ValueError("No se encontro la interaccion local.")

    if not validar_integridad_hash(interaccion, identidad_local):
        raise ValueError("El hash local no coincide.")

    texto = interaccion.get("texto")
    autor = interaccion.get("autor")
    canal = interaccion.get("canal")

    if not isinstance(texto, str) or not texto.strip():
        raise ValueError("Texto local invalido.")

    if not isinstance(autor, str) or not autor:
        raise ValueError("Autor local invalido.")

    if not isinstance(canal, str) or not canal:
        raise ValueError("Canal local invalido.")

    for campo, valor in (
        ("texto_original", texto),
        ("autor", autor),
        ("canal_origen", canal),
    ):
        if campo in datos_ia and datos_ia[campo] != valor:
            raise ValueError(f"El campo {campo} no coincide con SQLite.")

    identidad = resolver_identidad_supabase(
        id_local,
        permitir_conexion=permitir_conexion,
    )

    if identidad.get("estado") != "correspondencia_encontrada":
        raise ValueError("No existe identidad Supabase confirmada.")

    registro = dict(datos_ia)
    registro["id_supabase"] = identidad["id_supabase"]
    registro["identidad_validada"] = True
    registro["texto_original"] = texto
    registro["autor"] = autor
    registro["canal_origen"] = canal
    registro["comunidad"] = interaccion.get("origen_comunidad")
    registro["semana"] = interaccion.get("periodo_referencia")
    registro["fecha_envio"] = interaccion.get("enviado_en")
    registro["fecha_extraccion"] = interaccion.get("creado_en")

    return preparar_registro_supabase(registro, decision)
