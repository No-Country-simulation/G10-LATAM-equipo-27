from typing import List, Optional
from pydantic import BaseModel, Field


# Aquí defino la "forma" exacta que debe tener cada mensaje que llegue.
# Si falta un campo o viene vacío, FastAPI rechaza el paquete solo con un error 422.
class Interaccion(BaseModel):
    autor: str = Field(min_length=1)
    canal: str = Field(min_length=1)
    # dejé "tipo" opcional porque Discord no lo trae y lo va a decidir la IA más adelante
    tipo: Optional[str] = None
    texto: str = Field(min_length=1)


# Esta es la forma del paquete completo, igual al JSON de entrada de las instrucciones
class SolicitudActividad(BaseModel):
    origen_comunidad: str = Field(min_length=1)
    periodo_referencia: str = Field(min_length=1)
    # exijo al menos una interacción para no procesar paquetes vacíos
    interacciones: List[Interaccion] = Field(min_length=1)
