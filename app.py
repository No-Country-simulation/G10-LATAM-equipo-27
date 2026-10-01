import streamlit as st
import json
from cerebro_ia import cadena

st.set_page_config(page_title="Panel de Triaje y KPIs", page_icon="📊", layout="wide")
st.title("📊 Panel de Triaje IA - Equipo 27")
st.markdown("Filtro analítico de Discord. Genera JSON con KPIs para el equipo de Copywriting.")

if 'resultados_destacados' not in st.session_state:
    st.session_state['resultados_destacados'] = []
if 'resultados_descartados' not in st.session_state:
    st.session_state['resultados_descartados'] = []
if 'analisis_completado' not in st.session_state:
    st.session_state['analisis_completado'] = False

def rescatar_mensaje(item_id):
    for i, item in enumerate(st.session_state['resultados_descartados']):
        if item['id'] == item_id:
            mensaje = st.session_state['resultados_descartados'].pop(i)
            mensaje['score'] = 100
            mensaje['ia']['relevancia'] = 100
            mensaje['ia']['razonamiento'] = "Aprobado manualmente por el Community Manager."
            mensaje['ia']['temas_clave'] = "#RescateManual #Comunidad"
            mensaje['ia']['segmento'] = "Audiencia General"
            st.session_state['resultados_destacados'].append(mensaje)
            break 

with open('mock_data.json', 'r', encoding='utf-8') as archivo:
    datos = json.load(archivo)

interacciones = datos.get('interacciones', [])
st.subheader(f"📥 Bandeja de Entrada: {len(interacciones)} mensajes pendientes")

if st.button("🚀 Ejecutar Análisis de KPIs"):
    st.session_state['resultados_destacados'] = []
    st.session_state['resultados_descartados'] = []
    
    # Procesamiento en Lote (Batch) para paralelizar las peticiones a Gemma 4
    with st.spinner(f"Enviando {len(interacciones)} mensajes en paralelo a Gemma 4..."):
        # 1. Preparamos todas las entradas en una lista
        entradas = [{"texto": i["texto"], "canal": i["canal"]} for i in interacciones]
        
        # 2. Ejecutamos todas las consultas al mismo tiempo
        # max_concurrency limita las peticiones simultáneas para no saturar la API
        respuestas_lote = cadena.batch(entradas, config={"max_concurrency": 20})
        
        # 3. Procesamos los resultados empaquetados
        for idx, (interaccion, respuesta_pydantic) in enumerate(zip(interacciones, respuestas_lote)):
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
                
    st.session_state['analisis_completado'] = True
    st.success("¡Análisis completado con éxito!")

if st.session_state['analisis_completado']:
    st.markdown("---")
    st.header("📈 KPIs Generales de la Tanda")
    
    total_destacados = len(st.session_state['resultados_destacados'])
    total_descartados = len(st.session_state['resultados_descartados'])
    total_procesados = total_destacados + total_descartados
    promedio_relevancia = sum([item['score'] for item in st.session_state['resultados_destacados']]) / total_destacados if total_destacados > 0 else 0
        
    col_met1, col_met2, col_met3, col_met4 = st.columns(4)
    with col_met1: st.metric(label="Total de Mensajes", value=total_procesados)
    with col_met2: st.metric(label="🔥 Aprobados", value=total_destacados)
    with col_met3: st.metric(label="🗑️ Ruido Filtrado", value=total_descartados)
    with col_met4: st.metric(label="🎯 Promedio Relevancia", value=f"{promedio_relevancia:.1f}%")

    st.markdown("---")
    st.subheader("Bandeja de Aprobados (Data Lista)")
    for item in st.session_state['resultados_destacados']:
        ia = item['ia']
        icono = "🌟 RESCATADO" if item['score'] == 100 else f"⭐ {item['score']}% Relevancia"
        with st.expander(f"{icono} - De: {item['autor']} (Canal: #{item['canal']})", expanded=True):
            st.markdown(f"**Mensaje Original:** {item['texto_original']}")
            st.markdown(f"📊 **KPIs:** Sentimiento: `{ia.get('sentimiento', 'Neutral')}` | Temas: `{ia['temas_clave']}` | Segmento: `{ia['segmento']}`")
            st.caption(f"🧠 *Razonamiento IA:* {ia['razonamiento']}")

    st.markdown("---")
    st.subheader("Bandeja de Descartados")
    with st.expander("Haz clic aquí para auditar la basura y rescatar mensajes", expanded=True):
        if not st.session_state['resultados_descartados']:
            st.write("No hay mensajes descartados en esta tanda.")
        for item in st.session_state['resultados_descartados']:
            col1, col2 = st.columns([8, 2])
            with col1: st.markdown(f"📉 **{item['score']}%** | **{item['autor']}**: {item['texto_original']}")
            with col2: st.button("♻️ Rescatar", key=f"resc_{item['id']}", on_click=rescatar_mensaje, args=(item['id'],))
            
    st.header("💾 Exportación de Datos")
    col_exp1, col_exp2 = st.columns(2)
    with col_exp1:
        if st.session_state['resultados_destacados']:
            datos_destacados = []
            for item in st.session_state['resultados_destacados']:
                datos_destacados.append({
                    "id_mensaje": item["id"],
                    "canal_origen": f"#{item['canal']}",
                    "autor": item["autor"],
                    "mensaje_sin_modificar": item["texto_original"],
                    "kpis": {
                        "cuantitativo_relevancia": item["ia"]["relevancia"],
                        "cualitativo_sentimiento": item.get("ia", {}).get("sentimiento", "Neutral"),
                        "cualitativo_temas": item["ia"]["temas_clave"],
                        "cualitativo_segmento": item["ia"]["segmento"]
                    }
                })
                
            json_destacados = json.dumps(datos_destacados, indent=4, ensure_ascii=False)
            st.download_button("📥 Descargar Aprobados (JSON)", data=json_destacados, file_name="datos_aprobados.json", mime="application/json")

    with col_exp2:
        if st.session_state['resultados_descartados']:
            datos_descartados = []
            for item in st.session_state['resultados_descartados']:
                datos_descartados.append({
                    "id_mensaje": item["id"],
                    "canal_origen": f"#{item['canal']}",
                    "autor": item["autor"],
                    "mensaje_sin_modificar": item["texto_original"],
                    "kpis": {
                        "cuantitativo_relevancia": item["ia"]["relevancia"],
                        "cualitativo_sentimiento": item.get("ia", {}).get("sentimiento", "Neutral"),
                        "razon_descarte": item["ia"]["razonamiento"]
                    }
                })
                
            json_descartados = json.dumps(datos_descartados, indent=4, ensure_ascii=False)
            st.download_button("🗑️ Descargar Descartados (JSON)", data=json_descartados, file_name="datos_descartados.json", mime="application/json")
else:
    with st.expander("Ver vista previa", expanded=False):
        for i in interacciones: st.write(f"- **{i['autor']}** (#{i['canal']}): {i['texto']}")