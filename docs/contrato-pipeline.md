# Contrato Técnico del Pipeline - Módulo Mototradis (NoCountry / CloudEDTech)

## 1. Entrada de Datos (Expectativa desde Ingeta / Supabase)
* **Tabla de Origen:** `public.lotes_ia_kpis`
* **Campos Mínimos Requeridos:**
  - `id_mensaje`: Identificador único del mensaje de la comunidad.
  - `estado_revision`: Estado actual del ciclo de vida (`pendiente`, `rechazado`, `procesado`).
  - `relevancia`: Valor numérico (0 a 100) que determina la ruta de atención.
  - `texto_original`: Contenido aportado por el usuario.
  - `sentimiento`: Clasificación emocional (`Positivo`, `Negativo`, `Neutro`).
  - `decision_ia`: Metadatos previos del clasificador inicial.
  - `autor`: Nombre o usuario del emisor del mensaje.
  - `fecha_envio`, `fecha_extraccion`: Marcas temporales de origen.
  - `semana`: Identificador temporal (`Semana_01`, `Semana_02`, etc.).
  - `canal_origen`, `comunidad`, `temas_clave`, `segmento`, `razonamiento`.
* **Estados de Lectura Válidos:**
  - `pendiente`: Registros nuevos listos para ser evaluados.
  - `rechazado`: Registros devueltos para reevaluación.
  - `procesado`: Registros cuyos borradores ya fueron generados y pausados en los checkpoints a la espera de reanudación humana (HITL).

## 2. Proceso Interno y Umbrales de Relevancia
* **Relevancia ≤ 10 o Spam técnico/Inyección SQL:** Descarte automático inmediato.
* **Relevancia 11 – 34 (Baja relevancia):** Procesamiento masivo autónomo de forma ASCENDENTE (`ORDER BY relevancia ASC`) mediante Gemma 4 (`run_mass.py` y nodo `gemma_automatico`).
* **Relevancia 35 – 69 (Media relevancia):** Canalización hacia Discord con pausa para revisión humana (**HITL**).
* **Relevancia ≥ 70 (Alta relevancia):** Flujo multicanal (LinkedIn, X, Discord) con pausa obligatoria en el nodo publicador (`interrupt_before=["publicador"]`).

## 3. Matriz de Responsabilidades y Escritura de Estados (`estado_revision`)
Cada componente del sistema tiene asignada la responsabilidad estricta de actualizar los estados en Supabase:
* **`procesado`**: Escrito por `database.py` (`obtener_siguiente_lote_pendiente`) al tomar un lote pendiente/rechazado para iniciar el grafo, o por el nodo validador al dejar los borradores listos en los checkpoints antes del punto de interrupción HITL.
* **`aprobado`**: Escrito por el publicador (`publishers.py` / `nodes.py`) cuando todas las APIs externas y webhooks responden con éxito (`200 OK` / `204`).
* **`desaprobado`**: Escrito por el orquestador o por el nodo de Gemma cuando se detecta spam, baja relevancia extrema, o cuando el operador ejecuta manualmente la invalidación del lote.
* **`rechazado`**: Escrito por los bloques de excepción de los scripts de ejecución masiva u operativa cuando ocurre un fallo transitorio de API externa que requiere devolver el lote a la cola de revisión.

## 4. Registro Histórico y Side Effects (Salidas)
* **Escritura en `public.historial_reportes_semanales`:** 
  - Realizada de forma exclusiva por el `nodo_publicador` al completarse una publicación exitosa.
  - Almacena: `id_mensaje`, `autor`, `semana`, `fecha_envio`, `fecha_extraccion`, `fecha_publicacion (NOW())`, `rutas_activas`, `estado ('publicado')`, `contenido_original (JSON)`, `cw_modelo_ia` y `copys_generados (JSON)`.
* **Side Effects (APIs Externas y Webhooks):**
  - **Discord:** Peticiones HTTP POST a los Webhooks configurados (`DISCORD_WEBHOOK_GENERAL`, `DISCORD_WEBHOOK_FAQ`, `DISCORD_WEBHOOK_NOTIFICACIONES`, `DISCORD_WEBHOOK_PQRS`) incluyendo citación en bloque del mensaje original.
  - **X (Twitter):** Publicación mediante `tweepy.Client` (Twitter API v2).
  - **LinkedIn:** Publicación mediante peticiones HTTP POST a la API corporativa de LinkedIn UGC Posts (`/v2/ugcPosts`).

## 5. Arquitectura de Checkpoints de LangGraph
Para garantizar la persistencia de los estados y la funcionalidad de pausa/reanudación (HITL), se utiliza PostgresSaver con las siguientes especificaciones:
* **Identificador de Hilo (`thread_id`):** `sesion_{id_mensaje}` (ej. `sesion_34`).
* **Tablas de Supabase Requeridas para Checkpoints:**
  - `public.checkpoints`
  - `public.checkpoint_blobs`
  - `public.checkpoint_writes`