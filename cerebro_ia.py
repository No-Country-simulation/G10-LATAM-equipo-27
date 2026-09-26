import os
import json
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel, Field

load_dotenv()
_modelo = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
llm = ChatGroq(model=_modelo, temperature=0.1)

class FormatoSalida(BaseModel):
    relevancia: int = Field(description="KPI Cuantitativo: Porcentaje de relevancia del 0 al 100")
    temas_clave: str = Field(description="KPI Cualitativo: Lista de 2 o 3 hashtags sobre el mensaje")
    segmento: str = Field(description="KPI Cualitativo: Público objetivo del mensaje")
    razonamiento: str = Field(description="Justificación breve de por qué se asignó ese score")

llm_estructurado = llm.with_structured_output(FormatoSalida)

template_filtro = """
ERES UN ANALISTA DE DATOS EXPERTO EN COMUNIDADES TECH. TU ÚNICO TRABAJO ES EVALUAR MENSAJES DE DISCORD.

Mensaje original: "{texto}"
Canal de origen: {canal}

REGLAS DE EVALUACIÓN (KPIs):
1. RELEVANCIA (Cuantitativo): Preguntas operativas, saludos o quejas valen 20. Casos de éxito, vacantes o debates profundos valen 80 o más.
2. TEMAS (Cualitativo): Extrae 2 o 3 hashtags exactos. (Si es irrelevante, escribe "N/A").
3. SEGMENTO (Cualitativo): Define a qué público va dirigido. (Si es irrelevante, escribe "N/A").
4. RAZONAMIENTO: Explica en una sola frase por qué le diste ese puntaje.

¡CRÍTICO!: NUNCA respondas con texto libre. DEBES DEVOLVER EL OBJETO JSON ESTRUCTURADO.
"""

prompt_filtro = PromptTemplate(input_variables=["texto", "canal"], template=template_filtro)
cadena = prompt_filtro | llm_estructurado