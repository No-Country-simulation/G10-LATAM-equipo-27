# 📋 Informe de Sprint Review — Reunión 3

**Fecha de reunión:** Lunes, 21 de septiembre de 2026
**Proyecto:** Simulación No Country — Equipo G10-LATAM-27 · CommunityLab
**Próxima sesión:** Jueves, 24 de septiembre de 2026
**Fase actual:** Cierre de Etapa 1 (Cimentación / Ingesta) y arranque de Etapa 2 (Cerebro de IA)

## 📌 Resumen Ejecutivo

La Reunión 3 dio seguimiento a los avances individuales del equipo, incorporó formalmente a dos nuevos integrantes (Cristian Astudillo y Francisco Villaverde) y ajustó el horario de las sesiones para acomodar las distintas zonas horarias. Se presentaron tres avances técnicos: el flujo de captura de mensajes de Discord (n8n + Python), un primer prototipo del "cerebro" de IA para análisis de sentimiento y copywriting (Groq), y el prototipo de frontend en Next.js. También se aprobó, en principio, centralizar en una sola cuenta el manejo de correo, APIs y accesos a IA del proyecto, y explorar Gemini/Gemma como LLM compartido.

## 🕒 1. Logística y Nuevo Horario

- Se incorporaron dos nuevos integrantes al equipo: **Cristian Astudillo** y **Francisco Villaverde**.
- Se confirmaron alrededor de 8 personas conectadas en la sesión, la cual quedó grabada (a cargo de Alonso) para la generación de minutas.
- Se ajustó el horario de las reuniones para reducir el impacto en los integrantes con husos horarios más tardíos (compañero conectado desde Chile):

| Zona horaria | Hora local |
|---|---|
| Chile (UTC-3) | 10:00 p.m. |
| Colombia (UTC-5) | 8:00 p.m. |
| CDMX / El Salvador / Honduras (UTC-6) | 7:00 p.m. |
| Noroeste de México (UTC-7) | 6:00 p.m. |

- Se confirman dos sprints por semana: **lunes** y **jueves**.
- Se reforzó la diferencia entre los tres repositorios de información del proyecto: **NoCountry** (resumen sin detalle técnico para el cliente), **Minuta** (detalle técnico completo de cada sesión) y **README** (información técnica del desarrollo, este documento).

## 🔀 2. Avances por Módulo del Pipeline

### Ingesta de datos (Backend)

- Se construyó y probó el flujo de captura de mensajes de Discord, dividido en dos partes conectadas: un flujo en **n8n** que lee los mensajes del canal y arma el paquete en formato JSON, y un servicio en **Python** que valida que la información venga completa, limpia el texto de cada mensaje y descarta los que ya se hayan capturado antes, antes de guardarlos en una base de datos.
- Prueba realizada sobre un servidor de Discord dedicado (canales: general, preguntas, casos de éxito/oportunidades laborales), con mensajes de prueba generados mediante un script apoyado en IA.
- Resultado: **15 mensajes capturados exitosamente**, sin duplicados ni registros vacíos, guardados con estado "pendiente" y un identificador secuencial, listos para la etapa de curaduría.
- Estado: **75% de avance**. El disparador ("trigger") del flujo es actualmente manual; queda pendiente cambiarlo a uno temporal o basado en eventos (evaluando si conviene resolverlo en Python).
- Código subido al repositorio en una rama, con historial de commits disponible.
- **Responsable:** Eduardo Alonso. Ingesta desde archivo (chat o lote en JSON/CSV) asignada a **Cristian Astudillo**, con apoyo de Alonso, para completar el pipeline inicial.
- División de responsabilidades acordada: n8n para la captura de mensajes, Python para los agentes de análisis de datos (decisión abierta a la herramienta con la que cada quien se sienta más cómodo).

### Curaduría (análisis de sentimiento y relevancia)

- Fernando presentó un prototipo del "cerebro" de IA, migrado de Gemini a **Groq** por bloqueos y límites de las otras opciones (Groq es gratuito y de respuesta rápida).
- El prototipo recibe comentarios de prueba y, mediante un prompt diseñado por Fernando, determina el sentimiento general (positivo, negativo o neutral), extrae el tema principal y redacta un borrador de copy editable antes de continuar el proceso.
- **Identificación de sentimiento: completada** (Fernando Frausto). **Puntuación de relevancia: pendiente** (Fernando Frausto). **Detección de temas clave y alineación de marca:** asignadas a **Samuel**. **Identificación de segmentación:** sin asignar.
- Se acordó procesar mediante un scorecard solo los comentarios que alcancen el puntaje de relevancia necesario, descartando contenido no relevante o ajeno al proyecto.
- Pendiente: Fernando usa actualmente una cuenta de prueba gratuita de n8n con ~10 días restantes; debe definir si continúa con n8n o migra por completo a Python para el "cerebro" de IA.

### Copywriting

- Una vez curados los comentarios, esta etapa agrega el tono y la voz de la empresa antes de convertirlos en un producto listo para distribuir. **Responsable: Enoc Ramírez.**
- Pendiente: integrar la gestión de APIs para distribuir automáticamente el contenido a las diferentes redes sociales.
- El JSON de salida del prototipo de Fernando podría conectarse directamente con el flujo de captura de n8n/Python, facilitando la integración de ambas partes.

### Frontend

- Andrés Martínez presentó su avance, desarrollado en Visual Studio Code con apoyo intensivo de IA (ChatGPT), usando **Next.js/JavaScript**.
- Funcionalidades planeadas: login con seguridad, asignación de roles (administradores, usuarios de solo lectura del dashboard, usuarios que aprueban publicaciones) y un carrusel de mensajes/testimonios destacados.
- Se contemplan al menos dos vistas separadas (dashboard y aprobación de publicaciones) más una vista integrada.
- La IA le ha proporcionado ejemplos en JSON para validar el frontend de forma aislada antes de integrarlo con el backend.
- Herramientas de prototipado sugeridas: **Google AI Studio** (backend) y **Google Stitch** (frontend).

## ⚙️ 3. Decisiones de Gobernanza y Herramientas Compartidas

- **Cuenta de correo centralizada** (propuesta de Enoc, aprobada en principio): administrará de forma unificada las APIs (Groq, Gemini/Google Cloud, OCI), el acceso a Google Drive y el registro de las conversaciones de IA de cada integrante. Responsable de su creación y configuración: **Enoc Ramírez**.
  - Convención de nombres para chats de IA: `nombre + tema + número` (ej. "Alonso – JSON – 1"), respetando que cada persona trabaje en su propio hilo.
  - Ante pérdida de contexto en conversaciones largas, se recomienda abrir un chat nuevo con un resumen de lo avanzado.
  - Cada integrante debe reportar qué IA utiliza, para habilitar su acceso bajo la cuenta centralizada; quienes tengan cuentas premium propias pueden conservarlas, compartiendo un resumen de su trabajo.
  - Las credenciales existirán solo mientras dure el proyecto.
  - Se mencionó la opción de herramientas tipo "router" entre modelos (ej. OpenRouter) para saltar entre LLMs sin perder contexto; queda como opción a evaluar, no como decisión tomada.
- **Adopción de Gemini/Gemma como LLM compartido** (en exploración): cuota gratuita de ~1,500 solicitudes/día (10-15 por minuto), posibilidad de generar múltiples API keys sin duplicar el consumo, ventana de contexto de ~256,000 tokens, capacidades multimodales. Se probaron dos tamaños de modelo con resultados favorables: 31B (mejor para copywriting) y 27B (mejor para curaduría/análisis). Se generarán API keys individuales bajo la cuenta centralizada para pruebas del equipo.
- **Google Drive** del proyecto se centralizará bajo la nueva cuenta (actualmente bajo la cuenta de Alonso de forma temporal), para minutas, Excel de seguimiento e imágenes.

## ⚠️ 4. Backlog y Bloqueos Abiertos

| Pendiente | Detalle |
|---|---|
| Cambiar el trigger de ingesta de manual a temporal/por evento | Responsable: Eduardo. Se evaluará si conviene resolverlo en Python. |
| Migrar el trabajo de n8n antes de que expire la prueba gratuita | Responsable: Fernando. Quedan ~10 días de periodo de prueba. |
| Definir si el "cerebro" de IA sigue en n8n o migra a Python | Responsable: Fernando. Decisión dejada a su criterio. |
| Generar API keys individuales de Gemini/Gemma | Sin asignar. |
| Identificación de segmentación (curaduría) | Sin asignar. |
| Completar la explicación del concepto de "Pipeline" a los nuevos integrantes | Sin asignar; quedó a medias por corte de la sesión. |
| Unificación de todas las partes del código | Backlog general. |
| Apertura de la cuenta de OCI | Backlog general. |
| Pipeline para Object Storage (informe/reporte) | Backlog general. |
| Pruebas de capacidad y respuesta del sistema | Backlog general. |
| Roles aún sin tarea puntual en el pipeline | Francisco Villaverde, Eduardo Gracia, Miguel Sierra, Tania Orantes, Patricia Madrid. |

## 🚀 5. Próximos Pasos

- Continuar el desarrollo del frontend (login, roles, carrusel) y validar el prototipo antes de integrarlo con el backend — **Andrés Martínez**.
- Explorar herramientas de prototipado rápido (Google AI Studio y/o Google Stitch) — quien lo desee dentro del equipo.
- Los nuevos integrantes (Cristian y Francisco) deben revisar la minuta y el resumen de NoCountry para ponerse al día.
- Reportar qué IA utiliza cada integrante, para habilitar accesos bajo la cuenta centralizada — todo el equipo.
- Próxima sesión: **jueves 24 de septiembre**, donde se espera completar la explicación de Pipeline pendiente y definir con más detalle las tareas por especialidad que aún no tienen responsable.

