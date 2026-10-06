# 📋 Informe de Sprint Review — Reunión 7

## ℹ️ Información General

- **Fecha:** Lunes, 5 de octubre de 2026.
- **Duración estimada:** ~1 hora.
- **Sesión anterior:** Jueves, 1 de octubre de 2026 (Reunión 6).
- **Próxima sesión:** Jueves, 8 de octubre de 2026, en el horario habitual de cada zona horaria.
- **Proyecto y equipo:** Simulación No Country — Equipo CommunityLab.
- **Fase actual:** Semana 3 de 5 — Cierre de módulos individuales e inicio de la integración frontend–backend.
- **Objetivo principal:** Revisar la puntuación de participación del equipo, evaluar el avance de cada área frente a los requisitos mínimos del hackatón y definir los pendientes para cerrar el MVP.

## 📌 Resumen Ejecutivo

Se revisó la puntuación de participación del equipo y el avance por área mediante un mapa mental de los requisitos del hackatón. El avance global se estima en más del 60 %: la ingesta y el análisis están prácticamente concluidos, mientras que copywriting, almacenamiento de reportes y orquestación siguen en proceso. Se aclaró el requisito de generación de activos de marketing, se discutió la base de datos para auditoría y se acordó una reunión aparte para alinear el frontend con la maqueta propuesta.

## 💬 Temas Clave y Discusiones

### 📈 Puntuación de participación
- Promedio actual del equipo: **7.82**. Meta: alcanzar o superar **8.33** al cierre de la semana 3.
- Se recomendó reforzar la comunicación por Discord y GitHub, y realizar reuniones breves (mínimo 15 minutos) entre los integrantes de cada área.

### 🗺️ Avance por área
Se presentó un mapa mental (generado con NotebookLM a partir del documento del hackatón) con los elementos constitutivos, requisitos obligatorios, recursos opcionales y diferenciales del proyecto.

| Área | Responsable | Avance | Estado |
|---|---|---|---|
| Ingesta | Eduardo Alonso | 95 % | Pendientes mejoras menores |
| Análisis de sentimiento y entidades | Fernando Frausto | 99 % | Solo adaptar a los nuevos campos del JSON |
| Copywriting (motor principal) | Líder de Copywriting | 25 % | Pruebas con distintos LLM |
| Anuncios para Discord | Samuel Ramírez | 90 % | Webhook y API de Gemini obtenidos; faltan pruebas |
| Almacenamiento de reportes | Tania Orantes | En proceso | JSON curados → base de datos → OCI |
| Frontend | Andrés Martínez | 95 % | Sincronizando el dashboard con datos reales |
| Infraestructura / despliegue | Cristian Astudillo y Patricia Madrid | ~50 % | Cuenta e instancia de OCI activas desde el viernes |

### 🗄️ Base de datos para auditoría
- Se cuestionó la necesidad de guardar en base de datos un JSON que es un archivo plano.
- Justificación: se requiere un **registro de control para auditoría** (envíos semanales, errores y opción de reenvío manual), sin depender de que el usuario tenga permisos en la nube.
- Andrés utiliza **PostgreSQL** para la parte administrativa; Cristian lo considera excesivo para el proyecto. Se sugirió **Supabase** como alternativa ligera consumible por API.

### ☁️ Reporte semanal a OCI (obligatorio)
- El envío de reportes a OCI Object Storage debe ser **semanal**, no diario, con un volumen reducido de mensajes para no saturar los 10 GB disponibles.
- En el video demo se puede simular el cierre de semana. El envío puede automatizarse a una hora fija.

### 📝 Generación de activos de marketing
- Requisito mínimo: generar automáticamente **al menos 2 formatos** (post para LinkedIn, newsletter, caso de éxito o preguntas frecuentes) a partir de los mensajes de Discord.
- No se publican automáticamente: quedan como **borradores para revisión** (*human-in-the-loop*), mediante una interfaz en Streamlit o Gradio.
- Se aclaró que no se requiere analizar ni publicar en LinkedIn, solo generar el borrador.

### 🖥️ Frontend vs. maqueta
- Andrés indicó que su frontend ya cubre curaduría y copywriting, aunque con nombres de pantallas distintos.
- El líder de Copywriting solicitó que la estructura refleje la maqueta propuesta.
- Andrés propuso primero conectar el dashboard con los datos reales y después distribuir los elementos de la maqueta en las pantallas existentes.

### 🔀 Orquestación
- Corresponde a la toma de decisiones del flujo en cada fase (ingesta → análisis → copywriting → almacenamiento) y a la ruta de cada mensaje según su tipo (caso de éxito, queja, anuncio).

### ✅ Checklist de evaluación (7 requisitos mínimos)
- Pendiente: repositorio de GitHub con documentación y diagrama de arquitectura. Se completará al concluir el producto.

### 💡 Recomendación sobre el MVP
- Patricia compartió su experiencia en hackatones previos: priorizar el MVP, ya que la semana 5 se destina a video, presentación y ensayos. El flujo completo debe funcionar desde la semana 4.
- Descartar a tiempo cualquier línea de trabajo que consuma recursos sin aportar a los requisitos mínimos.

## 🤝 Acuerdos y Decisiones

- ☁️ **OCI:** se usará para los JSON procesados, los reportes semanales y el despliegue.
- 🗄️ **Base de datos de auditoría:** la definirán Andrés, Cristian, Patricia y Tania; debe ser ligera y, de preferencia, open source.
- 📅 **Reporte a OCI:** con periodicidad semanal.
- 📝 **Activos de marketing:** se generan como borradores para aprobación humana.
- 🖥️ **Frontend:** se realizará una reunión aparte para unificar nombres y estructura de pantallas con la maqueta.
- 🎯 **Prioridad:** cumplir los requisitos mínimos antes de agregar funcionalidades adicionales.
- 🗓️ **Calendario:** semana 4, integración frontend–backend; semana 5, pruebas, video y presentación.

## 🚀 Plan de Acción / Tareas Pendientes

| Tarea / Acción a realizar | Responsable | Contexto o detalles clave |
|---|---|---|
| Elevar la puntuación de participación a 8.33 o más | Todo el equipo | Antes del cierre de la semana 3 |
| Terminar ajustes de ingesta | Eduardo Alonso | Detalles menores |
| Adaptar el análisis a los nuevos campos del JSON | Fernando Frausto | Campos agregados por Eduardo |
| Avanzar el motor de copywriting y presentar una muestra | Líder de Copywriting | De preferencia para el jueves |
| Probar los anuncios para Discord con credenciales reales | Samuel Ramírez | Webhook y API de Gemini ya obtenidos |
| Desarrollar el almacenamiento de reportes y su envío a OCI | Tania Orantes | Semanal, posiblemente automatizado |
| Definir la base de datos de auditoría | Andrés Martínez, Cristian Astudillo, Patricia Madrid y Tania Orantes | Ligera y open source |
| Sincronizar el dashboard con los datos reales del backend | Andrés Martínez | Paso previo a ajustar las demás pantallas |
| Reunión de alineación frontend / maqueta | Andrés Martínez, Patricia Madrid, líder de Copywriting | Horario por acordar; resultado en la siguiente sesión |
| Generar al menos 2 formatos de activos de marketing | Equipo de Copywriting | Requisito mínimo del checklist |
| Elaborar README técnico y diagrama de arquitectura | No asignado | Al cierre del producto |
| Compartir el mapa mental del proyecto | Líder de Copywriting | En formato de imagen |
| Elaborar el resumen de la reunión | Miguel Sierra, Tania Orantes y Samuel Ramírez | A más tardar el día siguiente |
