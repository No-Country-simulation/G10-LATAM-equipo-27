import streamlit as st
import json

# ==========================================
# IMPORTAMOS LA INTELIGENCIA DE TU OTRO ARCHIVO
# ==========================================
from cerebro_ia import cadena 

# 1. CONFIGURACIÓN DE LA INTERFAZ VISUAL
st.set_page_config(page_title="Panel de Curaduría", page_icon="🤖", layout="centered")
st.title("🤖 Panel de Curaduría IA - Equipo 27")
st.markdown("Revisa los mensajes de Discord, analiza su relevancia y aprueba el copy generado.")

# 2. LECTURA DE DATOS Y PANEL
st.subheader("📥 Bandeja de Entrada (Mock Data)")

with open('mock_data.json', 'r', encoding='utf-8') as archivo:
    datos = json.load(archivo)

    for interaccion in datos['interacciones']:
        with st.expander(f"Mensaje de {interaccion['autor']} - Canal: #{interaccion['canal']}"):
            st.write(f"**Texto Original:** {interaccion['texto']}")
            
            if st.button("🪄 Analizar y Generar Copy", key=interaccion['id']):
                with st.spinner("El cerebro de IA está evaluando la relevancia..."):
                    
                    # Llamamos a la 'cadena' que importamos desde cerebro_ia.py
                    respuesta = cadena.invoke(
                        {"texto": interaccion["texto"], "canal": interaccion["canal"]}
                    )
                    st.success("¡Análisis completado!")
                    
                    st.text_area("Resultado de la IA (Listo para revisión/edición):", respuesta.content, height=180)