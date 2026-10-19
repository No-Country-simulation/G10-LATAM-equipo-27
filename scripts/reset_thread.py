from src.checkpoints import limpiar_checkpoint_hilo

# Limpia los checkpoints asociados al hilo trabado
thread_id = "sesion_76"
limpiar_checkpoint_hilo(thread_id)
print(f"✅ Checkpoints eliminados para el hilo: {thread_id}")