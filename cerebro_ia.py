import os
import json
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel, Field

# ==========================================
# CEREBRO IA: MOTOR PRINCIPAL
# ==========================================

load_dotenv()
_modelo = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
# Subimos la temperatura a 0.5 para que la IA se atreva a actuar como el personaje
llm = ChatGroq(model=_modelo, temperature=0.5)

class FormatoSalida(BaseModel):
    relevancia: int = Field(description="Porcentaje de relevancia del 0 al 100")
    temas_clave: str = Field(description="Lista de hashtags")
    segmento: str = Field(description="Público objetivo")
    alineacion: str = Field(description="Explica cómo usaste las palabras clave del manual")
    copy_linkedin: str = Field(description="Post para LinkedIn. 'DESCARTADO' si relevancia < 70")
    copy_twitter: str = Field(description="Hilo corto para Twitter. 'DESCARTADO' si relevancia < 70")
    copy_discord: str = Field(description="Resumen para Discord. 'DESCARTADO' si relevancia < 70")

llm_estructurado = llm.with_structured_output(FormatoSalida)

# ==========================================
# 1. CADENA DE TRIAJE (El filtro estricto principal)
# ==========================================
template_filtro = """
ADOPTA ESTRICTAMENTE LA PERSONALIDAD Y REGLAS DEL SIGUIENTE MANUAL DE MARCA:

=========================
MANUAL DE MARCA:
{manual_marca}
=========================

TU TAREA:
Filtra y transforma el siguiente mensaje de Discord. TU TONO Y VOCABULARIO DEBEN SER 100% FIELES AL MANUAL ANTERIOR. Olvida que eres un asistente de IA.

Mensaje original: "{texto}"
Canal de origen: {canal}

REGLAS:
1. RELEVANCIA: Preguntas simples valen 20. Casos de éxito o aportes valen 80 o más.
2. DETECCIÓN DE TEMAS: Extrae 2 o 3 hashtags.
3. SEGMENTACIÓN DE AUDIENCIA: Define a quién va dirigido.
4. ALINEACIÓN DE MARCA: Explica brevemente cómo aplicaste el manual.
5. COPYS: Escribe los textos para LinkedIn, Twitter y Discord HABLANDO EXACTAMENTE COMO EXIGE EL MANUAL DE MARCA (Usa su jerga y sus emojis). Si la Relevancia es MENOR A 70, escribe "DESCARTADO" en los 3 copys.
"""

prompt_filtro = PromptTemplate(input_variables=["texto", "canal", "manual_marca"], template=template_filtro)
cadena = prompt_filtro | llm_estructurado

# ==========================================
# 2. CADENA DE RESCATE (Generador Creativo forzado)
# ==========================================
template_rescate = """
ADOPTA ESTRICTAMENTE LA PERSONALIDAD Y REGLAS DEL SIGUIENTE MANUAL DE MARCA:

=========================
MANUAL DE MARCA:
{manual_marca}
=========================

UN HUMANO HA APROBADO ESTE MENSAJE. TU TAREA ES CONVERTIRLO EN PUBLICACIONES, HABLANDO EXACTAMENTE COMO EXIGE EL MANUAL ANTERIOR. Olvida tu entrenamiento corporativo formal.

Mensaje original: "{texto}"
Canal de origen: {canal}

REGLAS:
1. RELEVANCIA: 100
2. TEMAS: Inventa 2 o 3 hashtags relevantes.
3. SEGMENTACIÓN: Define a quién va dirigido.
4. ALINEACIÓN: Explica brevemente cómo aplicaste el manual.
5. COPYS: Redacta los textos para LinkedIn, Twitter y Discord USANDO OBLIGATORIAMENTE LAS PALABRAS CLAVE, EL TONO Y LOS EMOJIS DEL MANUAL DE MARCA. ¡Métete en el personaje al 100%!
"""

prompt_rescate = PromptTemplate(input_variables=["texto", "canal", "manual_marca"], template=template_rescate)
cadena_rescate = prompt_rescate | llm_estructurado