import os
import json
import psycopg
from langgraph.checkpoint.postgres import PostgresSaver
from src.graph import build_graph
from src.database import obtener_siguiente_lote_pendiente, actualizar_estado_lote
from src.checkpoints import limpiar_checkpoint_hilo
from src.config import config

def main():
    # 🛡️ Blindaje inicial: Declarar la variable para evitar NameError en bloques de excepción
    id_msg = None
    supabase_url_conn = config.SUPABASE_DB_URL
    
    if not supabase_url_conn:
        print("❌ Error: SUPABASE_DB_URL não está configurada no ambiente.")
        return

    id_forzado = os.environ.get("ID_MENSAJE_HITL")
    
    if id_forzado:
        print(f"📌 ID forzado por variable de entorno: {id_forzado}")
        try:
            with psycopg.connect(supabase_url_conn) as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        SELECT id_mensaje, autor, canal_origen, comunidad, semana, fecha_envio,
                                fecha_extraccion, texto_original, relevancia, sentimiento,
                                temas_clave, segmento, razonamiento, decision_ia, estado_revision
                        FROM public.lotes_ia_kpis
                        WHERE id_mensaje = %s
                        LIMIT 1;
                        """,
                        (str(id_forzado),)
                    )
                    fila = cur.fetchone()
            
            if not fila:
                print(f"❌ No se encontró el lote con ID: {id_forzado}")
                return
            
            id_msg = str(fila[0])
            estado_encontrado = str(fila[14]).lower() if fila[14] else "pendiente"
            
            lote_actual = {
                "id_mensaje": id_msg,
                "autor": str(fila[1] if fila[1] else "Comunidad CloudEDTech"),
                "semana": str(fila[4] if fila[4] else "Semana_01"),
                "fecha_envio": str(fila[5]) if fila[5] else None,
                "fecha_extraccion": str(fila[6]) if fila[6] else None,
                "json_precurado": {
                    "id_mensaje": id_msg,
                    "autor": str(fila[1]),
                    "canal_origen": str(fila[2]),
                    "comunidad": str(fila[3]),
                    "semana": str(fila[4]),
                    "texto_original": str(fila[7]),
                    "relevancia": fila[8],
                    "sentimiento": str(fila[9]),
                    "temas_clave": fila[10],
                    "segmento": str(fila[11]),
                    "razonamiento": str(fila[12]),
                    "decision_ia": fila[13],
                    "estado_revision": estado_encontrado
                }
            }
            print(f"📥 Lote forzado cargado | ID: {id_msg} | Estado: {estado_encontrado.upper()}")
        except Exception as e:
            print(f"❌ Error al cargar el lote forzado {id_forzado}: {e}")
            return
    else:
        print("🔍 Consultando el siguiente lote pendiente para revisión humana (HITL)...")
        lote_actual = obtener_siguiente_lote_pendiente()

        if not lote_actual:
            print("ℹ️ No hay lotes pendientes o en proceso de revisión humana disponibles.")
            return

        id_msg = str(lote_actual["id_mensaje"])

    id_mensaje_lote = id_msg
    estado_revision_lote = lote_actual["json_precurado"].get("estado_revision", "").lower()
    thread_id = f"sesion_{id_msg}"
    configuracion_hilo = {"configurable": {"thread_id": thread_id}}

    print(f"\n==================================================")
    print(f"👤 [HITL] Lote ID: {id_msg} | Estado DB: {estado_revision_lote.upper()}")
    print(f"==================================================")

    try:
        with PostgresSaver.from_conn_string(supabase_url_conn) as checkpointer:
            checkpointer.setup()

            # Compilamos usando la fábrica con interrupción antes del publicador
            grafo_cloudedtech = build_graph(
                checkpointer=checkpointer,
                interrupt_before=["publicador"]
            )

            # 🛡️ GUARDRAIL 1: Verificar el estado real en la base de datos
            with psycopg.connect(supabase_url_conn) as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT estado_revision FROM public.lotes_ia_kpis WHERE id_mensaje = %s;", (id_msg,))
                    res = cur.fetchone()
                    estado_real = str(res[0]).lower() if res else None

            if estado_real == "desaprobado":
                print(f"⛔ OPERACIÓN ABORTADA: El lote ID: {id_msg} está marcado como 'desaprobado'.")
                limpiar_checkpoint_hilo(thread_id)
                return

            if estado_real in ["aprobado", "publicado"]:
                print(f"ℹ️ El lote ID: {id_msg} ya fue procesado y publicado previamente ({estado_real}).")
                return

            # Verificamos si ya existen borradores previos guardados en checkpoints
            estado_en_db = grafo_cloudedtech.get_state(configuracion_hilo)

            if estado_en_db and estado_en_db.values.get("copys_generados"):
                print(f"\n📋 Borradores existentes recuperados para el hilo: {thread_id}")
                print(json.dumps(estado_en_db.values.get("copys_generados"), indent=2, ensure_ascii=False))
                print(f"\n📋 Rutas activas propuestas: {estado_en_db.values.get('rutas_activas', [])}")
            else:
                print(f"\n🚀 Ejecutando grafo desde cero para generar borradores del lote ID: {id_msg}...\n")
                estado_inicial = {
                    "id_mensaje": id_msg,
                    "autor": lote_actual["autor"],
                    "semana": lote_actual["semana"],
                    "fecha_envio": lote_actual["fecha_envio"],
                    "fecha_extraccion": lote_actual["fecha_extraccion"],
                    "json_precurado": lote_actual["json_precurado"],
                    "rutas_activas": [],
                    "copys_generados": {},
                    "errores_dlq": [],
                    "estado_publicacion": "iniciado"
                }

                for evento in grafo_cloudedtech.stream(estado_inicial, configuracion_hilo):
                    print(f"  🔄 Evento procesado en nodo: {list(evento.keys())}")

                estado_en_db = grafo_cloudedtech.get_state(configuracion_hilo)
                print("\n⏸️ ¡Grafo pausado en HITL! Borradores generados:")
                print(json.dumps(estado_en_db.values.get("copys_generados", {}), indent=2, ensure_ascii=False))
            
            # 🔍 Auditoría del estado congelado antes de decidir
            estado_actual = grafo_cloudedtech.get_state(configuracion_hilo)
            print(f"\n🔍 [DEBUG CHECKPOINT] Siguiente nodo planeado (.next): {estado_actual.next}")
            print(f"🔍 [DEBUG CHECKPOINT] ¿Existen borradores guardados?: {bool(estado_actual.values.get('copys_generados'))}")
            print(f"🔍 [DEBUG CHECKPOINT] Rutas activas en espera: {estado_actual.values.get('rutas_activas', [])}")
            
            # Decisión humana: prioriza variable de entorno (deploy/CI), fallback a input() (local)
            print("\n--------------------------------------------------")
            decision_env = os.environ.get("HITL_DECISION", "").strip().lower()
            if decision_env in ("s", "si", "y", "yes", "aprobar", "approve"):
                decision = "s"
                print(f"📌 Decisión tomada desde variable de entorno HITL_DECISION={decision_env}")
            elif decision_env in ("n", "no", "desaprobar", "reject"):
                decision = "n"
                print(f"📌 Decisión tomada desde variable de entorno HITL_DECISION={decision_env}")
            else:
                decision = input("¿Deseas APROBAR y PUBLICAR este lote? (s/n): ").strip().lower()
            print("--------------------------------------------------")

            if decision == "s":
                print(f"\n🚀 Reanudando ejecución y disparando Publicador Universal para el hilo {thread_id}...")
                
                # Verificamos el estado antes del stream
                estado_previo = grafo_cloudedtech.get_state(configuracion_hilo)
                print(f"📌 [Pre-Stream] Siguiente nodo en la fila: {estado_previo.next}")
                
                publicador_ejecutado = False
                
                # Intentamos reanudar el grafo normalmente si hay nodos pendientes
                if estado_previo.next:
                    for evento in grafo_cloudedtech.stream(None, configuracion_hilo):
                        nodos_en_evento = list(evento.keys())
                        print(f"  🔄 Evento reanudado en nodo(s): {nodos_en_evento}")
                        if "publicador" in nodos_en_evento:
                            publicador_ejecutado = True
                else:
                    print("ℹ️ El grafo ya no tiene nodos pendientes en la cola (.next está vacío). Ejecutando Publicador Universal directamente...")
                    
                    # 🛡️ Respaldo directo: Si el grafo ya cerró su ciclo, invocamos el publicador y guardamos en BD
                    from src.publishers import enviar_webhook_discord, enviar_tweet_x, enviar_linkedin
                    
                    copys = estado_previo.values.get("copys_generados", {})
                    rutas = estado_previo.values.get("rutas_activas", [])
                    autor = estado_previo.values.get("autor", "Comunidad CloudEDTech")
                    datos_originales = estado_previo.values.get("json_precurado", {})
                    
                    if not rutas and copys:
                        rutas = list(copys.keys())
                        
                    exito_total = True
                    if "discord" in rutas or "reclamos" in rutas:
                        if not enviar_webhook_discord(copys, autor=autor, texto_original=datos_originales.get("texto_original", "")):
                            exito_total = False
                    if "x" in rutas:
                        if not enviar_tweet_x(copys):
                            exito_total = False
                    if "linkedin" in rutas:
                        if not enviar_linkedin(copys):
                            exito_total = False
                            
                    if exito_total:
                        actualizar_estado_lote(id_msg, "aprobado")
                        publicador_ejecutado = True

                # Validación final
                if publicador_ejecutado:
                    print(f"\n🎉 ¡Lote ID: {id_msg} procesado, publicado en redes y aprobado con éxito en Supabase!")
                else:
                    print(f"\n⚠️ Advertencia: El proceso de publicación no pudo completarse correctamente.")
            else:
                print(f"\n🚫 Desaprobando lote ID: {id_msg} por decisión del operador...")
                actualizar_estado_lote(id_msg, "desaprobado")
                limpiar_checkpoint_hilo(thread_id)
                print("✅ Lote descartado y checkpoints limpios.")
                
    except Exception as e:
        print(f"❌ Error crítico durante la gestión HITL para el lote {id_msg}: {e}")

if __name__ == "__main__":
    main()