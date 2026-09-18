# G10-LATAM-equipo-27
CommunityLab – Motor Inteligente de Transformación y Distribución para Comunidades Digitales

# 📋 Informe de Sprint Review — Ingeniería de Sistemas Informáticos
**Fecha de reunión:** Jueves, 17 de septiembre de 2026  
**Proyecto:** Simulación No Country — Equipo G10-LATAM-27  
**Fase Actual:** Etapa 1 — Cimentación e Infraestructura  

---

## 📌 Resumen Ejecutivo
El presente informe consolida los avances, decisiones técnicas, compromisos e infraestructura establecida durante la jornada del **17 de septiembre de 2026**. El objetivo primordial de este sprint ha sido sentar las bases organizativas y tecnológicas del proyecto, asegurando el control de versiones, la orquestación de tareas y la arquitectura inicial del software antes de abordar la integración de componentes de Inteligencia Artificial.

---

## 🛠️ 1. Ecosistema Tecnológico y Herramientas Organizacionales

Se han habilitado e integrado formalmente las plataformas operativas para la gestión, control de versiones y colaboración del equipo:

| Plataforma | Propósito Operativo | Enlace de Acceso |
| :--- | :--- | :--- |
| **GitHub** | Control de versiones y gestión del código fuente. | [Repositorio GitHub](...) |
| **Google Drive** | Almacenamiento de reportes, documentación y minutas de reunión. | [Carpeta en Google Drive](...) |
| **Trello** | Integración visual, trazabilidad de etapas y flujo de trabajo. | [Tablero en Trello](...) |
| **Canva** | Mapeo visual del equipo, organización y diagramación inicial. | [Diseño en Canva](...) |

### Normativa de Reuniones
* **Tolerancia máxima de ingreso:** 10 minutos.
* **Duración máxima de sesión activa:** 1 hora.

---

## 🏗️ 2. Avances de la Etapa 1 — Cimentación

**Objetivo Central:** Alinear las directrices del equipo y dejar lista la infraestructura técnica base antes de integrar modelos de IA.

### Asignación Inicial de Roles
* **Project Manager (PM):** Liderazgo operativo, definición de entregables y estructuración del flujo en Trello.
* **Backend:** Definición de arquitectura base para la generación de activos finales.

### Definición Técnica y Arquitectura
1. **Lenguaje Principal:** Implementación sobre **Python**.
2. **Orquestación de Flujos:** Evaluación e integración potencial de **n8n** (plataforma de automatización de código abierto).
3. **Estrategia de Dataset:**
   * **Fase inicial:** Uso de conjunto de datos simulado/estático en formato **JSON** (basado en el PDF del problema).
   * **Fase posterior:** Pruebas de integración mediante el servidor ya configurado **TechMarketing** para interactuar con mensajes en Discord.
4. **Evaluación de Modelos de Lenguaje (LLMs):**
   * Opción prioritaria: **Groq** (alta velocidad, costo gratuito, modelo *Llama 3.3*, previamente probado).
   * Se mantienen otras alternativas en proceso de evaluación y definición.

---

## 🎉 3. Logros Principales del Sprint

Durante la sesión se concretaron exitosamente los siguientes entregables:

* 📄 **Análisis de Ejemplos:** Revisión y ejemplificación de entregas previas en formato PDF.
* 🌐 **Pautas del Proyecto:** Creación del archivo `Communitylab-plan` con directrices de desarrollo en formato HTML.
* 🎨 **Boceto Visual:** Representación inicial de las ideas del Dashboard en formato de imagen.
* ⚙️ **Gobernanza:** Establecimiento de mecanismos de Organización, Control y Planeación.
* 📁 **Estructura Documental:** Creación y configuración de la carpeta de trabajo en Google Drive.
* 📊 **Tablero de Trello:** Configuración del tablero para el seguimiento de tareas.
* 🧩 **Estructura Organizativa:** Diagramación del equipo de trabajo en Canva.
* 💬 **Servidor de Pruebas:** Despliegue de un servidor con canales dedicados para pruebas de comunicación.
* 🤖 **Bot de Asistencia:** Creación e integración de un bot automatizado para apoyo en transferencias de información.

---

## ⚠️ 4. Backlog, Desafíos Técnicos y Plan de Mitigación

### Tareas Pendientes en Backlog
1. Definición e incorporación de roles requeridos para las etapas subsiguientes.
2. Preparación de la primera Demostración (Demo) funcional del software.

### Desafío Técnico Identificado y Mitigación
> **Problema:** Dificultad para realizar pruebas en tiempo real con datos no estructurados provenientes de Discord o redes de comunidad (*Communitylab*).  
> **Solución/Mitigación:** Se iniciará el flujo de procesamiento con datos o *datasets* fijos (JSON estático) como fase de validación inicial antes de pasar a la ingesta en tiempo real.

### Infraestructura en OCI (Oracle Cloud Infrastructure)
* **Plan Backend:** Creación de un bucket en *OCI Object Storage* (nivel *Always Free*) y generación de una URL con Solicitud Preautenticada (PAR - *Pre-Authenticated Request*). Esto evitará el uso complejo de SDKs y autenticaciones adicionales.
* **Estado Actual:** Pendiente a la espera de la asignación/liberación de recursos en OCI.

---

## 🚀 5. Próximos Sprints y Hoja de Ruta (Roadmap)

### Entrega Inmediata
* 📅 **Fecha límite de la Etapa 1:** Lunes, 21 de septiembre de 2026.
* 📏 **Entregable clave:** Definición formal de parámetros y métricas para la evaluación de sentimiento, clasificación de temas y puntuación (*scoring*).

---

### Proyección de Etapas Futuras

#### 🧠 Etapa 2 — Cerebro de IA *(Fricción Media | Duración: 2–3 días)*
* **Objetivo:** Análisis de sentimiento/temas y generación de contenido (*copy*) personalizado por canal.
* **Estrategia:** El equipo de datos diseñará *prompts* con técnica *few-shot* (ejemplos diferenciados para tono LinkedIn vs. tono FAQ) directamente en los playgrounds web de Groq o Claude.
* **Herramientas de Nodos:** Tras validar los prompts manualmente, se migrará a herramientas visuales como **Flowise** (`flowiseai.com`) o **Langflow** (`langflow.org`) para encadenar el flujo (`Entrada → Sentimiento → Generación`).

#### 🔄 Etapa 3 — Orquestación y Automatización *(Fricción Media-Alta)*
* **Objetivo:** Construcción del flujo con bifurcaciones condicionales requeridas por el checklist del proyecto.
* **Tecnología:** Desarrollo del workflow completo en **Python** o **n8n.io**, guardando los resultados directamente en **OCI Object Storage**.
* **Nota Técnica:** Representa el punto de mayor fricción técnica del proyecto. Se recomienda que el rol Backend lidere esta fase con el apoyo del perfil *Vibe Coder*.

#### 💻 Etapa 4 — Interfaz, Documentación y Demo *(Fricción Acotada)*
* **Objetivo:** Cumplimiento integral del checklist de entrega final.
* **Interfaz:** Creación de un panel de control interactivo simple en **Streamlit** para visualización y aprobación de activos.
* **Despliegue:** Alojamiento en **Streamlit Community Cloud** para evitar la configuración compleja de Máquinas Virtuales (VMs). El requisito de OCI se dará por cumplido mediante el Object Storage (OCI Compute queda como diferencial opcional).
* **Equipo Responsable:** Frontend + Vibe Coder apoyados en herramientas asistidas por IA (Claude Code, Cursor o Lovable).
* **Documentación:** Archivo `README.md` con diagrama de arquitectura (Mermaid o draw.io) y video de demostración corto mediante **Loom**.
