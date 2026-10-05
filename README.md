# 📋 Informe de Sprint Review — Reunión 6

## ℹ️ Información General

- **Fecha:** Jueves, 1 de octubre de 2026.
- **Sesión anterior:** Lunes, 28 de septiembre de 2026 (Reunión 5).
- **Próxima sesión:** Jueves, en el horario habitual de cada zona horaria (según lo indicado al cierre de la reunión).
- **Proyecto y equipo:** Simulación No Country — Equipo CommunityLab.
- **Fase actual:** Etapa 2 — Integración del dashboard con el backend, consolidación del código en GitHub y gestión de infraestructura en OCI.
- **Objetivo principal:** Presentar el avance funcional del dashboard, validar la estrategia de unificación del código (Colab → entorno local → rama `main`) y definir la ruta para asegurar una instancia de OCI de mayor capacidad antes de que se cierre la ventana de disponibilidad.

## 📌 Resumen Ejecutivo

El equipo presentó una demo funcional del dashboard (autenticación, ingesta simulada y prueba en vivo contra un servidor de Discord, análisis de sentimiento, pantallas de hashtags, audiencia, calendario, reportes, Content Studio con flujo de aprobación, y módulos de auditoría y seguridad con roles). En paralelo, el backend ya opera de forma modular: la ingesta de Discord y el motor de curaduría de Fernando se encuentran unificados y generan archivos JSON persistentes (mensajes crudos y mensajes procesados). Se acordó cómo trasladar el código de Colab a un entorno local y consolidarlo en `main`, y se priorizó tener la aplicación corriendo completa en local antes de desplegarla. En infraestructura, la persistencia en OCI Object Storage ya fue probada, y se identificó una ventana corta para abrir una instancia Ampere de alta capacidad, cuya gestión quedó encaminada con Patricia y el apoyo de Cristian.

## 💬 Temas Clave y Discusiones

### 🗂️ Arquitectura del código y flujo de unificación
- Existen dos versiones en Drive (`Colab Notebooks`): un notebook monolítico (flujo de arriba hacia abajo, más fácil de seguir paso a paso, pero más largo y dependiente del orden de celdas) y una carpeta de **código unificado** con archivos `.py` modulares, donde cada función vive en su propio archivo y se importa de forma convencional. Este esquema replica la estructura de los archivos locales de cada desarrollador.
- El código de la ingesta de Discord ya fue integrado con el motor de curaduría de Fernando. Cada corrida persiste sus salidas como archivo en la misma carpeta, evitando reprocesar todo el pipeline: uno con el **JSON de mensajes crudos** y otro con el **JSON ya procesado y curado**.
- Mejora planificada: permitir que el usuario defina un **rango de fechas** para acotar el análisis de la comunidad.

### 📊 Demo del Dashboard (Frontend)
- **Autenticación:** inicio de sesión con usuario demo, opción de mostrar/ocultar contraseña y bloqueo automático de la vista hasta autenticarse.
- **Fuente de datos:** actualmente consume datos simulados desde una API propia. Se realizó además una **prueba de integración con el servidor de Discord**: un mensaje enviado en vivo apareció en el dashboard tras ~5 segundos, clasificado con 50 % de sentimiento neutral, y los contadores (p. ej., preguntas) se actualizaron.
- **Vistas mostradas:** contadores y filtros con codificación por color según sentimiento; listas de problemas y destacados; **hashtags** (con sentimiento asociado a cada uno); **audiencia** (miembros totales y activos, tasa de participación y crecimiento, distribución); **análisis** (insight principal, preguntas frecuentes, temas que requieren atención) pensado como resumen rápido para presentar; **calendario** (mensajes, sentimiento y destacados por día); **exportación** y **reportes** por tipo, con estatus por persona.
- **Pendiente de integración con el backend:** los botones de *generar contenido*, *análisis de conversación* y *ver mensaje original*, así como la unificación de los "destacados/historias de éxito", que hoy se manejan en la parte de ingesta de Discord.

### 🔁 Content Studio y flujo de aprobación
- Desde Content Studio se puede regenerar, copiar y modificar contenido y enviarlo a aprobación.
- **Aprobado →** se publica automáticamente en Discord. **Rechazado →** regresa a Content Studio para ajustes y vuelve a entrar al ciclo de aprobación.

### 🔐 Seguridad, roles y auditoría
- Gestión de usuarios (crear, asignar contraseña, eliminar) con roles **administrador / revisor / analista**, y tableros distintos según el rol.
- El usuario administrador está **protegido**: no puede eliminarse ni cambiársele el rol o la contraseña.
- Módulo de **auditoría** con registro en tiempo real de las acciones realizadas en la plataforma.
- Se planteó mantener la parte administrativa (usuarios, contraseñas, auditoría) como un **entorno aislado** de la analítica del backend.

### 📥 Ingesta de archivos y contrato de datos
- El dashboard reconoce por ahora únicamente archivos `.json`; se pueden agregar otros formatos si el equipo lo requiere.
- Quedó abierta una duda del frontend: precisar qué información debe recibir el dashboard desde el backend (**datos ya procesados** y no solo el JSON de mensajes), es decir, definir el contrato de datos entre ambos.
- El conector de **OCI** del dashboard se vinculará a una instancia en OCI y mostrará los periodos pendientes de enviar a la nube (envío semanal/mensual), con opción de carga manual de un JSON.

### 🔀 Estrategia de ramas y consolidación a `main`
- Se sugirió revisar cada rama existente (datos, multimodal, motor de documentos, pruebas, entre otras), decidir qué partes se conservan y unificar hacia la rama principal. El mismo criterio aplica al frontend: definir qué partes de la maqueta se usan y cuáles se descartan.
- **Flujo Colab → local:** primera celda con todas las librerías (Eduardo y Fernando deben acordar cuáles), segunda celda con variables de entorno y API keys, **comentadas** mientras se trabaja en Colab. Al migrar a un IDE local (VS Code o similar), solo se descomentan y se eliminan las 2–3 líneas específicas de Colab.
- Se puede descargar el código de Colab como módulos en un solo archivo y separarlo después; un archivo `main` importaría los módulos restantes.
- Versión de Python de referencia: **3.12**.

### ☁️ Estado y estrategia de OCI
- Se demostró la **persistencia en OCI Object Storage** (API + PowerShell): se pueden almacenar los JSON procesados y también otros formatos como PDF.
- Surgió un inconveniente con el **archivo de credenciales** que OCI exige descargar y que no puede compartirse directamente; aun así la prueba funcionó localmente.
- Las instancias *Always Free* de bajos recursos permitieron levantar una API de prueba, pero son muy limitadas para la aplicación completa.
- **Requisito obligatorio vs. opcional:** el brief del hackatón exige la integración con OCI Object Storage (persistir JSON, reportes y textos procesados); el **despliegue completo** de la aplicación en la nube es un diferencial opcional. Se comentó verbalmente que podrían aceptarse otros proveedores (p. ej., Microsoft), pero el brief indica OCI Object Storage como requisito de integración, por lo que cualquier alternativa debe validarse con la organización.
- **Prioridad de trabajo:** primero lograr que la aplicación corra completa en local en el equipo de cada integrante; después replicarla en la nube.
- **Ventana de disponibilidad:** existe un periodo corto (aprox. del 2 de octubre al 2 de noviembre) para abrir una instancia **Ampere de alta capacidad** (≈ 2 OCPU / 12 GB RAM, según lo comentado) que se mantendría activa durante el mes y se eliminaría antes de finalizar octubre (cierre del proyecto: 27) para evitar cargos; el respaldo de créditos de prueba cubre cualquier contingencia. Estas instancias suelen liberarse en pocos días: pasada aproximadamente la fecha del 5 de octubre, es probable que ya no estén disponibles.
- **Requisitos de apertura:** una cuenta de OCI que no haya sido utilizada antes y un método de pago válido para la verificación (se mencionó un saldo mínimo cercano a 5 USD). La configuración se haría con apoyo del ingeniero Cristian, y se recomendó que los integrantes interesados estén presentes durante el proceso.
- **Configuración sugerida:** imagen **Ubuntu 24.04 (Canonical)**, por su mayor compatibilidad con Python y parches más recientes que 20.04.
- Patricia gestionará la apertura utilizando la cuenta de su esposo (sin uso previo), coordinándose con Cristian al día siguiente.

### 🎨 Identidad de marca
- El logo está prácticamente terminado, pendiente de subirse, y se espera incorporarlo en el dashboard. La documentación de marca (~4 páginas) se está unificando para iniciar el trabajo con el equipo de copywriting a partir del día siguiente.

## 🤝 Acuerdos y Decisiones

- 📂 **Persistencia de salidas:** se mantienen los archivos JSON (crudos y procesados) como puente entre ingesta, curaduría y dashboard, evitando reprocesar.
- 🧩 **Estructura modular:** se conserva el enfoque de un archivo `main` con módulos importados.
- 🔀 **Flujo Colab → local:** librerías en la primera celda, variables de entorno y APIs comentadas en la segunda; migración a IDE local retirando las líneas específicas de Colab. Python 3.12 como versión de referencia.
- 🌿 **Consolidación en GitHub:** revisión de ramas para decidir qué se conserva y unificación hacia `main`.
- 💻 **Prioridad local primero:** cada integrante debe poder levantar la aplicación completa en su equipo antes de replicarla en la nube.
- 🔒 **Aislamiento administrativo:** se mantiene la separación entre el entorno administrativo (usuarios, auditoría) y la analítica del backend.
- ☁️ **OCI:** persistencia de JSON/reportes procesados como requisito obligatorio; apertura de una instancia Ampere de alta capacidad (Ubuntu 24.04) dentro de las próximas 48 horas, a cargo de Patricia con apoyo de Cristian.

## 🚀 Plan de Acción / Tareas Pendientes

| Tarea / Acción a realizar | Responsable | Contexto o detalles clave |
|---|---|---|
| Agregar filtro de rango de fechas al análisis de la comunidad | Eduardo Alonso (por confirmar) | Mejora sobre la salida JSON del flujo unificado |
| Definir el contrato de datos (JSON procesado) entre backend y dashboard e integrar los botones de generar contenido, análisis de conversación y ver mensaje original | Frontend (Andrés Martínez) con Backend (por confirmar) | Hoy el dashboard consume datos simulados desde una API propia |
| Unificar los "destacados/historias de éxito" de la ingesta de Discord con el backend | Eduardo Alonso (por confirmar) | Se probó de forma aislada con mensajes de Discord |
| Acordar las librerías de la primera celda del notebook | Eduardo Alonso y Fernando Frausto | Paso previo a la consolidación del código |
| Consolidar el código de Colab en un solo archivo y migrarlo a un IDE local | Eduardo Alonso y Fernando Frausto | Después subir a la rama `main`; decidir si se divide en módulos |
| Revisar las ramas del repositorio y decidir qué se conserva | Equipo técnico | Aplica también a las vistas del frontend |
| Subir el logo y finalizar el manual de marca (~4 páginas) | Líder de Copywriting (por confirmar) | Se usará como base para el trabajo con el equipo de copywriting |
| Incorporar el logo en el dashboard | Andrés Martínez (por confirmar) | Pendiente de recibir el archivo |
| Abrir la instancia OCI Ampere de alta capacidad (Ubuntu 24.04) | Patricia, con apoyo de Cristian Astudillo | Dentro de las próximas 48 horas, por la ventana de disponibilidad |
| Resolver el manejo seguro del archivo de credenciales de OCI | Por confirmar | No puede compartirse directamente |
| Conectar el conector de OCI del dashboard (periodos pendientes y envío a la nube) | Por confirmar | Mostrado en la demo como pendiente de enlace |
| Lograr que la aplicación corra completa en local en el equipo de cada integrante | Equipo técnico | Paso previo a cualquier despliegue en la nube |
