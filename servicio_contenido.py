from typing import Literal

from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel, Field

from cerebro_ia import llm


class ContenidoGenerado(BaseModel):
    formato: Literal["linkedin", "newsletter"]
    titulo: str = Field(description="Título breve y atractivo del contenido")
    contenido: str = Field(description="Contenido final listo para revisión humana")
    llamada_accion: str = Field(description="Llamada a la acción apropiada")
    hashtags: list[str] = Field(
        default_factory=list,
        description="Hashtags relevantes. Vacío si el formato no los necesita",
    )


llm_contenido = llm.with_structured_output(ContenidoGenerado)


template_contenido = """
ERES EL COPYWRITER DE CLOUDEDTECH.

Tu trabajo es transformar una interacción REAL de una comunidad de Discord
en una pieza de contenido de marketing para revisión humana.

INTERACCIÓN ORIGINAL:
"{texto}"

CANAL:
{canal}

FORMATO SOLICITADO:
{formato}

TONO:
{tono}

REGLAS:
1. Conserva el significado de la interacción original.
2. NO inventes estadísticas, testimonios, nombres, empresas, eventos ni hechos.
3. NO presentes como cierta información que no aparezca en la interacción.
4. No incluyas datos privados ni información sensible del autor.
5. El resultado siempre debe quedar pendiente de revisión humana.
6. Escribe en español claro y natural.
7. Evita exageraciones y afirmaciones engañosas.
8. Está PROHIBIDO afirmar que CloudEdTech ya está realizando una acción,
   mejora, investigación o desarrollo si eso no aparece explícitamente
   en la interacción original.
9. Puedes convertir una sugerencia del usuario en una reflexión o invitación,
   pero nunca en una acción ya ejecutada por CloudEdTech.
10. Si falta información para respaldar una afirmación, omítela.

SI EL FORMATO ES "linkedin":
- Genera una publicación profesional y atractiva.
- Usa párrafos breves.
- Incluye una llamada a la acción.
- Incluye entre 3 y 5 hashtags relevantes.

SI EL FORMATO ES "newsletter":
- Genera un título atractivo.
- Desarrolla una introducción y un cuerpo informativo.
- Incluye una llamada a la acción.
- Los hashtags pueden quedar vacíos.

Devuelve exclusivamente la salida estructurada solicitada.
"""


prompt_contenido = PromptTemplate(
    input_variables=["texto", "canal", "formato", "tono"],
    template=template_contenido,
)

cadena_contenido = prompt_contenido | llm_contenido


def generar_contenido(
    texto: str,
    canal: str,
    formato: Literal["linkedin", "newsletter"],
    tono: str = "profesional",
) -> dict:
    if not texto.strip():
        raise ValueError("El texto de origen no puede estar vacío.")

    respuesta = cadena_contenido.invoke(
        {
            "texto": texto,
            "canal": canal,
            "formato": formato,
            "tono": tono,
        }
    )

    return respuesta.model_dump()