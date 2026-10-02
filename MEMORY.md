# MEMORY.md — Análisis de Comunidad con IA (Código Unificado)
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- El código se ha unificado a partir de los aportes de varios colaboradores en un Google Colab (`Codigo_con_imports.ipynb`). 
- El flujo ya es funcional en Colab, pero se requiere adaptar el código para su correcta ejecución en un entorno local (Windows/Python) antes de subirlo a la rama principal de GitHub.

## Decisiones (y por qué)
- Se mantiene la estructura modular (varios `.py` importados en el flujo principal) para favorecer la legibilidad y mantenimiento del código unificado.
- Se ha de priorizar la eliminación de dependencias exclusivas de Colab (como `google.colab.userdata`) por soluciones estándar de Python (como `python-dotenv`) para asegurar la portabilidad local y seguridad de las API keys.

## Aprendizajes y errores a evitar
- (vacío por ahora)

## Próximos pasos
- [x] Crear un archivo `requirements.txt` con las dependencias del proyecto.
- [x] Adaptar `Codigo_con_imports.ipynb` (o crear un script principal en Python) para que use `os.environ.get()` en lugar de `userdata.get()`.
- [x] Configurar un archivo `.env` (y su plantilla `.env.example`) para el manejo seguro de variables de entorno en local.
- [ ] Preparar el repositorio local para enviarlo a GitHub (Ejecutar `git init`, `git add .`, etc.).
