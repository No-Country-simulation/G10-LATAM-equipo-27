# 📝 Minuta de Reunión - 08 de Octubre

## 📌 Estado General del Proyecto
- El proyecto se encuentra a aproximadamente dos semanas de su conclusión, entrando en la fase final de integración.
- **Acuerdo de IA:** La arquitectura requerirá intervención humana para evaluar los resultados y evitar depender al 100% de la automatización.
- **Organización:** Patricia está brindando apoyo organizativo (roles de Product Owner / Scrum Master) basándose en su experiencia en hackatones.
- ⚠️ **CRÍTICO:** Está estrictamente prohibido intentar iniciar sesión en el correo central del equipo. Está suspendido y cualquier intento podría bloquearlo permanentemente.

## 🖥️ Interfaz de Usuario (Frontend)
- Se aprobó utilizar la maqueta de interfaz desarrollada por Andrés (ya incluye el logotipo y está en GitHub).
- La interfaz contará con 3 botones principales de gestión: **Editar, Rechazar y Publicar**.
- El botón de "Publicar" aprobará el post, lo enviará a las redes (ej. LinkedIn) y guardará el registro en la base de datos para el reporte semanal de OCI.
- *Nota a futuro:* Se evaluará agregar filtros por fecha y canal para la lectura de mensajes más adelante.

## ⚙️ Integración de Código y Repositorio (GitHub)
- La rama `main` actualmente unifica la extracción de mensajes de Discord (código de Eduardo) y la generación de JSON a través del "Cerebro" de IA.
- Queda pendiente integrar a `main` los módulos de Copywriting (Enoch) y el Frontend (Andrés y Tania).
- **Fernando** apoyará en la unificación de las ramas restantes hacia la rama `main`.
- **Limpieza de Repositorio:** Se eliminará el archivo `Codigo_con_imports.ipynb` de las ramas principales, ya que el equipo migrará el flujo de Colab a entornos locales.

## ☁️ Despliegue en la Nube (OCI)
- Cristian será el encargado de realizar el despliegue final en Oracle Cloud Infrastructure (OCI).
- La instalación de dependencias en OCI se realizará a través del archivo `requirements.txt`.
- Fernando enviará por mensaje privado las llaves de acceso (API Keys) a Cristian para configurar el entorno de producción y reemplazar los bots de prueba.

## ✅ Tareas Asignadas (Sprint)
- [ ] **Fernando, Francisco y Samuel:** Redactar los resúmenes del Sprint en el Drive proporcionado por Alonso.
- [ ] **Andrés:** Documentar las librerías e instrucciones en el archivo `README.md` de su rama antes de realizar la fusión (merge).
- [ ] **Fernando:** Consolidar y compartir API Keys con Cristian.
- [ ] **Equipo Core (Fernando/Andrés/Eduardo):** Unificar el código restante hacia la rama `main` en entorno local.

## 📅 Próxima Reunión
- **Fecha:** Lunes, 12 de Octubre
- **Objetivo principal:** Confirmar la integración del código restante en la rama `main` y definir los últimos pasos para el despliegue.
