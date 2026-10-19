# Informe Detallado de Archivos – Mototradis MVP

Documento de entrega que describe cada archivo del proyecto, su propósito, funciones principales y rol dentro del pipeline.

---

## 1. Raíz del proyecto

### `.env.example`
- **Uso:** Plantilla de variables de entorno.
- **Función:** Documenta todas las claves necesarias (Supabase, Groq, Gemini, LinkedIn, Discord, X, LangSmith) sin exponer secretos.
- **Importancia:** Permite que cualquier miembro del equipo configure su entorno local de forma segura.

### `.gitignore`
- **Uso:** Excluye del repositorio archivos sensibles y artefactos.
- **Contenido típico:** `.env`, `__pycache__/`, `.venv/`, archivos de IDE, logs, etc.

### `requirements.txt`
- **Uso:** Lista de dependencias Python del proyecto.
- **Incluye:** `google-genai`, ecosistema LangGraph/LangChain, `psycopg`, `tweepy`, `pydantic`, `python-dotenv`, entre otros.

---

## 2. Carpeta `docs/`

### `docs/constitution.md`
- Principios de trabajo del equipo y del proyecto (decisiones de arquitectura, estándares, etc.).

### `docs/contrato-pipeline.md`
- Contrato técnico del pipeline: entradas/salidas esperadas, estados de lote, puntos de integración con otros sistemas del monorepo.

---

## 3. Carpeta `src/` – Núcleo de negocio

### `src/__init__.py`
- **Uso:** Marca `src` como paquete Python.
- **Contenido:** Versión del MVP (`__version__`), docstring del paquete y exportación de `config`.
- **Función:** Facilita imports limpios (`from src import config`).

### `src/config.py`
- **Uso:** Gestión centralizada de configuración.
- **Funciones principales:**
  - Carga robusta del `.env` con ruta absoluta.
  - Clase `Config` con todas las variables tipadas.
  - `validar_configuracion()` → falla rápido si faltan claves críticas.
  - `validar_opcionales()` → emite warnings si faltan credenciales de redes.
- **Rol:** Reemplazo total de `google.colab.userdata`.

### `src/schemas.py`
- **Uso:** Definición de contratos de datos.
- **Contiene:**
  - `AgentState` (estado del grafo LangGraph con reducers).
  - Modelos Pydantic de salida para LinkedIn, X, Discord, PQRS y automatización Gemma.
- **Rol:** Garantiza estructura consistente de los copys generados por los LLMs.

### `src/database.py`
- **Uso:** Capa de acceso a Supabase (tabla `lotes_ia_kpis`).
- **Funciones:**
  - `actualizar_estado_lote(id, estado)` → cambia `estado_revision`.
  - `obtener_siguiente_lote_pendiente()` → cola prioritaria (≥ 35 relevancia) para HITL.
  - `obtener_lotes_pendientes_masivos(limite)` → cola ascendente (< 35) para Gemma.
- **Detalles:** Usa `connect_timeout=10` y corrige el nombre de columna `comunidad`.

### `src/checkpoints.py`
- **Uso:** Utilidades de mantenimiento de checkpoints de LangGraph.
- **Funciones:**
  - `limpiar_checkpoint_hilo(thread_id)` → borra un hilo concreto.
  - `limpiar_todos_los_checkpoints()` → borrado global protegido por variable de entorno `ALLOW_GLOBAL_CHECKPOINT_CLEAN=true`.
- **Rol:** Evita estados “fantasma” tras desaprobar o reiniciar pruebas.

### `src/publishers.py`
- **Uso:** Publicación real en redes sociales.
- **Funciones:**
  - `enviar_webhook_discord(...)` → Discord (general, faq, notificaciones, pqrs) con citación del mensaje original.
  - `enviar_tweet_x(...)` → X/Twitter v2 vía tweepy (con truncado a 280 caracteres).
  - `enviar_linkedin(...)` → LinkedIn UGC API.
- **Extras:** Decorador `retry_with_backoff` ante rate-limits; validación de webhooks vacíos.

### `src/gemma.py`
- **Uso:** Integración con Gemma 4 (Google GenAI).
- **Contiene:**
  - Cliente `genai_client` con validación de API Key.
  - `PROMPT_GEMMA_BAJA_RELEVANCIA` (prompt estructurado + few-shot).
  - `generar_con_gemma_resiliente()` → streaming + fallback 26B → 31B + backoff.
  - `extraer_json_seguro()` → parseo robusto con `json_repair`.
- **Rol:** Motor de respuesta automática para mensajes de baja relevancia.

### `src/nodes.py`
- **Uso:** Implementación de todos los nodos del grafo.
- **Nodos principales:**
  - `nodo_orquestador` → matriz de 4 prioridades + few-shot de alta relevancia.
  - `nodo_linkedin`, `nodo_x`, `nodo_discord`, `nodo_reclamos` → generación de copys.
  - `nodo_validador` → auditoría de tono y Manual de Marca.
  - `nodo_gemma_automatico` (async) → usa el prompt de `gemma.py` y publica directo.
  - `nodo_publicador` → orquesta las llamadas a `publishers.py` y registra en historial.
- **Rol:** Corazón de la lógica de negocio migrada del notebook.

### `src/graph.py`
- **Uso:** Ensamblaje del StateGraph de LangGraph.
- **Función principal:** `build_graph(checkpointer, interrupt_before)` (patrón fábrica).
- **Topología:**
  - START → orquestador
  - Fan-out a linkedin / x / discord / reclamos / gemma_automatico
  - Canales supervisados → validador → publicador → END
  - Rama Gemma → END (sin HITL)
- **Rol:** Permite inyectar distintos checkpointers (Memory, Postgres sync/async).

---

## 4. Carpeta `scripts/` – Puntos de entrada

### `scripts/run_hitl.py`
- **Uso:** Ejecución del flujo uno-a-uno con revisión humana.
- **Características:**
  - Carga el siguiente lote prioritario o un ID forzado (`ID_MENSAJE_HITL`).
  - Compila el grafo con `interrupt_before=["publicador"]`.
  - Muestra borradores, permite aprobar/rechazar por consola o por variable `HITL_DECISION`.
  - Publica y actualiza estado en Supabase.
- **Ideal para:** Demostraciones controladas y curación manual.

### `scripts/run_mass.py`
- **Uso:** Procesamiento masivo autónomo de mensajes de baja relevancia.
- **Características:**
  - Usa `AsyncPostgresSaver` + `astream`.
  - Llama a `obtener_lotes_pendientes_masivos`.
  - No aplica HITL (la rama Gemma termina en END).
- **Ideal para:** Vaciar cola de mensajes menores de forma automática.

### `scripts/reset_thread.py`
- **Uso:** Utilidad de limpieza de un hilo de checkpoint concreto.
- **Función:** Facilita reinicios limpios durante pruebas.

---

## 5. Resumen de responsabilidades por capa

| Capa | Archivos | Responsabilidad |
|------|----------|-----------------|
| Configuración | `config.py`, `.env.example` | Secretos y validación de entorno |
| Datos | `database.py`, `checkpoints.py` | Persistencia y estados |
| Contratos | `schemas.py` | Estructura de datos y estado del grafo |
| IA / Generación | `gemma.py`, `nodes.py` | Orquestación y generación de contenido |
| Publicación | `publishers.py` | APIs externas (Discord, X, LinkedIn) |
| Ensamblaje | `graph.py` | Topología LangGraph |
| Ejecución | `run_hitl.py`, `run_mass.py` | Entry-points operativos |

---

## 6. Fidelidad al notebook original

El código mantiene:
- Matriz de prioridades de relevancia.
- Esquemas Pydantic de copywriting.
- Flujo HITL con pausa antes de publicar.
- Rama autónoma de Gemma para baja relevancia.
- Publicación real en las tres redes + registro en historial.

Las adaptaciones realizadas (modularización, `config`, resiliencia, validaciones) no alteran la lógica de negocio; solo la preparan para entorno local y pipeline de deploy.

---

**Documento generado para entrega del MVP Mototradis – Equipo 27.**
