import os
import json
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
# NUEVA IMPORTACIÓN: Usamos Pydantic nativo de Python para forzar el JSON, esquivando el bug de LangChain
from pydantic import BaseModel, Field

# ==========================================
# CEREBRO IA: MOTOR PRINCIPAL
# ==========================================

load_dotenv()

_modelo = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
llm = ChatGroq(model=_modelo, temperature=0.3)

# ==========================================
# CONTRATO DE DATOS (ARQUITECTURA PYDANTIC)
# ==========================================
# Creamos una clase estricta. El modelo de Groq usará "Function Calling" interno 
# para llenar exactamente estos campos. Cero errores de formato.
class FormatoSalida(BaseModel):
    relevancia: int = Field(description="Porcentaje de relevancia del 0 al 100")
    temas_clave: str = Field(description="Lista de 2 o 3 hashtags sobre el mensaje")
    segmento: str = Field(description="Público objetivo del mensaje")
    alineacion: str = Field(description="Justificación de cómo el copy cumple con la marca")
    copy_linkedin: str = Field(description="Post para LinkedIn. Escribe 'DESCARTADO' si relevancia < 70")
    copy_twitter: str = Field(description="Hilo corto para X (Twitter). Escribe 'DESCARTADO' si relevancia < 70")
    copy_discord: str = Field(description="Resumen para Discord. Escribe 'DESCARTADO' si relevancia < 70")

# Activamos el modo "Estructurado" nativo de LangChain acoplado a Pydantic
llm_estructurado = llm.with_structured_output(FormatoSalida)

# ==========================================
# PLANTILLA MAESTRA (PROMPT)
# ==========================================
template = """
ERES UN CURADOR DE CONTENIDO Y COMMUNITY MANAGER EXPERTO. TU TRABAJO ES FILTRAR MENSAJES DE DISCORD.

Mensaje original: "{texto}"
Canal de origen: {canal}

REGLAS INQUEBRANTABLES:
1. RELEVANCIA: Preguntas operativas, saludos o quejas sin contexto valen 20. Casos de éxito, testimonios o debates profundos valen 80 o más.
2. DETECCIÓN DE TEMAS: Extrae 2 o 3 hashtags exactos sobre de qué trata el mensaje.
3. SEGMENTACIÓN DE AUDIENCIA: Define a qué público va dirigido este mensaje.
4. ALINEACIÓN DE MARCA: Somos una comunidad de educación tech. Nuestro tono es: Motivador, empático y profesional. Usamos emojis tech.
5. REGLA DE DESCARTE: Si la Relevancia es MENOR A 70, los copys generados DEBEN SER EXACTAMENTE la palabra "DESCARTADO".
"""

prompt = PromptTemplate(input_variables=["texto", "canal"], template=template)

# Unimos el prompt con nuestro modelo blindado
cadena = prompt | llm_estructurado

def procesar_comunidad():
    print("Iniciando el Motor de IA con Arquitectura Pydantic JSON...\n")
    with open('mock_data.json', 'r', encoding='utf-8') as archivo:
        datos = json.load(archivo)
        
        interaccion = datos['interacciones'][0]
        print(f"--- Analizando Mensaje ID: {interaccion.get('id', 'N/A')} de {interaccion['autor']} ---")
        
        # Al invocar la cadena, la respuesta ya no es texto libre, ¡es un objeto Pydantic perfecto!
        respuesta = cadena.invoke({"texto": interaccion["texto"], "canal": interaccion["canal"]})
        
        print("\n--- RESPUESTA JSON PERFECTA ---")
        # model_dump() convierte el objeto en un diccionario de Python estándar
        print(json.dumps(respuesta.model_dump(), indent=4, ensure_ascii=False))

if __name__ == "__main__":
    procesar_comunidad()