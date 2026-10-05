# MEMORY.md — Análisis de Comunidad con IA (Código Unificado)
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- El proyecto se ha transformado en una aplicación web interactiva con **Streamlit (`app.py`)** para unificar el flujo de trabajo entre los equipos de frontend y copywriting.
- La extracción de Discord (`bot_lote.py`) ya no depende de Google Colab y se integra directamente al panel de control ejecutándose mediante subprocess para evitar choques con el event loop asíncrono.
- La ejecución del cerebro ahora es dinámica a través de un selector visual en la interfaz.
- Sección 4 de `app.py` + `anuncios_discord.py`: subir .txt/.md → Gemma 4 lo reescribe con el Manual de Marca → editar → publicar vía webhook (`DISCORD_WEBHOOK_ANUNCIOS`).

## Decisiones (y por qué)
- Se desarrolló un panel de Streamlit para proveer una UI funcional e inmediata, permitiendo al equipo consumir JSONs (frontend) y validar los copies generados (copywriter) sin lidiar con Jupyter Notebooks.
- `bot_lote.py` se ejecuta mediante `subprocess.run` desde Streamlit para aislar su loop de eventos (`asyncio`) propio del de la aplicación principal.

## Decisiones extra
- Anuncios: reglas del Manual de Marca incrustadas en el prompt (sin RAG); webhook con `urllib` para no añadir dependencias; menciones (@everyone) bloqueadas.

## Próximos pasos
- [ ] Probar anuncios con la GOOGLE_API_KEY real y el webhook del servidor de pruebas.
- [ ] Validar con el equipo de Frontend si el formato JSON consumido vía Streamlit es suficiente o si se requiere levantar un servidor FastAPI en el futuro.
- [ ] Validar con el Copywriter la visualización en columnas para la aprobación/descarte de mensajes.
