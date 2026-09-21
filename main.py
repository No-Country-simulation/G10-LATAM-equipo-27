from fastapi import FastAPI

from base_datos import crear_tabla, guardar_interaccion
from limpieza import calcular_hash, limpiar_texto
from modelos import SolicitudActividad

app = FastAPI(title="CommunityLab API")

# creo la tabla al arrancar el servidor (si ya existe no hace nada)
crear_tabla()


# Este es el endpoint: la "ventanilla" que recibe el paquete JSON que va a mandar n8n.
# Al declarar "solicitud: SolicitudActividad", FastAPI valida el paquete con Pydantic
# antes de entrar a la función; si algo está mal responde 422 y aquí ni se entra.
@app.post("/procesar-actividad")
def procesar_actividad(solicitud: SolicitudActividad):
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
        es_nueva = guardar_interaccion(
            solicitud.origen_comunidad,
            solicitud.periodo_referencia,
            interaccion.autor,
            interaccion.canal,
            interaccion.tipo,
            texto,
            hash_mensaje,
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
