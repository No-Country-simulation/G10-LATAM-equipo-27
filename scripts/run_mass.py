import os
import asyncio
import psycopg
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from src.graph import build_graph
from src.database import actualizar_estado_lote, obtener_lotes_pendientes_masivos
from src.config import config

async def ejecutar_bucle_masivo_hibrido_asincrono(grafo_compilado, limite_lotes: int = 5):
    """
    Pipeline masivo asíncrono (relevancia < 35).
    Espaciado de 0.5 s entre cada lote para respetar rate limits de Gemma.
    """
    lotes = obtener_lotes_pendientes_masivos(limite=limite_lotes)

    if not lotes:
        print("ℹ️ No hay registros pendientes (relevancia < 35) para procesar.")
        return {"status": "vacio", "procesados": 0}

    print(f"🚀 Iniciando bucle masivo híbrido asíncrono para {len(lotes)} lotes...\n")
    procesados_ok = 0
    procesados_error = 0

    for idx, lote in enumerate(lotes, 1):
        id_msg = lote["id_mensaje"]
        estado_rev = str(lote["json_precurado"].get("estado_revision", "pendiente")).lower()
        relevancia = int(lote["json_precurado"].get("relevancia", 0) or 0)
        configuracion_hilo = {"configurable": {"thread_id": f"sesion_{id_msg}"}}

        print(f"\n==================================================")
        print(f"📦 [Lote {idx}/{len(lotes)}] ID: {id_msg} | Relevancia: {relevancia} | Estado: {estado_rev.upper()}")
        print(f"==================================================")

        estado_inicial = {
            "id_mensaje": id_msg,
            "autor": lote["autor"],
            "semana": lote["semana"],
            "fecha_envio": lote["fecha_envio"],
            "fecha_extraccion": lote["fecha_extraccion"],
            "json_precurado": lote["json_precurado"],
            "rutas_activas": [],
            "copys_generados": {},
            "errores_dlq": [],
            "estado_publicacion": "iniciado",
        }

        try:
            async for evento in grafo_compilado.astream(estado_inicial, configuracion_hilo):
                print(f"  🔄 Evento completado en nodo: {list(evento.keys())}")

            print(f"⚡ [Automatizado] Lote ID: {id_msg} procesado.")
            procesados_ok += 1

        except Exception as e:
            print(f"❌ Error crítico procesando el lote {id_msg}: {e}")
            try:
                with psycopg.connect(config.SUPABASE_DB_URL) as conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            "SELECT estado_revision FROM public.lotes_ia_kpis WHERE id_mensaje = %s;",
                            (str(id_msg),),
                        )
                        row = cur.fetchone()
                        estado_actual = str(row[0]).lower() if row else None
            except Exception:
                estado_actual = None

            if estado_actual not in ("desaprobado", "aprobado", "procesado"):
                actualizar_estado_lote(id_msg, "rechazado")
            else:
                print(f"ℹ️ Se conserva estado actual '{estado_actual}' (no se sobrescribe).")
            procesados_error += 1

        if idx < len(lotes):
            print(f"⏳ Pausa de 0.5 s antes del siguiente lote...")
            await asyncio.sleep(0.5)

    resumen = {
        "status": "exito" if procesados_error == 0 else "parcial",
        "procesados": procesados_ok,
        "errores": procesados_error,
        "total": len(lotes),
    }
    print(f"\n📊 Resumen masivo → OK: {procesados_ok} | Errores: {procesados_error} | Total: {len(lotes)}")
    return resumen

async def main():
    limite = int(os.environ.get("LIMITE_LOTES_MASIVOS", 5))
    supabase_url_conn = config.SUPABASE_DB_URL
    
    if not supabase_url_conn:
        print("❌ Error: SUPABASE_DB_URL no está configurada.")
        return

    print("🚀 Inicializando motor masivo asíncrono con AsyncPostgresSaver...")
    async with AsyncPostgresSaver.from_conn_string(supabase_url_conn) as checkpointer_async:
        await checkpointer_async.setup()

        # Compilamos el grafo utilizando la fábrica y pasando el checkpointer asíncrono
        grafo_compilado = build_graph(
            checkpointer=checkpointer_async,
            interrupt_before=[] # No se necesita HITL en el flujo masivo
        )

        await ejecutar_bucle_masivo_hibrido_asincrono(grafo_compilado, limite_lotes=limite)

if __name__ == "__main__":
    import sys

    # Ajuste para compatibilidad con psycopg asíncrono en Windows
    if sys.platform == "win32":
        import selectors
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

    asyncio.run(main())