# AGENTS.md — Análisis de Comunidad con IA (Código Unificado)
Proyecto en Python para evaluar, mediante inteligencia artificial (Groq/Gemini), mensajes de una comunidad, extrayendo KPIs como relevancia y sentimiento, diseñado originalmente en Google Colab y ahora migrado a entorno local.

## Stack y estructura
- Python 3.
- `langchain`, `langchain-groq`, `langchain-google-genai`, `pydantic`.
- Jupyter Notebook (`Codigo_con_imports.ipynb`) como orquestador principal.
- `cerebro_ia*.py`: Módulos de conexión con distintos modelos LLM (Groq, Gemma, Gemini).
- `base_datos.py`, `modelos.py`: Conexión y gestión de la base de datos SQLite (`communitylab.db`).
- `procesamiento.py`, `limpieza.py`: Limpieza y preparación de datos.
- `ver_json.py`: Carga y lectura de datos fuente.

## Comandos
- **Instalación de dependencias**: `pip install -r requirements.txt`
- **Ejecución local (UI)**: `streamlit run app.py`
- **Ejecución local (API/Backend)**: `uvicorn api:app --reload`

## Convenciones
- Nomenclatura en español para variables y funciones (`resultados_destacados`, `paquete_maestro`, etc.).
- Uso de `pydantic` para validación y estructuración de respuestas de la IA.
- Separación de responsabilidades en distintos archivos `.py` invocados por el script/notebook principal.

## Reglas de dominio / trampas conocidas
- **Gestión de variables de entorno**: El código actual hace uso de `google.colab.userdata` que no funcionará en local. Es crucial reemplazar estas llamadas por `os.environ.get()` y `dotenv` antes de cualquier ejecución local.
- **Límites de APIs**: Considerar los rate limits descritos en el código (Groq vs Gemini) al ejecutar lotes grandes de mensajes.

## Forma de trabajar
- Haz solo lo que se pide: no añadas funcionalidades por tu cuenta.
- Cambios pequeños y enfocados; no reescribas lo que ya funciona.
- Al terminar, resume qué has cambiado y cualquier decisión que deba revisar.
- **Gestión de dependencias**: Siempre que agregues o elimines el uso de alguna librería, actualiza INMEDIATAMENTE el archivo `requirements.txt` para que solo contenga los paquetes estrictamente necesarios.

## Memoria
- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales).

## Límites
- ✅ Siempre: respetar la arquitectura definida y actualizar `MEMORY.md` al terminar cada tarea.
- ⚠️ Pregunta antes: crear archivos nuevos, instalar dependencias nuevas, cambiar el formato de los datos o arquitectura principal.
- 🚫 Nunca: saltarse el stack tecnológico definido o introducir herramientas no solicitadas.

## Verificación
- Ejecutar el script principal o notebook verificando que se generen correctamente el archivo `resultados_kpis.json` sin errores de importación ni fallos en la conexión a la API.
