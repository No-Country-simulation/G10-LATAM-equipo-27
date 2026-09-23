import streamlit as st
import json
import re  # Nos permite extraer números del texto de la IA
from cerebro_ia import cadena

# ==========================================
# 1. CONFIGURACIÓN DE LA INTERFAZ VISUAL
# ==========================================
st.set_page_config(page_title="Panel de Curaduría", page_icon="🤖", layout="wide")
st.title("🤖 Panel de Curaduría IA - Equipo 27")
st.markdown("Filtra automáticamente los mensajes de Discord separando el oro del ruido.")

# ==========================================
# 2. GESTIÓN DE ESTADO (Para no perder datos al recargar)
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

# El Súper Botón que evalúa todo
if st.button("🚀 Ejecutar Análisis de Relevancia (IA) a toda la bandeja"):
    # Limpiamos resultados anteriores
    st.session_state['resultados_destacados'] = []
    st.session_state['resultados_descartados'] = []
    
    barra_progreso = st.progress(0)
    total = len(interacciones)
    
    for idx, interaccion in enumerate(interacciones):
        # 1. Mandamos el mensaje a la IA
        respuesta = cadena.invoke(
            {"texto": interaccion["texto"], "canal": interaccion["canal"]}
        )
        contenido = respuesta.content
        
        # 2. Extraemos el porcentaje (Busca "Relevancia: 85" y se queda con el 85)
        match = re.search(r"Relevancia:\s*(\d+)", contenido)
        score = int(match.group(1)) if match else 0
        
        # 3. Empaquetamos el resultado
        resultado_item = {
            "id": interaccion.get("id", idx),  # <-- Esta es la línea que nos faltaba
            "autor": interaccion["autor"],
            "canal": interaccion["canal"],
            "texto_original": interaccion["texto"],
            "analisis": contenido,
            "score": score
        }
        
        # 4. El Filtro Maestro (70% o más se va a destacados)
        if score >= 70:
            st.session_state['resultados_destacados'].append(resultado_item)
        else:
            st.session_state['resultados_descartados'].append(resultado_item)
            
        # Avanzamos la barra de progreso
        barra_progreso.progress((idx + 1) / total)
        
    st.session_state['analisis_completado'] = True
    st.success("¡Análisis completado con éxito!")

# ==========================================
# 4. RENDERIZADO VISUAL (LAS 2 SECCIONES)
# ==========================================
if st.session_state['analisis_completado']:
    
    # --- SECCIÓN 1: DESTACADOS ---
    st.markdown("---")
    st.header(f"🔥 Mensajes Destacados ({len(st.session_state['resultados_destacados'])})")
    st.markdown("Contenido de alto valor listo para Marketing. La IA generó copys para estos mensajes.")
    
    if not st.session_state['resultados_destacados']:
        st.info("No se encontraron mensajes relevantes en esta tanda.")
        
    for item in st.session_state['resultados_destacados']:
        # Tarjetas abiertas por defecto porque son importantes
        with st.expander(f"⭐ {item['score']}% Relevancia - De: {item['autor']} (Canal: #{item['canal']})", expanded=True):
            st.write(f"**Mensaje Original:** {item['texto_original']}")
            st.text_area("Resultado de IA (Copy Listo y Editable):", item['analisis'], height=150, key=f"dest_{item['id']}_{item['autor']}")

    # --- SECCIÓN 2: DESCARTADOS ---
    st.markdown("---")
    st.subheader(f"🗑️ Historial de Descartados ({len(st.session_state['resultados_descartados'])})")
    st.markdown("Mensajes ignorados por baja relevancia (Saludos, memes, preguntas operativas).")
    
    # Tarjeta colapsada por defecto para no ensuciar la pantalla
    with st.expander("Haz clic aquí para auditar la basura filtrada", expanded=False):
        if not st.session_state['resultados_descartados']:
            st.info("No hubo mensajes descartados.")
        for item in st.session_state['resultados_descartados']:
            st.markdown(f"📉 **{item['score']}%** | **{item['autor']}**: {item['texto_original']}")
else:
    # Vista previa antes de presionar el botón
    with st.expander("Ver vista previa de los mensajes crudos (Sin analizar)", expanded=False):
        for i in interacciones:
            st.write(f"- **{i['autor']}** (#{i['canal']}): {i['texto']}")