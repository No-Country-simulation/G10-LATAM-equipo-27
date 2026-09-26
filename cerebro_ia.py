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
llm = ChatGroq(model=_modelo, temperature=0.3)

class FormatoSalida(BaseModel):
    relevancia: int = Field(description="Porcentaje de relevancia del 0 al 100")
    temas_clave: str = Field(description="Lista de 2 o 3 hashtags sobre el mensaje")
    segmento: str = Field(description="Público objetivo del mensaje")
    alineacion: str = Field(description="Justificación de cómo el copy cumple con la marca")
    copy_linkedin: str = Field(description="Post para LinkedIn. Escribe 'DESCARTADO' si relevancia < 70")
    copy_twitter: str = Field(description="Hilo corto para X (Twitter). Escribe 'DESCARTADO' si relevancia < 70")
    copy_discord: str = Field(description="Resumen para Discord. Escribe 'DESCARTADO' si relevancia < 70")

llm_estructurado = llm.with_structured_output(FormatoSalida)

# ==========================================
# 1. CADENA DE TRIAJE (El filtro estricto principal)
# ==========================================
template_filtro = """
ERES UN CURADOR DE CONTENIDO Y COMMUNITY MANAGER EXPERTO. TU TRABAJO ES FILTRAR MENSAJES DE DISCORD.

Mensaje original: "{texto}"
Canal de origen: {canal}

REGLAS INQUEBRANTABLES:
1. RELEVANCIA: Preguntas operativas, saludos o quejas valen 20. Casos de éxito o debates valen 80 o más.
2. DETECCIÓN DE TEMAS: Extrae 2 o 3 hashtags exactos. (Si es irrelevante, escribe "N/A").
3. SEGMENTACIÓN DE AUDIENCIA: Define a qué público va dirigido. (Si es irrelevante, escribe "N/A").
4. ALINEACIÓN DE MARCA: Tono motivador, empático y profesional. Usamos emojis tech. (Si es irrelevante, explica por qué).
5. REGLA DE DESCARTE: Si la Relevancia es MENOR A 70, debes llenar los campos 'copy_linkedin', 'copy_twitter' y 'copy_discord' EXACTAMENTE con la palabra "DESCARTADO".

¡CRÍTICO!: NUNCA respondas con texto libre.
"""
prompt_filtro = PromptTemplate(input_variables=["texto", "canal"], template=template_filtro)
cadena = prompt_filtro | llm_estructurado

# ==========================================
# 2. CADENA DE RESCATE (Generador Creativo forzado)
# ==========================================
# Esta cadena asume que el humano ya aprobó el mensaje, así que omite la regla de descarte.
template_rescate = """
ERES UN COPYWRITER EXPERTO. UN HUMANO HA APROBADO MANUALMENTE ESTE MENSAJE PARA SER PUBLICADO.
TU ÚNICO TRABAJO ES CONVERTIRLO EN PUBLICACIONES ATRACTIVAS, SIN IMPORTAR SI EL MENSAJE ORIGINAL ES CORTO O SIMPLE.

Mensaje original: "{texto}"
Canal de origen: {canal}

REGLAS DE RESCATE:
1. RELEVANCIA: Asígnale 100 automáticamente (Aprobación manual).
2. DETECCIÓN DE TEMAS: Inventa 2 o 3 hashtags relevantes al contexto.
3. SEGMENTACIÓN DE AUDIENCIA: Asume que va dirigido a nuestra Comunidad Tech.
4. ALINEACIÓN DE MARCA: Haz que suene increíblemente profesional y motivador. Usa emojis tech.
5. COPYS: Expande el mensaje original de forma creativa. Escribe el post completo para LinkedIn, el hilo de Twitter y el resumen de Discord. 
¡PROHIBIDO USAR LA PALABRA "DESCARTADO"!
"""
prompt_rescate = PromptTemplate(input_variables=["texto", "canal"], template=template_rescate)
# Exportamos esta segunda IA para que app.py la use cuando presionemos el botón
cadena_rescate = prompt_rescate | llm_estructurado