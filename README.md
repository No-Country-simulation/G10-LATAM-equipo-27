📝 Minuta de Reunión - Sincronización del Equipo

📅 Información General

Fecha de la reunión: Jueves, 08 de Octubre

Próxima reunión: Lunes, 12 de Octubre

Objetivo principal: Avances en integración final, revisión de ramas en GitHub y preparativos para el despliegue en OCI.

🚀 Estado General del Proyecto

Nos encontramos a dos semanas de la conclusión del proyecto, entrando oficialmente en la fase final de integración.

Validación Humana: Se acordó que la arquitectura de IA requerirá siempre intervención humana para evaluar los resultados (aprobar/rechazar) y evitar depender al 100% de la automatización ciega.

Organización: Patricia está brindando apoyo organizativo asumiendo roles de Product Owner / Scrum Master, aprovechando su experiencia en metodologías ágiles y hackatones.

⚠️ Aviso Crítico (Correo Central): Queda estrictamente prohibido intentar iniciar sesión en el correo central del equipo. Actualmente está suspendido por Google y cualquier intento de acceso podría bloquearlo permanentemente.

💻 Interfaz de Usuario (Frontend)

Maqueta Aprobada: El equipo aprobó de forma unánime utilizar la maqueta desarrollada por Andrés, la cual ya incluye el logotipo, el diseño base y está subida a GitHub.

Gestión de Publicaciones: La interfaz contará con tres botones principales de curaduría: Editar, Rechazar y Publicar.

Flujo del Botón 'Publicar': Al dar clic, este funcionará simultáneamente como aprobación, enviando la publicación a las redes sociales y guardando el registro en la base de datos para el reporte semanal de OCI.

Futuras Mejoras: Se planteó la posibilidad de agregar filtros por fecha y canal para la lectura de mensajes más adelante; por el momento se mantendrá la versión base para agilizar la entrega.

🔀 Integración de Código y Repositorio (GitHub)

Estado de la rama main: Actualmente unifica con éxito la extracción de mensajes desde Discord (Eduardo) y la generación de archivos JSON a través del "Cerebro" de IA.

Pendientes de Integración: Falta fusionar a la rama main los módulos de Copywriting (Enoch) y el Frontend unificado (Andrés y Tania).

Responsable de Unificación: Fernando apoyará como encargado técnico en la unificación de las ramas restantes hacia la rama main.

Limpieza de Repositorio: Se acordó eliminar el archivo Codigo_con_imports.ipynb de las ramas principales, ya que el equipo migrará el flujo de trabajo de Google Colab hacia entornos locales (Streamlit).

Documentación: Se solicitó a Andrés documentar las dependencias e instrucciones en el archivo README.md de su rama individual antes de proceder con la fusión a main.

☁️ Despliegue en la Nube (OCI)

Responsable: Cristian será el encargado principal de realizar el despliegue final de la aplicación en Oracle Cloud Infrastructure (OCI).

Ejecución: El despliegue en OCI se realizará automatizando las instalaciones a través del archivo de dependencias requirements.txt.

Credenciales: Fernando consolidará y enviará por mensaje privado las llaves de acceso (API Keys) a Cristian para configurar de forma segura el entorno de producción y reemplazar los bots temporales de prueba.

📋 Próximos Pasos y Tareas Asignadas (Sprint Actual)

[ ] Fernando: Unificar ramas restantes hacia main y enviar las API Keys de los modelos a Cristian.

[ ] Cristian: Preparar el entorno en OCI para recibir el despliegue final.

[ ] Andrés: Actualizar el README.md de su rama frontend con instrucciones y librerías necesarias.

[ ] Fernando, Francisco y Samuel: Redactar los resúmenes correspondientes del Sprint en el Drive de Alonso.
