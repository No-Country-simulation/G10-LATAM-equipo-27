# Tareas de Implementación: Selector de Fechas

## Tarea 1: Pruebas unitarias/UI para el selector y validaciones en la interfaz
- **RF:** RF 1, RF 3, RF 4
- **Descripción:** Siguiendo TDD (Constitución #6), escribir tests que verifiquen el comportamiento de la interfaz (`app.py`). Deben probar que los componentes `st.date_input` existen, validan fechas invertidas (`desde > hasta`), validan rangos vacíos (cero mensajes) y pasan correctamente los parámetros a `obtener_json`.
- [x] **Hecho cuando:** Existan pruebas comprobando estas validaciones y comportamientos en la UI, y estas fallen porque aún no se implementa el código en `app.py`.

## Tarea 2: Interfaz base de selección de fechas
- **RF:** RF 1
- **Descripción:** Añadir componentes `st.date_input` en `app.py` para "Desde" y "Hasta" antes de la sección de análisis. Configurarlos para iniciar en `None` (vacíos por defecto).
- [x] **Hecho cuando:** Los selectores sean visibles en la aplicación Streamlit y ambos se muestren vacíos al cargar la página por primera vez.

## Tarea 3: Validación UI de fechas invertidas
- **RF:** RF 3
- **Descripción:** Implementar la lógica en `app.py` que verifique si `desde > hasta` (cuando ambos tienen valor). Mostrar un `st.error` y bloquear el resto del flujo.
- [x] **Hecho cuando:** Ingresar una fecha de inicio posterior al fin muestre un mensaje de error y el sistema impida continuar hacia la ejecución.

## Tarea 4: Conectar extracción de datos y actualizar contador
- **RF:** RF 2
- **Descripción:** Pasar las fechas seleccionadas a la función ya existente `obtener_json(desde=..., hasta=...)` dentro de `app.py`. Obtener los resultados y actualizar el total mostrado en el texto "Actualmente hay X mensajes".
- [x] **Hecho cuando:** Modificar cualquier fecha en la UI desencadene la actualización inmediata y correcta del contador de mensajes en pantalla.

## Tarea 5: Manejo de resultado vacío y bloqueo de botón
- **RF:** RF 4
- **Descripción:** Validar en `app.py` si el total de mensajes extraídos para el rango de fechas es 0. En tal caso, mostrar un `st.warning` y bloquear o deshabilitar el botón "Ejecutar Análisis".
- [x] **Hecho cuando:** Seleccionar fechas donde no existan mensajes muestre una alerta visual al usuario y sea imposible hacer clic en el botón de análisis.

## Tarea 6: Acoplar subset temporal a la IA
- **RF:** RF 5
- **Descripción:** Asegurar en `app.py` que al hacer clic en "Ejecutar Análisis", se envíe al módulo de IA únicamente los datos filtrados en la sesión actual que ya devolvió `obtener_json`, en vez del historial completo directo.
- [x] **Hecho cuando:** La ejecución de la IA evalúe solo el periodo temporal seleccionado por el usuario en la UI y todas las pruebas de la Tarea 1 pasen correctamente.




## Tarea 7: Fix de actualización en vivo del contador (Vuelta 1)
- **RF:** RF 2
- **Descripción:** Ajustar la estructura en app.py usando st.empty() para reservar el espacio del contador y actualizarlo después de leer los inputs de fecha. Añadir test test_counter_updates_with_filters.
- [x] **Hecho cuando:** Los tests pasen en verde y el contador se actualice en tiempo real.

## Tarea 8: Fix bug crítico de variables no inicializadas (Vuelta 2)
- **RF:** N/A (Fix QA)
- **Descripción:** Inicializar `total_mensajes = 0` y `datos_locales = {}` antes del bloque `try` para evitar `NameError` cuando la BD no existe.
- [x] **Hecho cuando:** Los tests pasen en verde y no se levante excepción de variable no definida.
