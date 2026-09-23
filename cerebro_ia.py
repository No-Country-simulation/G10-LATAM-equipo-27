import json
import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate

# ==========================================
# CEREBRO IA: MOTOR PRINCIPAL
# ==========================================

# 1. Carga segura de variables
load_dotenv()

# 2. Conexión al LLM de Groq
_modelo = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
llm = ChatGroq(model=_modelo, temperature=0.3)

# 3. Prompt Estricto (Scorecard)
template = """
ERES UN EVALUADOR ROBÓTICO ESTRICTO. TU ÚNICO TRABAJO ES FILTRAR MENSAJES DE DISCORD.

Mensaje original: "{texto}"
Canal de origen: {canal}

REGLAS INQUEBRANTABLES:
1. Si el mensaje es una pregunta corta (ej. "¿A qué hora?"), un saludo o un meme, su Relevancia es 20%.
2. Si el mensaje es un caso de éxito, testimonio o queja profunda, su Relevancia es 80% o más.
3. Si la Relevancia es MENOR A 70%, el 'Copy Generado' debe ser EXACTAMENTE "❌ DESCARTADO POR BAJA RELEVANCIA". (PROHIBIDO INVENTAR RESPUESTAS).

DEVUELVE EXACTAMENTE ESTAS 4 LÍNEAS, SIN TEXTO EXTRA:
Relevancia: [Tu porcentaje]%
Sentimiento: [Positivo/Negativo/Neutral]
Tema Principal: [Tema resumido]
Copy Generado: [El copy redactado o ❌ DESCARTADO POR BAJA RELEVANCIA]
"""

prompt = PromptTemplate(input_variables=["texto", "canal"], template=template)

# 4. EXPORTAMOS LA CADENA (Para que app.py la pueda usar)
cadena = prompt | llm

def procesar_comunidad():
    print("Iniciando el Motor de IA con Groq...\n")
    
    with open('mock_data.json', 'r', encoding='utf-8') as archivo:
        datos = json.load(archivo)
        
        for interaccion in datos['interacciones']:
            print(f"--- Analizando Mensaje ID: {interaccion['id']} de {interaccion['autor']} ---")
            respuesta = cadena.invoke(
                {"texto": interaccion["texto"], "canal": interaccion["canal"]}
            )
            print(respuesta.content)
            print("\n" + "="*50 + "\n")

if __name__ == "__main__":
    procesar_comunidad()