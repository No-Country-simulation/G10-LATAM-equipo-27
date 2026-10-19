import logging
from langgraph.graph import StateGraph, START, END
from src.schemas import AgentState
from src.nodes import (
    nodo_orquestador,
    nodo_linkedin,
    nodo_x,
    nodo_discord,
    nodo_reclamos,
    nodo_validador,
    nodo_publicador,
    nodo_gemma_automatico,
)

logger = logging.getLogger(__name__)

def enrutador_plataformas(state: AgentState):
    """
    Enrutador principal de plataformas.
    Procesa las rutas activas devueltas por el orquestador y las normaliza a minúsculas.
    Si la lista está vacía, redirige limpiamente a 'fin_sin_ruta' (ej. spam / filtrados directos).
    """
    rutas = state.get("rutas_activas", [])
    rutas_normalizadas = [str(ruta).strip().lower() for ruta in rutas if str(ruta).strip()]
    logger.info(f"🔀 Rutas activas enrutadas: {rutas_normalizadas}")

    if not rutas_normalizadas:
        return "fin_sin_ruta"

    return rutas_normalizadas


def build_graph(checkpointer=None, interrupt_before=None):
    """
    Patrón de Fábrica para construir y compilar el StateGraph de LangGraph.
    Permite inyectar cualquier tipo de checkpointer (MemorySaver, PostgresSaver, AsyncPostgresSaver)
    y configurar puntos de interrupción humana (HITL) de manera flexible.
    """
    logger.info("🔗 Inicializando ensamblaje del grafo CloudEDTech con ingesta automatizada...")
    
    if interrupt_before is None:
        interrupt_before = ["publicador"]

    if checkpointer is None:
        logger.warning("⚠️ build_graph() se llamó sin checkpointer. "
                "El estado no se persistirá (HITL y reanudación no funcionarán).")

    # 1. Instanciación del StateGraph
    builder = StateGraph(AgentState)

    # 2. Agregar nodos principales y el nodo autónomo de Gemma
    builder.add_node("orquestador", nodo_orquestador)
    builder.add_node("linkedin", nodo_linkedin)
    builder.add_node("x", nodo_x)
    builder.add_node("discord", nodo_discord)
    builder.add_node("reclamos", nodo_reclamos)
    builder.add_node("validador", nodo_validador)
    builder.add_node("publicador", nodo_publicador)
    builder.add_node("gemma_automatico", nodo_gemma_automatico)

    # 3. Conexión inicial desde START hacia el orquestador
    builder.add_edge(START, "orquestador")

    # 4. Enrutamiento condicional (Fan-out) desde el orquestador
    builder.add_conditional_edges(
        "orquestador",
        enrutador_plataformas,
        {
            "linkedin": "linkedin",
            "x": "x",
            "discord": "discord",
            "reclamos": "reclamos",
            "gemma_automatico": "gemma_automatico",
            "fin_sin_ruta": END,  # Spam o contenido sin rutas → termina limpio sin error
        },
    )

    # 5. Rama autónoma de Gemma finaliza directamente sin HITL
    builder.add_edge("gemma_automatico", END)

    # 6. Convergencia hacia el validador (Fan-in) para la rama supervisada
    builder.add_edge("linkedin", "validador")
    builder.add_edge("x", "validador")
    builder.add_edge("discord", "validador")
    builder.add_edge("reclamos", "validador")

    # 7. Del validador pasamos directo al publicador y luego a END
    builder.add_edge("validador", "publicador")
    builder.add_edge("publicador", END)

    # 8. Compilación del grafo aplicando el checkpointer y los puntos de interrupción
    grafo_compilado = builder.compile(
        checkpointer=checkpointer,
        interrupt_before=interrupt_before
    )

    logger.info("✅ Grafo compilado exitosamente mediante patrón de fábrica.")
    return grafo_compilado