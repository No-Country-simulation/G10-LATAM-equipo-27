import os
import json
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel, Field

load_dotenv()

# 2. Leemos las variables nuevas de Google
_modelo = os.getenv("GOOGLE_MODEL", "gemini-3.5-flash-lite")

# 3. Inicializamos el LLM con la clase correcta
llm = ChatGoogleGenerativeAI(
    model=_modelo, 
    temperature=0.1,
    google_api_key=os.environ.get("GOOGLE_API_KEY")
)

class FormatoSalida(BaseModel):
    relevancia: int = Field(description="KPI Cuantitativo: Importancia y profundidad del mensaje (0-100)")
    sentimiento: str = Field(description="KPI Cualitativo: Clasifica el mensaje como Positivo, Negativo o Neutral")
    temas_clave: str = Field(description="KPI Cualitativo: Lista de 2 o 3 hashtags sobre el mensaje")
    segmento: str = Field(description="KPI Cualitativo: Público objetivo del mensaje")
    razonamiento: str = Field(description="Justificación breve de por qué se asignó ese score")

llm_estructurado = llm.with_structured_output(FormatoSalida)

template_filtro = """
ERES UN ANALISTA DE DATOS EXPERTO EN COMUNIDADES TECH. TU ÚNICO TRABAJO ES EVALUAR MENSAJES DE DISCORD.

Mensaje original: "{texto}"
Canal de origen: {canal}

REGLAS DE EVALUACIÓN (KPIs):
1. RELEVANCIA (Cuantitativo): Mide el VALOR y PROFUNDIDAD del mensaje del 0 al 100, INDEPENDIENTEMENTE de si es bueno o malo.
   - Mensajes vacíos, saludos o quejas sin fundamentos ("hola", "esto no sirve") valen 20 o menos.
   - Debates profundos, quejas muy bien argumentadas, feedback constructivo o casos de éxito valen 80 o más.
2. SENTIMIENTO (Cualitativo): Define si el tono del usuario es Positivo, Negativo o Neutral.
3. TEMAS (Cualitativo): Extrae 2 o 3 hashtags exactos. (Si es basura, escribe "N/A").
4. SEGMENTO (Cualitativo): Define a qué público va dirigido. (Si es basura, escribe "N/A").
5. RAZONAMIENTO: Explica en una sola frase por qué le diste ese puntaje de relevancia.

¡CRÍTICO!: NUNCA respondas con texto libre. DEBES DEVOLVER EL OBJETO JSON ESTRUCTURADO.
"""

prompt_filtro = PromptTemplate(input_variables=["texto", "canal"], template=template_filtro)
cadena = prompt_filtro | llm_estructurado
