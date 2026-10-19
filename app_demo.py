
"""
app_demo.py – Interfaz temporal de demostración (Streamlit)
Diseño inspirado en las capturas de Mesa de Redacción / Cola / Reclamos.
Solo para pruebas locales. No forma parte del núcleo del MVP.
"""

import streamlit as st
import os
import json
from datetime import datetime
from src.config import config
from src.database import (
    obtener_siguiente_lote_pendiente,
    obtener_lotes_pendientes_masivos,
    actualizar_estado_lote,
)
from src.checkpoints import limpiar_checkpoint_hilo

st.set_page_config(
    page_title="CloudEDTech – Mesa de Redacción",
    page_icon="📝",
    layout="wide",
    initial_sidebar_state="expanded",
)

# -----------------------------
# Estilos ligeros para parecerse más al diseño
# -----------------------------
st.markdown("""
<style>
    .stApp { background-color: #f8fafc; }
    .card {
        background: white;
        border-radius: 12px;
        padding: 1.2rem;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        height: 100%;
    }
    .card-header {
        font-weight: 600;
        font-size: 0.95rem;
        margin-bottom: 0.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .badge {
        font-size: 0.72rem;
        padding: 2px 8px;
        border-radius: 999px;
        background: #f1f5f9;
        color: #475569;
    }
    .badge-borrador { background: #fef3c7; color: #92400e; }
    .badge-ok { background: #d1fae5; color: #065f46; }
    .section-title {
        font-size: 1.1rem;
        font-weight: 600;
        margin: 1.5rem 0 0.8rem 0;
        color: #0f172a;
    }
</style>
""", unsafe_allow_html=True)

# -----------------------------
# Sidebar
# -----------------------------
st.sidebar.title("PLATAFORMA PRINCIPAL")
pagina = st.sidebar.radio(
    "Navegación",
    ["Mesa de Redacción", "Cola de Mensajes", "Panel de Reclamos"],
    label_visibility="collapsed",
)

st.sidebar.markdown("---")
st.sidebar.caption("Demo local • No es producción")
st.sidebar.info("Los botones de publicar llaman la lógica real solo cuando se ejecuta el script de terminal.")

# =========================================================
# PÁGINA 1: MESA DE REDACCIÓN (3 canales lado a lado)
# =========================================================
if pagina == "Mesa de Redacción":
    st.markdown("### 📝 Mesa de Redacción")
    st.caption("Mensaje activo en mesa de redacción • Vista de borradores por canal")

    # Controles de carga
    col_load1, col_load2, col_load3 = st.columns([2, 1, 1])
    with col_load1:
        id_forzado = st.text_input("ID de mensaje (opcional)", placeholder="Ej: 42", label_visibility="collapsed")
    with col_load2:
        if st.button("Cargar lote", type="primary", use_container_width=True):
            if id_forzado.strip():
                os.environ["ID_MENSAJE_HITL"] = id_forzado.strip()
            else:
                os.environ.pop("ID_MENSAJE_HITL", None)
            lote = obtener_siguiente_lote_pendiente()
            st.session_state["lote_actual"] = lote
            st.session_state["copys"] = lote.get("json_precurado", {}) if lote else {}
    with col_load3:
        if st.button("Limpiar", use_container_width=True):
            st.session_state.pop("lote_actual", None)
            st.session_state.pop("copys", None)
            st.rerun()

    lote = st.session_state.get("lote_actual")

    if not lote:
        st.info("👆 Carga un lote para ver los borradores de LinkedIn, X y Discord.")
    else:
        # Cabecera del mensaje activo
        st.markdown(f"""
        <div class="card" style="margin-bottom:1rem;">
            <div class="card-header">
                <span>👤 <b>{lote.get('autor', 'Usuario')}</b> • ID {lote['id_mensaje']}</span>
                <span class="badge">Relevancia: {lote['json_precurado'].get('relevancia', '—')}</span>
            </div>
            <div style="color:#334155; font-size:0.95rem; margin-top:0.4rem;">
                {lote['json_precurado'].get('texto_original', 'Sin texto')[:400]}
            </div>
        </div>
        """, unsafe_allow_html=True)

        # ---------- TRES CANALES LADO A LADO ----------
        st.markdown('<div class="section-title">Borradores generados por canal</div>', unsafe_allow_html=True)

        col_li, col_x, col_dc = st.columns(3)

        # --- LinkedIn ---
        with col_li:
            st.markdown("""
            <div class="card">
                <div class="card-header">
                    <span>🔵 LinkedIn</span>
                    <span class="badge badge-borrador">Borrador</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
            st.text_input("Título del post", value="Virtualización Enterprise: Cómo Reducir un 64% la Latencia...", key="li_titulo")
            st.text_area("Copy persuasivo", value="En infraestructura hiperconvergente...", height=120, key="li_copy")
            st.text_area("Copy de tono CloudEDTech", value="En CloudEDTech formamos a líderes...", height=80, key="li_tono")
            c1, c2 = st.columns(2)
            c1.button("Publicar en LinkedIn", type="primary", use_container_width=True, key="btn_li")
            c2.button("Rechazar", use_container_width=True, key="rej_li")

        # --- X (Twitter) ---
        with col_x:
            st.markdown("""
            <div class="card">
                <div class="card-header">
                    <span>⚫ X (Twitter)</span>
                    <span class="badge badge-borrador">Borrador</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
            st.text_input("Título / Hook", value="TWEET TÉCNICO DE ALTO IMPACTO", key="x_titulo")
            st.text_area("Tweet", value="Reducción del 64% en latencia p99...", height=120, key="x_copy")
            st.caption("0 / 280 caracteres")
            c1, c2 = st.columns(2)
            c1.button("Publicar en X", type="primary", use_container_width=True, key="btn_x")
            c2.button("Rechazar", use_container_width=True, key="rej_x")

        # --- Discord ---
        with col_dc:
            st.markdown("""
            <div class="card">
                <div class="card-header">
                    <span>🟣 Discord</span>
                    <span class="badge badge-borrador">Borrador</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
            st.text_input("Canal / Título", value="#soporte-servidores • Vista Bot Apoyo", key="dc_titulo")
            st.text_area("Respuesta Markdown", value="**CloudEDTech Bot Support** – Asistencia Técnica...", height=120, key="dc_copy")
            st.caption("Canal destino: #soporte-servidores")
            c1, c2 = st.columns(2)
            c1.button("Publicar en Discord", type="primary", use_container_width=True, key="btn_dc")
            c2.button("Rechazar", use_container_width=True, key="rej_dc")

        st.markdown("---")
        # Acciones globales HITL
        st.markdown("#### Decisión global del lote")
        g1, g2, g3 = st.columns(3)
        with g1:
            if st.button("✅ Aprobar y Publicar todo", type="primary", use_container_width=True):
                os.environ["HITL_DECISION"] = "s"
                st.success("Variable HITL_DECISION=s lista. Ejecuta en terminal: `python -m scripts.run_hitl`")
        with g2:
            if st.button("❌ Rechazar lote completo", use_container_width=True):
                actualizar_estado_lote(lote["id_mensaje"], "desaprobado")
                limpiar_checkpoint_hilo(f"sesion_{lote['id_mensaje']}")
                st.warning("Lote desaprobado y checkpoint limpiado.")
                st.session_state.pop("lote_actual", None)
        with g3:
            st.button("💾 Guardar borradores (simulado)", use_container_width=True)

# =========================================================
# PÁGINA 2: COLA DE MENSAJES (Historial / Cola)
# =========================================================
elif pagina == "Cola de Mensajes":
    st.markdown("### 📥 Cola de Mensajes en Espera")
    st.caption("Secuencia FIFO • Vista de mensajes pendientes y publicados")

    col_f1, col_f2, col_f3 = st.columns(3)
    with col_f1:
        filtro_estado = st.selectbox("Estado", ["Todos", "En Espera", "En Mesa", "Publicado", "Desaprobado"])
    with col_f2:
        limite = st.slider("Límite", 5, 30, 10)
    with col_f3:
        if st.button("🔄 Refrescar cola", use_container_width=True):
            st.session_state["cola"] = obtener_lotes_pendientes_masivos(limite=limite)

    cola = st.session_state.get("cola", [])

    if not cola:
        st.info("Pulsa **Refrescar cola** para cargar mensajes de baja relevancia (< 35).")
    else:
        # Cabecera tipo tabla
        h1, h2, h3, h4, h5, h6 = st.columns([1.2, 1.5, 2.5, 0.8, 0.9, 1])
        h1.markdown("**Usuario**")
        h2.markdown("**Canal**")
        h3.markdown("**Contenido (preview)**")
        h4.markdown("**Rel.**")
        h5.markdown("**Sentimiento**")
        h6.markdown("**Estado**")

        st.markdown("---")

        for lote in cola:
            jp = lote.get("json_precurado", {})
            c1, c2, c3, c4, c5, c6 = st.columns([1.2, 1.5, 2.5, 0.8, 0.9, 1])
            c1.write(lote.get("autor", "—")[:18])
            c2.write(jp.get("canal_origen", "—") if isinstance(jp.get("canal_origen"), str) else "—")
            preview = (jp.get("texto_original") or "")[:70]
            c3.write(preview + ("..." if len(jp.get("texto_original") or "") > 70 else ""))
            c4.write(str(jp.get("relevancia", "—")))
            c5.write(str(jp.get("sentimiento", "—"))[:10])
            estado = jp.get("estado_revision", "pendiente")
            c6.write(estado)

            # Botón cargar en mesa
            if st.button(f"Cargar {lote['id_mensaje']}", key=f"load_{lote['id_mensaje']}"):
                st.session_state["lote_actual"] = lote
                st.success(f"Lote {lote['id_mensaje']} listo. Ve a **Mesa de Redacción**.")

# =========================================================
# PÁGINA 3: PANEL DE RECLAMOS
# =========================================================
else:
    st.markdown("### 🚨 Panel de Quejas, Reclamos y Soporte Crítico")
    st.caption("Detección de incidentes • Prioridad SLA")

    # Simulación de tarjetas de reclamos (en un caso real vendrían de la DB)
    reclamos_demo = [
        {
            "autor": "Daniel_DevCluster",
            "canal": "#soporte-servidores",
            "texto": "INCIDENCIA CRÍTICA: Caída abrupta de I/O en el clúster nodo 4 tras actualizar firmware...",
            "prioridad": "SLA < 15 min",
            "tags": ["#KVM", "#SoporteCritico", "#ServidoresNVMe"],
        },
        {
            "autor": "Marcos_CloudEdu",
            "canal": "#soporte-servidores",
            "texto": "RECLAMO URGENTE: Las instancias KVM para los estudiantes de certificación no están liberando la memoria...",
            "prioridad": "SLA < 30 min",
            "tags": ["#EdTech", "#KVM", "#ReclamoSoporte"],
        },
    ]

    for r in reclamos_demo:
        with st.container():
            st.markdown(f"""
            <div class="card" style="margin-bottom:1rem; border-left: 4px solid #ef4444;">
                <div class="card-header">
                    <span>👤 <b>{r['autor']}</b> • {r['canal']}</span>
                    <span class="badge" style="background:#fee2e2;color:#991b1b;">{r['prioridad']}</span>
                </div>
                <div style="margin:0.6rem 0; color:#334155;">{r['texto']}</div>
                <div style="font-size:0.8rem; color:#64748b;">{" ".join(r['tags'])}</div>
            </div>
            """, unsafe_allow_html=True)
            c1, c2 = st.columns([1, 4])
            c1.button("Enviar Respuesta RAG", key=f"rag_{r['autor']}", type="primary")
            c2.button("Marcar en revisión", key=f"rev_{r['autor']}")

st.sidebar.markdown("---")
st.sidebar.caption(f"Última actualización: {datetime.now().strftime('%H:%M:%S')}")