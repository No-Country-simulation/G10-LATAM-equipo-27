# MEMORY.md - Análisis de Comunidad con IA (Código Unificado)
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- Aplicación web interactiva con **Streamlit (`app.py`)** para unificar el flujo de trabajo entre los equipos de frontend y copywriting.
- La extracción de Discord (`bot_lote.py`) es independiente de Colab. 
- **Nuevo:** Integración exitosa del código de ingesta de Eduardo (Pull Request fusionado). Ahora el motor extrae el historial completo sin límite de mensajes, y guarda las fechas reales de Discord (`enviado_en`) en UTC.
- Base de datos local reconstruida con el nuevo esquema de fechas.
- Sección 4 de `app.py` + `anuncios_discord.py`: subir .txt/.md → Gemma 4 lo reescribe con el Manual de Marca → editar → publicar vía webhook (`DISCORD_WEBHOOK_ANUNCIOS`).

## Decisiones (y por qué)
- **Despliegue a Producción:** Se subió la app a Streamlit Cloud inyectando el `.env` como Secretos, permitiendo acceso web a todo el equipo.
- **Retrocompatibilidad:** La interfaz llama a `obtener_json()` sin argumentos para no romper el flujo existente, aunque el motor ahora soporta filtros por fecha.
- **Aislamiento Asíncrono:** `bot_lote.py` se ejecuta mediante `sys.executable` y `subprocess.run` desde Streamlit para aislar su loop de eventos (`asyncio`) y funcionar correctamente en la nube.

## Decisiones extra
- Anuncios: reglas del Manual de Marca incrustadas en el prompt (sin RAG); webhook con `urllib` para no añadir dependencias; menciones (@everyone) bloqueadas.

## Próximos pasos
- [x] Aprovechar el nuevo parámetro `desde` y `hasta` en `obtener_json()` para añadir un selector de fechas visual en la pantalla de Streamlit. (Implementado vía flujo SDD)
- [x] Levantar un servidor FastAPI (`api.py`) para consumir el JSON desde el Frontend (Integración Iterativa).
- [ ] Probar anuncios con la GOOGLE_API_KEY real y el webhook del servidor de pruebas.
