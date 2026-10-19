import os
import psycopg
from src.config import config

def limpiar_checkpoint_hilo(thread_id: str) -> bool:
    """
    🛠️ UTILIDAD DE LIMPIEZA / PARCHE DE EMERGENCIA:
    Elimina todos los registros de los checkpoints de LangGraph asociados a un thread_id específico
    en Supabase para resetear el estado 'fantasma' y permitir un arranque fresco tras desaprobar.
    """
    supabase_url_conn = config.SUPABASE_DB_URL
    if not supabase_url_conn:
        print("❌ Error: La variable de entorno SUPABASE_DB_URL no está configurada.")
        return False

    try:
        with psycopg.connect(supabase_url_conn) as conn:
            with conn.cursor() as cur:
                print(f"🧹 Limpiando checkpoints de LangGraph para el hilo: {thread_id}...")

                # Eliminación en el orden correcto por restricciones de llaves foráneas
                cur.execute("DELETE FROM public.checkpoint_writes WHERE thread_id = %s;", (thread_id,))
                cur.execute("DELETE FROM public.checkpoint_blobs WHERE thread_id = %s;", (thread_id,))
                cur.execute("DELETE FROM public.checkpoints WHERE thread_id = %s;", (thread_id,))

                conn.commit()

        print(f"✅ ¡Checkpoints del hilo '{thread_id}' eliminados exitosamente de Supabase!")
        return True

    except Exception as e:
        print(f"❌ Error al limpiar los checkpoints del hilo en Supabase: {e}")
        return False

def limpiar_todos_los_checkpoints() -> bool:
    """
    ⚠️ ADVERTENCIA / PELIGRO: Reseteo Global.
    Elimina TODOS los checkpoints de LangGraph en Supabase de forma masiva.
    NUNCA debe invocarse de forma automática al arrancar scripts normales ni al importar el paquete.
    Uso exclusivo manual y de emergencia para entornos de prueba limpios.
    """
        # Protección de seguridad para evitar borrados accidentales en deploy/CI
    if os.environ.get("ALLOW_GLOBAL_CHECKPOINT_CLEAN", "false").lower() != "true":
        print("🚫 Operación bloqueada. Para ejecutar el borrado global define ALLOW_GLOBAL_CHECKPOINT_CLEAN=true")
        return False
    
    supabase_url_conn = config.SUPABASE_DB_URL
    if not supabase_url_conn:
        print("❌ Error: La variable de entorno SUPABASE_DB_URL no está configurada.")
        return False

    try:
        with psycopg.connect(supabase_url_conn) as conn:
            with conn.cursor() as cur:
                print("🚨 [PELIGRO] Vaciando TODAS las tablas de checkpoints en Supabase globalmente...")
                
                # El orden es crítico por las restricciones de llaves foráneas
                cur.execute("DELETE FROM public.checkpoint_writes;")
                cur.execute("DELETE FROM public.checkpoint_blobs;")
                cur.execute("DELETE FROM public.checkpoints;")
                conn.commit()

        print("✅ ¡Ecosistema de checkpoints limpio globalmente! (Operación peligrosa ejecutada con éxito).")
        return True

    except Exception as e:
        print(f"❌ Error al limpiar los checkpoints globalmente: {e}")
        return False