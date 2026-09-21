import json
import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate

# ==========================================
# SCRIPT DE BACKEND PARA PRUEBAS RÁPIDAS EN TERMINAL
# ==========================================

# 1. Carga segura de la clave de Groq desde el entorno local.
load_dotenv()

# 2. Conexión al LLM de Groq. 
# Nota: La implementación priorizó Groq frente a Gemini debido a restricciones de 
# autenticación de la cuenta en Google Cloud, asegurando así un entorno funcional.
_modelo = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
llm = ChatGroq(model=_modelo, temperature=0.3)

# 3. Prompt Template base de la arquitectura para extracción de datos.
template = """
Eres un analista de comunidades digitales. Lee el siguiente mensaje extraído de Discord y realiza las siguientes tareas:
1. Determina el Sentimiento general (Positivo, Negativo o Neutral).
2. Extrae el Tema principal.
3. Redacta un breve 'copy' (texto para redes sociales o FAQ) basado en el mensaje, listo para ser publicado, incluyendo 2 hashtags relevantes.

Mensaje original: "{texto}"
Canal de origen: {canal}

Devuelve el resultado estrictamente en este formato:
Sentimiento: [Tu análisis]
Tema Principal: [Tu tema]
Copy Generado: [Tu copy]
"""

prompt = PromptTemplate(
    input_variables=["texto", "canal"],
    template=template
)

# 4. Construcción de la cadena de procesamiento.
cadena = prompt | llm

def procesar_comunidad():
    print("Iniciando el Motor de IA con Groq...\n")
    
    # 5. Carga de los datos simulados (Mock Data).
    with open('mock_data.json', 'r', encoding='utf-8') as archivo:
        datos = json.load(archivo)
        
        # 6. Procesamiento secuencial de las interacciones.
        for interaccion in datos['interacciones']:
            print(f"--- Analizando Mensaje ID: {interaccion['id']} de {interaccion['autor']} ---")
            
            # Ejecución del modelo e impresión de resultados en consola.
            respuesta = cadena.invoke(
                {"texto": interaccion["texto"], "canal": interaccion["canal"]}
            )
            print(respuesta.content)
            print("\n" + "="*50 + "\n")

if __name__ == "__main__":
    procesar_comunidad()