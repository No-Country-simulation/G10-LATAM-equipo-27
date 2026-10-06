# Constitution

1. **Inviolabilidad del Main:** Ningún agente hará push directo a `main`. Todo cambio se hará en una rama `feature/` y se revisará mediante Pull Request.
2. **Aislamiento de Interfaz:** `app.py` solo debe funcionar como "carrocería" (UI) de Streamlit. Queda prohibido meter lógica pesada de base de datos o de Inteligencia Artificial dentro de este archivo.
3. **Retrocompatibilidad Obligatoria:** Cualquier cambio en el backend debe mantener la compatibilidad con el formato de salida existente que alimenta a Streamlit y al JSON del equipo de Copywriting.
4. **Seguridad de Secretos:** Absolutamente ningún token, API key o dato personal se guardará en código duro. Todo debe consumirse desde `os.environ` usando `.env`.
5. **Estricto Control de Dependencias:** Por cada nueva librería importada en código, el archivo `requirements.txt` debe ser actualizado obligatoriamente en el mismo commit.
6. **Diseño Test-First (TDD):** Todo código implementado por los agentes debe ser precedido por la creación de su prueba (test) correspondiente para asegurar que el cambio cumple el requerimiento original sin romper el entorno local.
