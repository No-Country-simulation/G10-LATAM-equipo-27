# 📋 Informe de Sprint Review — Reunión 5

## ℹ️ Información General
* **Fecha:** Lunes, 28 de septiembre de 2026.
* **Próxima sesión:** Jueves, 1 de octubre de 2026.
* **Proyecto y equipo:** Simulación No Country — Equipo CommunityLab[cite: 2].
* **Fase actual:** Consolidación de la Etapa 2 (Unificación de Ingesta y Cerebro IA) y modelado de negocio[cite: 2].
* **Objetivo principal:** Unificar los scripts de extracción y curaduría en un flujo continuo, definir la identidad corporativa del cliente final para alinear el análisis de IA, planificar la migración del modelo fundacional para optimizar recursos, y establecer la arquitectura de persistencia en Oracle Cloud Infrastructure (OCI)[cite: 2].

## 📌 Resumen Ejecutivo
En este sprint, el equipo logró un hito fundamental: la integración exitosa del motor de captura de datos con el cerebro de Inteligencia Artificial, permitiendo un procesamiento automatizado y modular que ya genera resultados tangibles[cite: 2]. Se definió la identidad de nuestro cliente objetivo ("Cloud Detech", del sector EdTech), lo que nos permite afinar el tono de voz corporativo del producto[cite: 2]. Además, se establecieron las bases para optimizar los costos operativos utilizando modelos de IA de última generación y se delegó la construcción del puente final de almacenamiento seguro en la nube[cite: 2]. El proyecto avanza sólidamente hacia un MVP completamente funcional.

## 💬 Temas Clave y Discusiones
* 🏢 **Definición de Identidad de Negocio ("Cloud Detech"):** Para garantizar que el análisis de la IA y el Copywriting tengan un objetivo comercial claro, se estableció que la solución servirá a "Cloud Detech", una empresa ficticia de educación tecnológica en la nube (similar al modelo de Alura)[cite: 2]. Esto permitirá estandarizar el manual de marca y evaluar correctamente el sentimiento de la comunidad[cite: 2].
* ⚙️ **Unificación del Motor Core (Ingesta + Curaduría):** Se validó la integración del código de extracción de Discord (desarrollado por Eduardo Alonso) con el motor de curaduría IA (desarrollado por Fernando)[cite: 2]. El sistema opera de manera modular utilizando Google Drive como puente, sobreescribiendo archivos JSON dinámicamente para que el equipo consulte siempre la versión más reciente sin duplicar procesos[cite: 2].
* 🧠 **Optimización de Recursos IA (Transición Estratégica):** Se analizó la viabilidad de migrar el modelo actual hacia "Gemma 4"[cite: 2]. Esta decisión técnica busca aprovechar una mejor estructuración nativa de archivos JSON y una cuota de tokens mucho más amplia, garantizando que el sistema pueda procesar altos volúmenes de datos sin interrupciones ni costos adicionales[cite: 2].
* 💻 **Evolución del Panel de Control (Frontend):** Se discutió con Andrés la necesidad de expandir la interfaz visual para reflejar el flujo de trabajo completo[cite: 2]. Se acordó la futura integración de ventanas específicas para visualizar la Ingesta, la Curaduría, el Copywriting y el estado de OCI[cite: 2].
* ☁️ **Estrategia de Almacenamiento en OCI:** Se abordó el reto técnico del despliegue en la nube[cite: 2]. Cristian Astudillo tomará el liderazgo para configurar la cuenta gratuita y desarrollar el script en Python que automatice el envío de los reportes JSON (diarios o semanales) hacia OCI Object Storage[cite: 2].
* 📈 **Métricas de Productividad y Metodología:** Se hizo un llamado al equipo para incrementar la interacción directa mediante *commits* en ramas individuales dentro de GitHub, lo cual impacta positivamente en las métricas de evaluación de la plataforma No Country[cite: 2].

## 🤝 Acuerdos y Decisiones
* 📂 **Arquitectura Desacoplada:** Se mantendrá el enfoque de desarrollo modular; los scripts principales se ejecutan sin interferir entre sí, utilizando un archivo centralizado para la orquestación y protegiendo el código de cada desarrollador[cite: 2].
* 🤖 **Actualización del Cerebro IA:** Fernando realizará pruebas con el modelo Gemma para validar mejoras en la velocidad, rendimiento y precisión de los formatos JSON antes de pasarlo a la rama principal[cite: 2].
* 🤝 **Soporte Cruzado en Desarrollo:** Para acelerar la entrega visual del producto, Fernando apoyará a Andrés en la construcción de las vistas faltantes del Frontend[cite: 2].
* 📅 **Cierre de Documentación:** Se priorizará la finalización inmediata de la documentación de negocio y tono de marca para que el motor de curaduría pueda realizar evaluaciones de sentimiento 100% alineadas a los valores de la empresa[cite: 2].

## 🚀 Plan de Acción / Tareas Pendientes

| Tarea / Acción a realizar | Responsable | Contexto o detalles clave |
| :--- | :--- | :--- |
| **Cierre de Documentación y Tono de Marca** | Líder de Copywriting (y equipo) | Finalizar la documentación de "Cloud Detech" para establecer los parámetros exactos de evaluación de la IA[cite: 2]. |
| **Pruebas de optimización con Gemma** | Fernando Frausto | Modificar el orquestador IA para evaluar el rendimiento de generación JSON y manejo de tokens con el nuevo modelo[cite: 2]. |
| **Desarrollo de Vistas del Dashboard** | Andrés Martínez (Apoyo: Fernando) | Integrar 4 nuevas secciones en la interfaz visual: Ingesta, Curaduría, Copywriting y OCI[cite: 2]. |
| **Conexión y automatización OCI** | Cristian Astudillo | Desarrollar el script en Python para cargar automáticamente los archivos JSON procesados al Object Storage por lotes[cite: 2]. |
| **Migración del código a GitHub** | Todo el equipo técnico | Trasladar los scripts probados en Colab/Drive hacia ramas individuales en el repositorio oficial para unificar la versión final[cite: 2]. |
