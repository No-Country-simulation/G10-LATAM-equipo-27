import sys

with open('app.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if 'try:' in line and i + 1 < len(lines) and 'datos_locales = obtener_json(desde=fecha_desde, hasta=fecha_hasta)' in lines[i+1]:
        skip = True
        new_lines.append('try:\n')
        new_lines.append('    datos_locales = obtener_json(desde=fecha_desde, hasta=fecha_hasta)\n')
        new_lines.append('    total_mensajes = datos_locales.get(\"total\", 0)\n')
        new_lines.append('    \n')
        new_lines.append('    # Llenar el espacio reservado arriba\n')
        new_lines.append('    espacio_contador.info(f\"📊 Actualmente hay **{total_mensajes}** mensajes en la base de datos local listos para ser analizados.\")\n')
        new_lines.append('    with espacio_json.expander(\"Ver JSON crudo de la Base de Datos\"):\n')
        new_lines.append('        st.json(datos_locales)\n')
        new_lines.append('        \n')
        new_lines.append('    if total_mensajes == 0 and not error_fechas:\n')
        new_lines.append('        st.warning(\"No hay mensajes para analizar en este rango de fechas.\")\n')
        new_lines.append('except Exception as e:\n')
        new_lines.append('    espacio_contador.warning(\"💡 La base de datos está vacía en este entorno. Por favor, haz clic en \'Extraer últimos mensajes de Discord\' para inicializarla.\")\n')
    elif skip and 'opciones_cerebro = {' in line:
        skip = False
        new_lines.append(line)
    elif not skip:
        new_lines.append(line)

with open('app.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('Success')
