from fastapi import FastAPI

from limpieza import limpiar_texto
from modelos import SolicitudActividad

app = FastAPI(title="CommunityLab API")


# Este es el endpoint: la "ventanilla" que recibe el paquete JSON que va a mandar n8n.
# Al declarar "solicitud: SolicitudActividad", FastAPI valida el paquete con Pydantic
# antes de entrar a la función; si algo está mal responde 422 y aquí ni se entra.
@app.post("/procesar-actividad")
def procesar_actividad(solicitud: SolicitudActividad):
    textos_limpios = []
    vacias = 0

    for interaccion in solicitud.interacciones:
        texto = limpiar_texto(interaccion.texto)

        # un texto de solo espacios pasa la validación de Pydantic (su longitud es mayor a 0)
        # pero queda vacío al limpiarlo, así que lo omito
        if not texto:
            vacias += 1
            continue

        textos_limpios.append(texto)

    return {
        "status": "exito",
        "periodo_referencia": solicitud.periodo_referencia,
        "total_recibidas": len(solicitud.interacciones),
        "vacias_omitidas": vacias,
        # esta lista es solo para ver el resultado de la limpieza; la voy a quitar después
        "textos_limpios": textos_limpios,
    }
