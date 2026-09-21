import streamlit as st
import json
import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate

# ==========================================
# 1. CONFIGURACIÓN DE LA INTERFAZ VISUAL
# ==========================================
# Despliega una página web local usando Streamlit para que cualquier 
# miembro del equipo pueda probar la IA de forma visual, sin usar la terminal.
st.set_page_config(page_title="Panel de Curaduría", page_icon="🤖", layout="centered")
st.title("🤖 Panel de Curaduría IA - Equipo 27")
st.markdown("Revisa los mensajes simulados de Discord, analiza el sentimiento y genera respuestas automáticas.")

# ==========================================
# 2. CONEXIÓN CON EL MOTOR DE IA (GROQ)
# ==========================================
# Carga las variables de entorno para proteger la API Key (el archivo .env no se sube a GitHub).
load_dotenv()

# Instancia el modelo de Groq. Se optó por esta alternativa para esquivar 
# los bloqueos de tokens de cuentas institucionales y garantizar velocidad en las pruebas.
_modelo = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
# Se configura temperature=0.3 para obtener respuestas creativas pero sin perder precisión en el análisis.
llm = ChatGroq(model=_modelo, temperature=0.3)

# Instrucciones estrictas (Prompt) para perfilar a la IA como analista de nuestra comunidad.
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
prompt = PromptTemplate(input_variables=["texto", "canal"], template=template)

# Se integra el prompt con el modelo de lenguaje mediante LangChain.
cadena = prompt | llm

# ==========================================
# 3. LECTURA DE DATOS Y PANEL DE CURADURÍA
# ==========================================
st.subheader("📥 Bandeja de Entrada (Mock Data)")

# Lectura del JSON que simula la estructura de datos que entregará n8n en el flujo final.
with open('mock_data.json', 'r', encoding='utf-8') as archivo:
    datos = json.load(archivo)

    # Itera sobre cada mensaje simulado para generar una tarjeta expandible en la interfaz.
    for interaccion in datos['interacciones']:
        with st.expander(f"Mensaje de {interaccion['autor']} - Canal: #{interaccion['canal']}"):
            st.write(f"**Texto Original:** {interaccion['texto']}")
            
            # Botón interactivo: Ejecuta la petición a la API solo cuando el usuario lo solicita.
            if st.button("🪄 Analizar y Generar Copy", key=interaccion['id']):
                with st.spinner("El motor de IA está procesando..."):
                    
                    # Inyección de las variables al motor de IA.
                    respuesta = cadena.invoke(
                        {"texto": interaccion["texto"], "canal": interaccion["canal"]}
                    )
                    st.success("¡Análisis completado!")
                    
                    # Despliega el resultado en un área de texto editable para permitir la curaduría humana.
                    st.text_area("Resultado de la IA (Listo para revisión/edición):", respuesta.content, height=180)