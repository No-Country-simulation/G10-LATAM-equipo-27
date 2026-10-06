# Plan de Implementación: Selector de Fechas

## Arquitectura General
El objetivo de este cambio es permitir al usuario filtrar los mensajes del historial mediante un rango de fechas ("Desde" y "Hasta") antes de ejecutar el análisis con IA. Esto optimiza el consumo de tokens y restringe el análisis a ventanas temporales específicas, manteniendo la posibilidad de analizar todo el historial por defecto.

## Impacto en app.py (Interfaz de Usuario)
Cumpliendo con la regla de **Aislamiento de Interfaz** de la constitución, `app.py` solo manejará la presentación visual, la captura de inputs del usuario y la gestión del estado de la sesión, sin incluir lógica de filtrado directo o análisis en sí mismo.
- Se agregarán dos componentes `st.date_input` para las fechas inicial y final. Ambos iniciarán nulos (`value=None`).
- Se implementarán validaciones visuales directamente en la capa de presentación (`app.py`):
  - Verificar si la fecha "Desde" es posterior a "Hasta" (desplegará un `st.error`).
  - Controlar el recuento de mensajes extraídos. Si el total filtrado es 0, se mostrará un `st.warning` y se deshabilitará el botón de análisis.

## Manejo del Estado en Streamlit y Extracción Reactiva
- **Estado (Session State):** Se pueden aprovechar variables locales o `st.session_state` para mantener las fechas seleccionadas de forma persistente mientras interactúa la UI.
- **Extracción Reactiva:** Cada vez que el usuario interactúe con los selectores de fechas, Streamlit reejecutará el script y `app.py` invocará la función del backend (ej. `obtener_json(desde, hasta)`). 
- **Adaptación Backend:** El backend debe adaptarse para recibir estos parámetros de fecha, aplicando la regla de Diseño Test-First (creando los test de la extracción con fechas antes de modificar su implementación).
- **Integración con IA:** Al hacer clic en "Ejecutar Análisis", se utilizará la lista de mensajes ya reducida que fue devuelta por `obtener_json`, garantizando que la IA consuma solo el set filtrado y se proteja la retrocompatibilidad del formato de salida.
