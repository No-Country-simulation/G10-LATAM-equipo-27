from ver_json import obtener_json
import streamlit as st
import subprocess
import json
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

st.set_page_config(page_title="Análisis de Comunidad con IA", layout="wide")

st.title("🧠 Pipeline de Análisis de Mensajes de Discord")
st.markdown("Esta interfaz permite probar el flujo completo: extraer mensajes de Discord, procesarlos con un LLM y generar los resultados para Copywriting.")

# --- 1. EXTRACCIÓN DE DISCORD ---
st.header("1. Extracción de Datos (Discord)")
col1, col2 = st.columns([1, 2])

with col1:
    if st.button("📥 Extraer últimos mensajes de Discord", use_container_width=True):
        if not os.environ.get("DISCORD_TOKEN"):
            st.error("⚠️ Falta el DISCORD_TOKEN en el archivo .env")
        else:
            with st.spinner("Conectando con Discord y descargando mensajes..."):
                # Usamos subprocess con sys.executable para que Streamlit Cloud use el entorno correcto
                import sys
                result = subprocess.run([sys.executable, "bot_lote.py"], capture_output=True, text=True)
                if result.returncode == 0:
                    st.success("✅ Extracción completada.")
                    with st.expander("Ver logs del bot"):
                        st.code(result.stdout)
                else:
                    st.error("❌ Error durante la extracción.")
                    with st.expander("Ver error detallado"):
                        st.code(result.stderr)

with col2:
    espacio_contador = st.empty()
    espacio_json = st.empty()
st.divider()

# --- 2. SELECCIÓN DE CEREBRO Y ANÁLISIS ---
st.header("2. Evaluación con IA")

st.subheader("Filtro por Fechas")
col_fecha1, col_fecha2 = st.columns(2)
with col_fecha1:
    fecha_desde = st.date_input("Desde", value=None)
with col_fecha2:
    fecha_hasta = st.date_input("Hasta", value=None)

error_fechas = False
if fecha_desde and fecha_hasta and fecha_desde > fecha_hasta:
    st.error("Error: La fecha 'Desde' no puede ser mayor que 'Hasta'.")
    error_fechas = True

total_mensajes = 0
datos_locales = {}

try:
    datos_locales = obtener_json(desde=fecha_desde, hasta=fecha_hasta)
    total_mensajes = datos_locales.get("total", 0)
    
    # Llenar el espacio reservado arriba
    espacio_contador.info(f"📊 Actualmente hay **{total_mensajes}** mensajes en la base de datos local listos para ser analizados.")
    with espacio_json.expander("Ver JSON crudo de la Base de Datos"):
        st.json(datos_locales)
        
    if total_mensajes == 0 and not error_fechas:
        st.warning("No hay mensajes para analizar en este rango de fechas.")
except Exception as e:
    espacio_contador.warning("💡 La base de datos está vacía en este entorno. Por favor, haz clic en 'Extraer últimos mensajes de Discord' para inicializarla.")
opciones_cerebro = {
    "Groq (openai/gpt-oss-120b) - Rápido": "cerebro_ia",
    "Google Gemma 4 31B - Mayor límite de uso": "cerebro_ia_gemma_4",
    "Google Gemini 3.5 Flash Lite - Equilibrado": "cerebro_ia_gemini_flash"
}

cerebro_elegido = st.selectbox("🤖 Selecciona el motor de IA a utilizar:", list(opciones_cerebro.keys()))
modulo_cerebro_nombre = opciones_cerebro[cerebro_elegido]

limite_mensajes = st.slider("Número de mensajes a analizar (para no agotar tokens en pruebas):", 1, 20, 4)

if st.button("🚀 Ejecutar Análisis", type="primary", disabled=(total_mensajes == 0 or error_fechas)):
    with st.spinner(f"Analizando {limite_mensajes} mensajes usando {modulo_cerebro_nombre}..."):
        try:
            import importlib
            # Importación dinámica del cerebro seleccionado
            modulo_cerebro = importlib.import_module(modulo_cerebro_nombre)
            importlib.reload(modulo_cerebro) # Recargar por si hubo cambios
            
            mensajes = datos_locales.get("interacciones", [])
            
            if not mensajes:
                st.warning("No hay mensajes en la base de datos para analizar. ¡Ejecuta la extracción primero!")
            else:
                resultados_destacados = []
                resultados_descartados = []
                
                barra_progreso = st.progress(0)
                
                mensajes_a_procesar = mensajes[:limite_mensajes]
                for idx, msg in enumerate(mensajes_a_procesar):
                    # Llamada a la IA
                    respuesta = modulo_cerebro.cadena.invoke({"texto": msg["texto"], "canal": msg["canal"]})
                    kpis = respuesta.model_dump()
                    
                    dato = {
                        "id_mensaje": msg["id"],
                        "autor": msg["autor"],
                        "canal_origen": msg["canal"],
                        "comunidad": msg.get("origen_comunidad"), 
                        "fecha_envio": msg.get("enviado_en"),
                        "fecha_extraccion": msg.get("creado_en"),
                        "semana": msg.get("periodo_referencia"),
                        "texto_original": msg["texto"],
                        "kpis": kpis
                    }
                    
                    if kpis["relevancia"] >= 70:
                        resultados_destacados.append(dato)
                    else:
                        resultados_descartados.append(dato)
                        
                    barra_progreso.progress((idx + 1) / len(mensajes_a_procesar))
                
                # Guardar el JSON Final
                paquete_maestro = {
                    "aprobados": resultados_destacados,
                    "descartados": resultados_descartados
                }
                
                with open("resultados_kpis.json", "w", encoding="utf-8") as archivo:
                    json.dump(paquete_maestro, archivo, indent=2, ensure_ascii=False)
                    
                st.success("✨ Análisis completado y archivo `resultados_kpis.json` generado con éxito.")
                
        except Exception as e:
            st.error(f"Error durante la ejecución de la IA: {e}")

st.divider()

# --- 3. RESULTADOS PARA COPYWRITING ---
st.header("3. Resultados para Copywriting")

if os.path.exists("resultados_kpis.json"):
    with open("resultados_kpis.json", "r", encoding="utf-8") as f:
        resultados = json.load(f)
        
    col_aprobados, col_descartados = st.columns(2)
    
    with col_aprobados:
        st.subheader(f"✅ Aprobados ({len(resultados.get('aprobados', []))})")
        for item in resultados.get("aprobados", []):
            with st.container(border=True):
                st.markdown(f"**Autor:** {item['autor']} | **Canal:** {item['canal_origen']}")
                st.info(item['texto_original'])
                st.markdown(f"**Temas:** {item['kpis']['temas_clave']} | **Sentimiento:** {item['kpis']['sentimiento']}")
                st.caption(f"Razonamiento: {item['kpis']['razonamiento']}")
                
    with col_descartados:
        st.subheader(f"🗑️ Descartados ({len(resultados.get('descartados', []))})")
        for item in resultados.get("descartados", []):
            with st.container(border=True):
                st.markdown(f"**Autor:** {item['autor']} | **Canal:** {item['canal_origen']}")
                st.warning(item['texto_original'])
                st.markdown(f"**Temas:** {item['kpis']['temas_clave']} | **Sentimiento:** {item['kpis']['sentimiento']}")
                st.caption(f"Razonamiento: {item['kpis']['razonamiento']}")
                
    st.download_button(
        label="⬇️ Descargar resultados_kpis.json",
        data=json.dumps(resultados, indent=2, ensure_ascii=False),
        file_name="resultados_kpis.json",
        mime="application/json"
    )
else:
    st.info("Aún no se ha generado el archivo de resultados. Ejecuta el análisis en el paso 2.")


