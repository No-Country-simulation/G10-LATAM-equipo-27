"""
Esto reemplaza lo que hacía main.py con FastAPI. En vez de una ventanilla que espera
peticiones por internet, es una función normal de Python: se le pasa el paquete
(un diccionario) y hace exactamente el mismo trabajo de antes, en el mismo orden:
validar, limpiar, calcular el hash, guardar y contar.
"""
from pydantic import ValidationError

from base_datos import crear_tabla, guardar_interaccion
from limpieza import calcular_hash, limpiar_texto
from modelos import SolicitudActividad
from periodos import periodo_de


def procesar_actividad(paquete: dict) -> dict:
    """
    Recibe un diccionario con la forma del JSON del proyecto (origen_comunidad,
    periodo_referencia, interacciones) y hace lo mismo que hacía el endpoint
    POST /procesar-actividad: valida, limpia, evita repetidos y guarda.

    Regresa un diccionario con el resumen, igual al que devolvía FastAPI. Si el
    paquete no tiene la forma correcta, regresa status "error" en vez de lanzar
    una excepción, para que el notebook de Colab pueda seguir corriendo aunque
    un lote venga mal.
    """
    # esto es lo que antes hacía FastAPI solo, al declarar "solicitud: SolicitudActividad"
    # en la función del endpoint; aquí lo hago yo a mano, con un try/except
    try:
        solicitud = SolicitudActividad(**paquete)
    except ValidationError as error:
        return {
            "status": "error",
            "detalle": error.errors(),
        }

    nuevas = 0
    repetidas = 0
    vacias = 0

    for interaccion in solicitud.interacciones:
        texto = limpiar_texto(interaccion.texto)

        # un texto de solo espacios pasa la validación de Pydantic (su longitud es mayor a 0)
        # pero queda vacío al limpiarlo, así que lo omito
        if not texto:
            vacias += 1
            continue

        hash_mensaje = calcular_hash(
            solicitud.origen_comunidad, interaccion.canal, interaccion.autor, texto
        )
        # la semana de cada mensaje sale de su propia fecha de envío, no de la del lote: así un
        # mensaje del 20 de septiembre dice Semana_01 aunque se guarde en la misma corrida que
        # uno del 1 de octubre. Si el mensaje no trae fecha, uso la semana del lote
        periodo = periodo_de(interaccion.enviado_en, solicitud.periodo_referencia)
        es_nueva = guardar_interaccion(
            solicitud.origen_comunidad,
            periodo,
            interaccion.autor,
            interaccion.canal,
            interaccion.tipo,
            texto,
            hash_mensaje,
            interaccion.enviado_en,
        )
        if es_nueva:
            nuevas += 1
        else:
            repetidas += 1

    return {
        "status": "exito",
        "periodo_referencia": solicitud.periodo_referencia,
        "total_recibidas": len(solicitud.interacciones),
        "guardadas_nuevas": nuevas,
        "repetidas_omitidas": repetidas,
        "vacias_omitidas": vacias,
    }
