from fastapi import FastAPI

from modelos import SolicitudActividad

app = FastAPI(title="CommunityLab API")


# Este es el endpoint: la "ventanilla" que recibe el paquete JSON que va a mandar n8n.
# Al declarar "solicitud: SolicitudActividad", FastAPI valida el paquete con Pydantic
# antes de entrar a la función; si algo está mal responde 422 y aquí ni se entra.
@app.post("/procesar-actividad")
def procesar_actividad(solicitud: SolicitudActividad):
    # por ahora solo confirmo que el paquete llegó completo y cuento las interacciones
    return {
        "status": "exito",
        "periodo_referencia": solicitud.periodo_referencia,
        "total_recibidas": len(solicitud.interacciones),
    }
