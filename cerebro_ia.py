import os
import json
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate

# ==========================================
# CEREBRO IA: MOTOR PRINCIPAL
# ==========================================

# 1. Cargo mis variables de entorno de forma segura para no exponer mis API Keys
load_dotenv()

# 2. Establezco la conexión al LLM de Groq.
# Defino la temperatura en 0.3 para que el modelo sea creativo pero no invente cosas (alucinaciones).
# llama3-70b-8192 ya no existe en Groq; el reemplazo actual para cuentas free/dev es GPT-OSS 120B.
_modelo = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
llm = ChatGroq(model=_modelo, temperature=0.3)

# 3. Defino mi plantilla maestra (Prompt). 
# Aquí es donde le inyecto la inteligencia de negocio: Detección de Temas, Segmentación y Alineación de Marca.
template = """
ERES UN CURADOR DE CONTENIDO Y COMMUNITY MANAGER EXPERTO. TU TRABAJO ES FILTRAR MENSAJES DE DISCORD.

Mensaje original: "{texto}"
Canal de origen: {canal}

REGLAS INQUEBRANTABLES:
1. RELEVANCIA: Preguntas operativas ("¿a qué hora?"), saludos o quejas sin contexto valen 20%. Casos de éxito, proyectos terminados, testimonios o debates técnicos profundos valen 80% o más.
2. DETECCIÓN DE TEMAS: Extrae 2 o 3 hashtags exactos sobre de qué trata el mensaje (ej. #Python, #ÉxitoEstudiantil).
3. SEGMENTACIÓN DE AUDIENCIA: Define a qué público va dirigido este mensaje (ej. Principiantes, Desarrolladores Senior, Reclutadores, Comunidad General).
4. ALINEACIÓN DE MARCA: Somos una comunidad de educación tech. Nuestro tono es: Motivador, empático y profesional. Usamos emojis tech (🚀, 💻, 🧠).
5. REGLA DE DESCARTE: Si la Relevancia es MENOR A 70%, el 'Copy Generado' debe ser EXACTAMENTE "❌ DESCARTADO". (PROHIBIDO INVENTAR RESPUESTAS).

DEVUELVE EXACTAMENTE ESTAS 6 LÍNEAS, SIN TEXTO EXTRA:
Relevancia: [Tu porcentaje]%
Temas Clave: [Tus 2 o 3 hashtags]
Segmento: [Público objetivo]
Alineación: [Justifica en 1 línea cómo el copy cumple con la marca]
Copy Generado: [El copy redactado con el tono de la marca, o ❌ DESCARTADO]
"""

# Empaqueto mi prompt con las variables dinámicas que recibiré de la interfaz visual (app.py)
prompt = PromptTemplate(input_variables=["texto", "canal"], template=template)

# 4. Exporto mi cadena uniendo el Prompt y el Modelo. 
# Esto es lo que importará mi app.py para ejecutar el análisis masivo.
cadena = prompt | llm

def procesar_comunidad():
    # Función de prueba interna por si decido correr este archivo solo en la terminal sin levantar Streamlit
    print("Iniciando el Motor de IA con Groq...\n")
    
    with open('mock_data.json', 'r', encoding='utf-8') as archivo:
        datos = json.load(archivo)
        
        for interaccion in datos['interacciones']:
            print(f"--- Analizando Mensaje ID: {interaccion.get('id', 'N/A')} de {interaccion['autor']} ---")
            respuesta = cadena.invoke(
                {"texto": interaccion["texto"], "canal": interaccion["canal"]}
            )
            print(respuesta.content)
            print("\n" + "="*50 + "\n")

if __name__ == "__main__":
    procesar_comunidad()