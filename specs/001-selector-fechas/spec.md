# Especificación: Selector de Fechas para Análisis

## Requerimientos Funcionales (EARS)

### 1. Interfaz de Selección de Fechas (Ubiquitous Requirement)
**QUÉ:** El sistema deberá mostrar componentes visuales de selección de fecha para un límite inicial ("Desde") y un límite final ("Hasta") en la interfaz principal de Streamlit (`app.py`), ubicados antes de la sección de análisis. Ambos calendarios deben iniciar vacíos/nulos por defecto.
**POR QUÉ:** Para que el usuario pueda definir la ventana temporal. Al iniciar vacíos, el sistema carga TODOS los mensajes del historial por defecto, manteniendo la retrocompatibilidad con el comportamiento actual.

### 2. Actualización en Vivo y Contador (Event-driven Requirement)
**QUÉ:** Cuando el usuario modifique las fechas seleccionadas, el sistema deberá invocar de manera reactiva la función `obtener_json(desde=..., hasta=...)` para actualizar el conjunto de datos local, modificando en tiempo real el contador visible en la Sección 1 que indica "Actualmente hay X mensajes".
**POR QUÉ:** Para proveer retroalimentación inmediata al usuario sobre la cantidad de datos disponibles bajo los filtros aplicados y garantizar que el filtrado se realice a nivel de extracción local.

### 3. Validación de Fechas Invertidas (Unwanted Behavior)
**QUÉ:** Si el usuario selecciona una fecha "Desde" que es posterior a la fecha "Hasta", el sistema deberá mostrar un mensaje de error en la UI y no deberá permitir la ejecución del análisis.
**POR QUÉ:** Para prevenir rangos temporales ilógicos que causarían fallos en la extracción y procesamiento de datos.

### 4. Manejo de Búsqueda Vacía (Event-driven Requirement)
**QUÉ:** Si el filtrado temporal resulta en 0 mensajes, el sistema deberá mostrar un aviso amarillo (warning) en la UI y ocultar o deshabilitar el botón de "Ejecutar Análisis".
**POR QUÉ:** Para evitar la ejecución inútil del proceso de análisis con IA cuando no hay datos de origen, previniendo errores de procesamiento.

### 5. Análisis Limitado al Periodo (Event-driven Requirement)
**QUÉ:** Cuando el usuario oprima el botón "Ejecutar Análisis" (siempre que los filtros sean válidos), el sistema deberá procesar con el motor de IA únicamente los mensajes restringidos al rango de fechas establecido.
**POR QUÉ:** Para optimizar el tiempo de ejecución y el consumo de tokens, evitando analizar el historial completo innecesariamente.
