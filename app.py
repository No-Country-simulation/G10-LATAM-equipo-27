import streamlit as st
import json
from cerebro_ia import cadena, cadena_rescate

# ==========================================
# 1. CONFIGURACIÓN DE LA INTERFAZ VISUAL
# ==========================================
st.set_page_config(page_title="Panel de Curaduría", page_icon="🤖", layout="wide")
st.title("🤖 Panel de Curaduría IA - Equipo 27")
st.markdown("Filtra automáticamente los mensajes de Discord separando el oro del ruido.")

# ==========================================
# 2. GESTIÓN DE ESTADO Y CALLBACKS 
# ==========================================
if 'resultados_destacados' not in st.session_state:
    st.session_state['resultados_destacados'] = []
if 'resultados_descartados' not in st.session_state:
    st.session_state['resultados_descartados'] = []
if 'analisis_completado' not in st.session_state:
    st.session_state['analisis_completado'] = False

def rescatar_mensaje(item_id):
    # Buscamos el mensaje en la lista de descartados y lo procesamos con la IA creativa
    for i, item in enumerate(st.session_state['resultados_descartados']):
        if item['id'] == item_id:
            mensaje = st.session_state['resultados_descartados'].pop(i)
            
            respuesta_nueva = cadena_rescate.invoke(
                {"texto": mensaje["texto_original"], "canal": mensaje["canal"]}
            )
            
            mensaje['ia'] = respuesta_nueva.model_dump()
            mensaje['score'] = 100 
            
            st.session_state['resultados_destacados'].append(mensaje)
            break 

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
        respuesta_pydantic = cadena.invoke(
            {"texto": interaccion["texto"], "canal": interaccion["canal"]}
        )
        
        datos_ia = respuesta_pydantic.model_dump()
        score = datos_ia["relevancia"]
        
        resultado_item = {
            "id": interaccion.get("id", idx),
            "autor": interaccion["autor"],
            "canal": interaccion["canal"],
            "texto_original": interaccion["texto"],
            "ia": datos_ia, 
            "score": score
        }
        
        if score >= 70:
            st.session_state['resultados_destacados'].append(resultado_item)
        else:
            st.session_state['resultados_descartados'].append(resultado_item)
            
        barra_progreso.progress((idx + 1) / total)
        
    st.session_state['analisis_completado'] = True
    st.success("¡Análisis completado con éxito!")

# ==========================================
# 4. RENDERIZADO VISUAL CON PESTAÑAS Y DASHBOARD
# ==========================================
if st.session_state['analisis_completado']:
    
    # --- NUEVO: DASHBOARD EJECUTIVO (MÉTRICAS) ---
    st.markdown("---")
    st.header("📊 Dashboard de Rendimiento")
    
    # Matemáticas en tiempo real
    total_destacados = len(st.session_state['resultados_destacados'])
    total_descartados = len(st.session_state['resultados_descartados'])
    total_procesados = total_destacados + total_descartados
    
    promedio_relevancia = 0
    if total_destacados > 0:
        promedio_relevancia = sum([item['score'] for item in st.session_state['resultados_destacados']]) / total_destacados
        
    col_met1, col_met2, col_met3, col_met4 = st.columns(4)
    with col_met1:
        st.metric(label="Total de Mensajes", value=total_procesados)
    with col_met2:
        st.metric(label="🔥 Aprobados (Marketing)", value=total_destacados)
    with col_met3:
        st.metric(label="🗑️ Ruido Filtrado", value=total_descartados)
    with col_met4:
        st.metric(label="🎯 Promedio Relevancia VIP", value=f"{promedio_relevancia:.1f}%")

    # --- SECCIÓN 1: DESTACADOS ---
    st.markdown("---")
    st.subheader("Bandeja de Salida (Listos para Publicar)")
    
    if not st.session_state['resultados_destacados']:
        st.info("No se encontraron mensajes relevantes en esta tanda.")
        
    for item in st.session_state['resultados_destacados']:
        ia = item['ia']
        icono = "🌟 RESCATADO" if item['score'] == 100 else f"⭐ {item['score']}% Relevancia"
        
        with st.expander(f"{icono} - De: {item['autor']} (Canal: #{item['canal']})", expanded=True):
            st.markdown(f"**Mensaje Original:** {item['texto_original']}")
            st.markdown(f"🏷️ **Temas:** `{ia['temas_clave']}` | 🎯 **Segmento:** `{ia['segmento']}`")
            st.caption(f"✨ *Alineación de Marca:* {ia['alineacion']}")
            
            tab1, tab2, tab3 = st.tabs(["💼 LinkedIn", "🐦 X (Twitter)", "🎮 Discord"])
            with tab1:
                st.text_area("Copy Corporativo (Editable):", ia['copy_linkedin'], height=150, key=f"in_{item['id']}")
            with tab2:
                st.text_area("Hilo Corto (Editable):", ia['copy_twitter'], height=100, key=f"tw_{item['id']}")
            with tab3:
                st.text_area("Resumen Comunidad (Editable):", ia['copy_discord'], height=150, key=f"dc_{item['id']}")

    # --- SECCIÓN 2: DESCARTADOS ---
    st.markdown("---")
    st.subheader("Bandeja de Descartados (Filtro Automático)")
    
    with st.expander("Haz clic aquí para auditar la basura filtrada", expanded=True):
        if not st.session_state['resultados_descartados']:
            st.info("No hubo mensajes descartados.")
            
        for item in st.session_state['resultados_descartados']:
            col1, col2 = st.columns([8, 2])
            with col1:
                st.markdown(f"📉 **{item['score']}%** | **{item['autor']}**: {item['texto_original']}")
            with col2:
                st.button("♻️ Evaluar / Rescatar", key=f"resc_{item['id']}", on_click=rescatar_mensaje, args=(item['id'],))
else:
    with st.expander("Ver vista previa de los mensajes crudos (Sin analizar)", expanded=False):
        for i in interacciones:
            st.write(f"- **{i['autor']}** (#{i['canal']}): {i['texto']}")