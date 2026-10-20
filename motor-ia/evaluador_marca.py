"""Evaluacion de borradores segun la guia de marca CloudEdTech."""

from typing import Literal

from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel, Field

from cerebro_ia import llm


class EvaluacionMarca(BaseModel):
    puntuacion: int = Field(ge=0, le=100)
    tono_y_voz: int = Field(ge=0, le=100)
    estructura_y_claridad: int = Field(ge=0, le=100)
    valores_de_marca: int = Field(ge=0, le=100)
    seguridad_y_credibilidad: int = Field(ge=0, le=100)
    fortalezas: list[str] = Field(default_factory=list)
    mejoras: list[str] = Field(default_factory=list)
    justificacion: str


plantilla = """
Eres un auditor de identidad de marca de CloudEdTech.
Evalua un BORRADOR, no un mensaje de la comunidad.

GUIA OFICIAL:
- Marca comunitaria, colaborativa y orientada a mentorias,
  aprendizaje practico, tecnologia y oportunidades laborales.
- Valores: accesibilidad, mentalidad de crecimiento,
  aprender haciendo, comunidad primero y relevancia profesional.
- Voz: didactica, motivadora, clara e inspiradora.
- Tutear al lector.
- Parrafos cortos, idealmente maximo tres lineas.
- Maximo dos emojis tecnicos por publicacion.
- Estructura: gancho, valor y llamada a la accion.
- Evitar tono corporativo frio, jerga innecesaria,
  paternalismo, clickbait, exageraciones, promesas
  irreales y criticas a otras plataformas.
- No inventar hechos, compromisos ni acciones de CloudEdTech.
- Respetar privacidad y significado del mensaje original.

PLATAFORMA: {plataforma}

MENSAJE ORIGINAL:
{origen}

BORRADOR:
{contenido}

Evalua de 0 a 100 estas cuatro dimensiones:
1. tono_y_voz: voz oficial, cercania y tuteo.
2. estructura_y_claridad: gancho, valor, CTA, brevedad
   y adecuacion a la plataforma.
3. valores_de_marca: coherencia con los pilares oficiales.
4. seguridad_y_credibilidad: fidelidad al origen, privacidad,
   ausencia de afirmaciones inventadas o enga?osas.

La puntuacion global es el promedio aritmetico
redondeado de las cuatro dimensiones.

No supongas hechos externos. Explica fortalezas y mejoras
concretas. Devuelve exclusivamente el esquema solicitado.
"""

modelo = llm.with_structured_output(EvaluacionMarca)

cadena = (
    PromptTemplate(
        input_variables=["plataforma", "origen", "contenido"],
        template=plantilla,
    )
    | modelo
)


def evaluar_alineacion_marca(
    contenido: str,
    plataforma: Literal["linkedin", "x", "discord"],
    origen: str = "",
) -> dict:
    if not contenido.strip():
        raise ValueError("El contenido no puede estar vacio.")

    resultado = cadena.invoke(
        {
            "contenido": contenido,
            "plataforma": plataforma,
            "origen": origen,
        }
    )

    datos = resultado.model_dump()
    dimensiones = (
        "tono_y_voz",
        "estructura_y_claridad",
        "valores_de_marca",
        "seguridad_y_credibilidad",
    )
    datos["puntuacion"] = round(
        sum(datos[clave] for clave in dimensiones) / len(dimensiones)
    )
    return datos
