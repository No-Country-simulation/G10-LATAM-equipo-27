🎨 Frontend


Stack tecnológico
Tecnología	Uso
React	Construcción de interfaces
TypeScript	Tipado y mantenibilidad
Vite	Entorno de desarrollo y build
Tailwind CSS	Diseño visual y responsive
React Router	Navegación y rutas protegidas
Lucide React	Sistema de iconografía
Netlify	Hosting y despliegue continuo


📊 Módulos principales
La interfaz incluye diferentes tableros para administración, análisis y gestión de contenido.
🏠 Dashboard
Vista general de la comunidad.
Incluye:
- Mensajes procesados
- Audiencia
- Sentimiento
- Temas detectados
- Contenidos generados
- Aprobaciones pendientes
- Historias destacadas
- Gráficos de sentimiento
- Temas principales
- Evolución temporal
- Actividad de audiencia
💬 Ingesta Discord
Panel encargado de visualizar las interacciones recibidas desde Discord.
Permite:
- Visualizar mensajes
- Buscar contenido
- Filtrar por canal
- Filtrar por sentimiento
- Clasificar estado de curaduría
- Consultar relevancia
- Identificar temas y palabras clave
- Seleccionar mensajes para análisis
Flujo:
Discord
   ↓
Ingesta
   ↓
Análisis

📈 Análisis
Tablero de análisis y curaduría de información.
Incluye:
- Métricas globales
- Sentimiento
- Relevancia
- Alineación de marca
- Emojis destacados
- Hashtags populares
- Temas clave
- Insights
- Preguntas frecuentes
- Alertas
- Selección de mensajes para Copywriting
Flujo:
Ingesta
   ↓
Análisis
   ↓
Redacción de contenidos

✨ Redacción de Contenidos
Espacio de preparación de contenido basado en interacciones seleccionadas.
Permite trabajar propuestas para:
- LinkedIn
- Newsletter
- Discord
Cada contenido puede pasar posteriormente al proceso de aprobación.
Análisis
   ↓
Redacción
   ↓
Aprobaciones

✅ Aprobaciones
Sistema de revisión humana antes de continuar el flujo de contenido.
Estados disponibles:
- Pendiente
- Aprobado
- Requiere ajustes
Incluye criterios como:
- Relevancia
- Sentimiento
- Alineación de marca
El objetivo es mantener un esquema Human-in-the-Loop, donde el contenido generado o asistido por IA no avanza automáticamente sin revisión humana.
☁️ Informes y Almacenamiento
Módulo preparado para integrar los informes generados por la plataforma con la infraestructura de almacenamiento definida para el proyecto.
La integración definitiva con OCI se realizará mediante servicios backend y API.
🔄 Flujo funcional
El flujo principal diseñado para el Community Manager es:
Discord
   │
   ▼
💬 Ingesta
   │
   ▼
📊 Análisis
   │
   ▼
✨ Redacción de contenidos
   │
   ▼
✅ Aprobaciones
   │
   ▼
☁️ Informes / Almacenamiento

Esto permite separar claramente:
Ingesta → Curaduría → Análisis → Copywriting → Revisión humana → Persistencia
👥 Roles
La plataforma implementa control de acceso basado en roles.
👑 Administrador
Cuenta con acceso al sistema completo, incluyendo:
- Dashboard
- Mensajes
- Historias destacadas
- Hashtags
- Audiencia
- Análisis
- Calendario
- Exportaciones
- Reportes
- Content Studio
- Aprobaciones
- Almacenamiento
- Auditoría
- Seguridad
- Configuración
🧑‍💻 Community Manager
Dispone de una interfaz enfocada en su flujo operativo:
Dashboard
↓
Ingesta Discord
↓
Análisis
↓
Redacción de contenidos
↓
Aprobaciones
↓
Informes y Almacenamiento

Los módulos administrativos permanecen ocultos y protegidos para este rol.
👁️ Revisor
Rol destinado a funciones de revisión de contenido según los permisos definidos por la plataforma.
🔐 Backend Administrativo
El backend administrativo fue desarrollado de forma independiente al Motor IA.
Tecnologías
Tecnología	Función
FastAPI	API REST
Python	Backend
PostgreSQL	Base de datos
SQLAlchemy	ORM
Alembic	Migraciones
Argon2	Hash seguro de contraseñas
JWT	Autenticación
Uvicorn	Servidor ASGI
Nginx	Reverse Proxy


🔑 Autenticación
La plataforma implementa autenticación propia.
El usuario inicia sesión utilizando:
Usuario
Contraseña

Después de validar las credenciales, el sistema determina el rol y habilita únicamente las rutas autorizadas.
Las contraseñas no se almacenan en texto plano.
Se utiliza:
Argon2

para generar hashes seguros.
👤 Gestión de usuarios
Desde el módulo de Seguridad, un administrador puede gestionar usuarios del sistema.
Entre las funciones implementadas se encuentran:
- Creación de usuarios
- Nombre y apellido
- Username
- Contraseña
- Asignación de rol
- Estado activo/inactivo
- Gestión administrativa de cuentas
🛡️ Seguridad
La arquitectura separa los datos administrativos de los datos procesados por el Motor IA.
PostgreSQL almacena información relacionada con:
Usuarios
Roles
Credenciales protegidas
Auditoría
Configuración administrativa
Estados internos

Los datos relacionados con Discord y el procesamiento mediante IA pertenecen a otra capa de infraestructura.
Esto permite reducir el acoplamiento entre:
Administración
      ↕
Motor IA

📜 Auditoría
El backend incorpora una estructura destinada al registro de acciones administrativas.
Esto permite mantener trazabilidad sobre operaciones importantes realizadas dentro del sistema.
🗄️ Base de Datos
Se utiliza PostgreSQL para la persistencia administrativa.
Entre las tablas implementadas se encuentran:
users
roles
audit_logs
oci_weekly_syncs
alembic_version

Las migraciones son administradas mediante:
Alembic

☁️ Despliegue Cloud
La solución utiliza una arquitectura distribuida.
🌐 Frontend — Netlify
El frontend React se despliega mediante Netlify.
Flujo:
GitHub
   ↓
feature/admin-frontend
   ↓
Netlify Build
   ↓
Vite
   ↓
dist/
   ↓
Aplicación Web

Build:
npm run build

La aplicación también cuenta con configuración para soportar correctamente las rutas SPA de React Router.
☁️ Backend Administrativo — Google Cloud
El backend administrativo se encuentra desplegado en una máquina virtual de Google Cloud Compute Engine.
Arquitectura:
Internet
   ↓
HTTPS
   ↓
Cloudflare Tunnel
   ↓
Nginx
   ↓
FastAPI / Uvicorn
   ↓
PostgreSQL

La API FastAPI se ejecuta internamente y Nginx funciona como Reverse Proxy.
🐘 PostgreSQL en Google Cloud
La base de datos administrativa se encuentra dentro de la infraestructura de Google Cloud.
Esta base se mantiene separada de la infraestructura del Motor IA.
Contiene principalmente:
Usuarios
Roles
Auditoría
Configuraciones
Información administrativa

🔒 Comunicación segura
El frontend no accede directamente a PostgreSQL.
La comunicación sigue el modelo:
React
   ↓
HTTPS
   ↓
FastAPI
   ↓
SQLAlchemy
   ↓
PostgreSQL

De esta manera, las credenciales de la base de datos permanecen únicamente en el servidor.
📱 Diseño Responsive
La interfaz fue adaptada para diferentes tamaños de pantalla.
Escritorio
- Sidebar permanente
- Navegación con scroll independiente
- Información del usuario siempre visible
- Acceso permanente a cerrar sesión
Tablet / Smartphone
- Navegación mediante menú hamburguesa
- Sidebar lateral desplegable
- Overlay de navegación
- Cierre automático al seleccionar un módulo
- Contenido adaptable al ancho disponible
Esto permite utilizar CloudEdTech tanto desde computadores como desde dispositivos móviles.
🔀 Estrategia Git
El desarrollo se separó en ramas para mantener independencia entre componentes.
Frontend
feature/admin-frontend

Backend administrativo
feature/admin-backend

Esta separación permite trabajar en frontend y backend administrativo sin interferir directamente con el desarrollo del Motor IA realizado por otros integrantes del proyecto.
🧠 Integración con Motor IA
La arquitectura está preparada para consumir mediante API el backend encargado de:
- Ingesta desde Discord
- Procesamiento de mensajes
- Análisis de sentimiento
- Identificación de temas
- Hashtags
- Audiencia
- Generación asistida de contenido
- Métricas de comunidad
La integración definitiva se realizará cuando el backend del Motor IA se encuentre unificado y estable.
Algunos datos utilizados actualmente en determinados componentes corresponden a datos de demostración y deberán sustituirse por respuestas reales del backend durante la integración final.

🌍 Arquitectura Cloud Final
La arquitectura prevista queda separada en dos áreas:
                              CLOUDEDTECH
                          │
          ┌───────────────┴───────────────┐
          │                               │
          ▼                               ▼
     Google Cloud                         OCI
          │                               │
 Administración                     Motor IA / Data
          │                               │
 ┌────────┴────────┐              ┌───────┴─────────┐
 │                 │              │                 │
FastAPI        PostgreSQL      Discord API       IA / RAG
 │                                │                 │
Nginx                         Procesamiento     Object Storage
 │
HTTPS
 │
Netlify / React


Esta separación evita mezclar información administrativa y credenciales de usuarios con el procesamiento de datos de comunidad.
🚀 Estado actual
✅ Implementado
- Frontend React + TypeScript
- Diseño CloudEdTech
- Dashboard
- Ingesta
- Análisis
- Redacción de contenidos
- Aprobaciones
- Gestión de usuarios
- Roles y permisos
- Autenticación
- Seguridad
- Auditoría
- PostgreSQL
- Backend administrativo FastAPI
- Migraciones Alembic
- Despliegue frontend en Netlify
- Backend administrativo en Google Cloud
- Reverse Proxy con Nginx
- Acceso HTTPS para demostración
- Diseño responsive
- Navegación móvil
⏳ Pendiente de integración final
- Backend definitivo del Motor IA
- Endpoint público del backend OCI
- Sustitución de datos demo
- Integración completa con Discord
- Persistencia definitiva del flujo de contenidos
- Integración final de informes con OCI Object Storage
- Pruebas End-to-End
🧪 Próxima etapa
Cuando el backend del Motor IA esté disponible y estable:
1. Revisar contratos de API
        ↓
2. Validar endpoints y JSON
        ↓
3. Configurar comunicación Netlify ↔ OCI
        ↓
4. Conectar tableros
        ↓
5. Sustituir datos de demostración
        ↓
6. Validar Discord
        ↓
7. Probar flujo completo
        ↓
8. Ejecutar pruebas End-to-End

💡 CloudEdTech
Education & Technology
Una arquitectura modular orientada a convertir las interacciones de una comunidad digital en información útil, contenido gestionable y decisiones respaldadas por datos.
