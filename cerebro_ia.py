import os
import json
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel, Field

load_dotenv()
_modelo = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
llm = ChatGroq(model=_modelo, temperature=0.1)

class FormatoSalida(BaseModel):
    relevancia: int = Field(description="KPI Cuantitativo: Importancia y profundidad del mensaje (0-100)")
    sentimiento: str = Field(description="KPI Cualitativo: Clasifica el mensaje como Positivo, Negativo o Neutral")
    sentiment_score: float = Field(
    ge=0.0,
    le=1.0,
    description="Confianza del modelo en la clasificación del sentimiento, entre 0.0 y 1.0"
)
    temas_clave: str = Field(description="KPI Cualitativo: Lista de 2 o 3 hashtags sobre el mensaje")
    segmento: str = Field(
        description=(
            "KPI Cualitativo. Debe ser exactamente uno de estos valores: "
            "ESTUDIANTE, EGRESADO, BUSCA_EMPLEO, PROFESIONAL_TECH, "
            "DESARROLLADOR, USUARIO_COMUNIDAD u OTRO"
            )
)
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
3. CONFIANZA DEL SENTIMIENTO: Asigna un valor entre 0.0 y 1.0 que indique qué tan seguro estás de la clasificación del sentimiento.
   - 1.0 significa confianza máxima.
   - Valores cercanos a 0.5 indican ambigüedad.
   - Este valor NO representa la relevancia del mensaje.
4. TEMAS (Cualitativo): Extrae 2 o 3 hashtags exactos. (Si es basura, escribe "N/A").
5. SEGMENTO (Cualitativo): Clasifica el mensaje usando EXACTAMENTE UNA de estas categorías:
   - ESTUDIANTE: personas en proceso de formación o aprendizaje.
   - EGRESADO: personas que ya terminaron sus estudios.
   - BUSCA_EMPLEO: personas buscando trabajo, vacantes u oportunidades laborales.
   - PROFESIONAL_TECH: profesionales del sector tecnológico.
   - DESARROLLADOR: mensajes específicamente relacionados con programación, desarrollo de software, APIs, bots o código.
   - USUARIO_COMUNIDAD: usuarios generales de CloudEdTech o miembros de la comunidad que no encajen mejor en otra categoría.
   - OTRO: cuando no sea posible determinar una categoría anterior.
   Devuelve ÚNICAMENTE uno de esos valores. No inventes nuevas categorías.
6. RAZONAMIENTO: Explica en una sola frase por qué le diste ese puntaje de relevancia.

¡CRÍTICO!: NUNCA respondas con texto libre. DEBES DEVOLVER EL OBJETO JSON ESTRUCTURADO.
"""

prompt_filtro = PromptTemplate(input_variables=["texto", "canal"], template=template_filtro)
cadena = prompt_filtro | llm_estructurado