# 📋 Informe de Sprint Review — Reunión 4

## ℹ️ Información General
* **Fecha y duración:** Jueves, 24 de septiembre de 2026 | ~1 hora y 30 minutos.
* **Próxima sesión:** Sábado, 26 de septiembre de 2026 (hora tentativa a definir entre las 11:00 AM y las 12:00 MD, hora base GMT-6).
* **Proyecto y equipo:** Simulación No Country — Equipo G10-LATAM-27 · CommunityLab.
* **Fase actual:** Cierre formal de la Etapa 1 (Ingesta y Cimentación) y consolidación técnica de la Etapa 2 (Cerebro Analítico, Orquestación e Integración OCI).
* **Objetivo principal:** Evaluar el avance de los módulos del MVP (frontend, bots de extracción, procesamiento analítico y backend), resolver los bloqueos críticos heredados de la Reunión 3 (expiración de cuentas de n8n vs. estandarización de stack), definir la arquitectura de conexión hacia OCI Object Storage y formalizar la asignación de roles bajo el marco de trabajo Scrum.

## 📌 Resumen Ejecutivo
El equipo consolidó los componentes individuales del pipeline, tomando la decisión técnica de descartar n8n y unificar todo el flujo de ingesta y análisis en scripts/APIs desacopladas en Python, resolviendo el riesgo de costos y expiración de pruebas. Se priorizó un flujo base end-to-end funcional (extracción en Discord, curaduría, copywriting y almacenamiento en OCI Object Storage) antes de incorporar la lógica avanzada de interfaz y analítica.

## 💬 Temas Clave y Discusiones
* 💻 **Evolución y simplificación del Frontend (Next.js):** Andrés Martínez presentó los avances en la interfaz, integrando vistas de métricas, análisis de sentimiento, aprobaciones, auditoría y control de acceso (login, roles para administradores, analistas y community managers). Se debatió mantener la UI centrada en las operaciones del Community Manager y la visualización gerencial, simplificando vistas para no sobrecargar el MVP antes de validar la conexión con los endpoints reales.
* 🐍 **Resolución de ingesta y descarte formal de n8n:** Frente al bloqueo identificado en la Reunión 3 sobre la caducidad del plan gratuito de n8n y la inviabilidad de asumir costos mensuales recurrentes, se presentaron alternativas funcionales en Python puro. Eduardo Alonso y Cristian Astudillo demostraron la captura de mensajes hacia payloads JSON directamente consumibles mediante APIs internas, resolviendo el cuello de botella de orquestación.
* 🧠 **Maduración del "Cerebro" de IA y scoring de relevancia:** Se exhibió el progreso del componente analítico (previamente migrado a Groq y evaluando Gemini/Gemma). El motor ahora segmenta mensajes destacados y descartados con base en umbrales de relevancia (70% - 75%), analizando sentimiento y generando borradores de copy. Adicionalmente, Fernando integró un mecanismo de priorización preliminar basado en métricas de interacción social (reacciones y respuestas de Discord) para optimizar el consumo de recursos de cómputo y tokens de inferencia.
* ☁️ **Estrategia de persistencia en Oracle Cloud Infrastructure (OCI):** Con la incorporación de Cristian Astudillo, se definió la subida de artefactos a OCI Object Storage bajo el esquema *Always Free*. Se determinó almacenar tanto los registros estructurados crudos/procesados (archivos JSON) como los reportes semanales formales consolidados y textos de copywriting finalizados.
* 👥 **Reorganización de células bajo Scrum:** Para resolver la falta de asignaciones puntuales detectada en la sesión anterior y garantizar que todo el equipo (incluyendo a integrantes que se incorporaron formalmente como Tania Orantes, Cristian Astudillo y Francisco Villaverde) tenga frentes claros, se acordó estructurar las tareas en cuatro células funcionales transversales.

## 🤝 Acuerdos y Decisiones
* ⚙️ **Adopción exclusiva de Python:** Queda oficialmente descartado n8n en el pipeline de producción para mitigar costos y problemas de despliegue; la totalidad del flujo de backend e ingesta se desarrollará en Python.
* 📥 **Canal primario de entrada:** La captura se mantendrá estrictamente concentrada en Discord para cerrar el flujo inicial de punta a punta, posponiendo la expansión a otras redes para fases posteriores.
* 🎯 **Flujo MVP prioritario:** Se establece una ruta crítica de integración básica que cubre: ingesta bruta de mensajes -> filtrado/curaduría -> generación de copies -> persistencia de reportes/JSON en OCI Object Storage.
* 🗄️ **Persistencia histórica completa:** Se ratificó el almacenamiento tanto de los mensajes que alcanzaron el umbral de relevancia como de los descartados, garantizando trazabilidad y auditoría de decisiones del modelo.
* 📅 **Definición de próxima reunión:** La siguiente sesión de sincronización técnica quedó acordada para el sábado 26 de septiembre, quedando pendiente votar la hora definitiva entre las 11:00 AM y las 12:00 MD (GMT-6).

## 🚀 Plan de Acción / Tareas Pendientes

| Tarea / Acción a realizar | Responsable | Contexto o detalles clave |
| :--- | :--- | :--- |
| Finalización del backend base y endpoints de autenticación | Andrés Martínez | Implementar almacenamiento de usuarios y seguridad en base de datos relacional (SQL) y exponer la API para vincular la UI. |
| Pipeline de ingesta y API de Discord en Python | Cristian Astudillo / Eduardo Alonso | Consolidar la extracción de mensajes en Python, formateo a JSON y generación de URL/payload para el consumo de la IA. |
| Algoritmo de filtrado y scoring por interacciones | Fernando Frausto | Calibrar el balance entre volumen de reacciones en Discord y el umbral de relevancia (70-75%) en el motor de IA. |
| Integración de guardado en OCI Object Storage | Cristian Astudillo | Configurar el bucket *Always Free*, implementar la subida de artefactos (JSON y reportes formateados) y documentar endpoints de salida. |
| Adaptación del flujo de copywriting y tono de marca | Enoc Ramírez | Continuar el modelado del tono/voz empresarial para los mensajes aprobados, alineando la salida de los copys al JSON unificado. |
| Detección de temas clave y métricas de segmentación | Samuel / Por confirmar | Completar la clasificación de temas dentro del flujo analítico que alimenta el panel de curaduría. |
| Distribución formal en las 4 células Scrum | Todo el equipo (liderado por referentes técnicos) | Asignar roles operativos específicos a los integrantes restantes (Tania Orantes, Francisco Villaverde, Eduardo Gracia, Miguel Sierra, Patricia Madrid) en: Ingesta, Curaduría, Copywriting o Infraestructura OCI. |
