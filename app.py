import streamlit as st
import json
from cerebro_ia import cadena

# ==========================================
# 1. CONFIGURACIÓN DE LA INTERFAZ VISUAL
# ==========================================
st.set_page_config(page_title="Panel de Curaduría", page_icon="🤖", layout="wide")
st.title("🤖 Panel de Curaduría IA - Equipo 27")
st.markdown("Filtra automáticamente los mensajes de Discord separando el oro del ruido.")

# ==========================================
# 2. GESTIÓN DE ESTADO
# ==========================================
if 'resultados_destacados' not in st.session_state:
    st.session_state['resultados_destacados'] = []
if 'resultados_descartados' not in st.session_state:
    st.session_state['resultados_descartados'] = []
if 'analisis_completado' not in st.session_state:
    st.session_state['analisis_completado'] = False

# ==========================================
# 3. LECTURA DE DATOS Y EJECUCIÓN
# ==========================================
with open('mock_data.json', 'r', encoding='utf-8') as archivo:
    datos = json.load(archivo)

interacciones = datos.get('interacciones', [])

st.subheader(f"📥 Bandeja de Entrada: {len(interacciones)} mensajes pendientes")

if st.button("🚀 Ejecutar Análisis Multicanal (IA) a toda la bandeja"):
    st.session_state['resultados_destacados'] = []
    st.session_state['resultados_descartados'] = []
    
    barra_progreso = st.progress(0)
    total = len(interacciones)
    
    for idx, interaccion in enumerate(interacciones):
        # 1. Mandamos el mensaje a la IA (Nos devuelve un objeto Pydantic gracias al Paso 2)
        respuesta_pydantic = cadena.invoke(
            {"texto": interaccion["texto"], "canal": interaccion["canal"]}
        )
        
        # 2. Convertimos el objeto a un diccionario de Python fácil de manejar
        datos_ia = respuesta_pydantic.model_dump()
        score = datos_ia["relevancia"]
        
        # 3. Empaquetamos el resultado completo
        resultado_item = {
            "id": interaccion.get("id", idx),
            "autor": interaccion["autor"],
            "canal": interaccion["canal"],
            "texto_original": interaccion["texto"],
            "ia": datos_ia, # <-- Aquí guardamos todas las cajitas del JSON
            "score": score
        }
        
        # 4. El Filtro Maestro
        if score >= 70:
            st.session_state['resultados_destacados'].append(resultado_item)
        else:
            st.session_state['resultados_descartados'].append(resultado_item)
            
        barra_progreso.progress((idx + 1) / total)
        
    st.session_state['analisis_completado'] = True
    st.success("¡Análisis completado con éxito!")

# ==========================================
# 4. RENDERIZADO VISUAL CON PESTAÑAS
# ==========================================
if st.session_state['analisis_completado']:
    
    # --- SECCIÓN 1: DESTACADOS ---
    st.markdown("---")
    st.header(f"🔥 Mensajes Destacados ({len(st.session_state['resultados_destacados'])})")
    
    if not st.session_state['resultados_destacados']:
        st.info("No se encontraron mensajes relevantes en esta tanda.")
        
    for item in st.session_state['resultados_destacados']:
        ia = item['ia'] # Extraemos el JSON del mensaje actual
        
        with st.expander(f"⭐ {item['score']}% Relevancia - De: {item['autor']} (Canal: #{item['canal']})", expanded=True):
            st.markdown(f"**Mensaje Original:** {item['texto_original']}")
            
            # Mostramos los metadatos de segmentación limpios
            st.markdown(f"🏷️ **Temas:** `{ia['temas_clave']}` | 🎯 **Segmento:** `{ia['segmento']}`")
            st.caption(f"✨ *Alineación de Marca:* {ia['alineacion']}")
            
            # ¡MAGIA VISUAL! Creamos 3 pestañas para los copys
            tab1, tab2, tab3 = st.tabs(["💼 LinkedIn", "🐦 X (Twitter)", "🎮 Discord"])
            
            with tab1:
                st.text_area("Copy Corporativo (Editable):", ia['copy_linkedin'], height=150, key=f"in_{item['id']}")
            with tab2:
                st.text_area("Hilo Corto (Editable):", ia['copy_twitter'], height=100, key=f"tw_{item['id']}")
            with tab3:
                st.text_area("Resumen Comunidad (Editable):", ia['copy_discord'], height=150, key=f"dc_{item['id']}")

    # --- SECCIÓN 2: DESCARTADOS ---
    st.markdown("---")
    st.subheader(f"🗑️ Historial de Descartados ({len(st.session_state['resultados_descartados'])})")
    
    with st.expander("Haz clic aquí para auditar la basura filtrada", expanded=False):
        if not st.session_state['resultados_descartados']:
            st.info("No hubo mensajes descartados.")
        for item in st.session_state['resultados_descartados']:
            st.markdown(f"📉 **{item['score']}%** | **{item['autor']}**: {item['texto_original']}")
else:
    with st.expander("Ver vista previa de los mensajes crudos (Sin analizar)", expanded=False):
        for i in interacciones:
            st.write(f"- **{i['autor']}** (#{i['canal']}): {i['texto']}")