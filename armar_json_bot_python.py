"""
Armo aquí el mismo paquete JSON que hoy arma el nodo Code de n8n, para que el bot en
Python pueda mandarlo al mismo endpoint (/procesar-actividad) sin tocar nada del lado
de FastAPI. La limpieza del texto y la detección de repetidos siguen siendo trabajo
del endpoint (limpieza.py y base_datos.py); el bot solo arma el paquete, no las duplico
aquí.
"""
from datetime import datetime

# mismo mapeo que usé en el nodo Code de n8n: el ID que da Discord -> el nombre del canal.
# ojo: estos IDs son de mi servidor de prueba, cada quien pone los de su propio servidor
CANALES = {
    "1550016804418621452": "#general",
    "1551309664397033513": "#preguntas",
    "1551309281041715230": "#chat-egresados",
    "1551309330198953994": "#oportunidades-laborales",
}

from datetime import date

ORIGEN_COMUNIDAD = "Discord_Grupo_ONE_G10"

# fecha en la que arrancó el servidor de Discord; el periodo se cuenta desde aquí
# (ojo: este cálculo no cruza años, se rompería si el proyecto sigue corriendo hasta enero)
FECHA_INICIO = date(2026, 9, 21)
SEMANA_INICIO = FECHA_INICIO.isocalendar().week


def construir_paquete(mensajes: list) -> dict | None:
    """
    Recibe una lista de mensajes de discord.py (objetos discord.Message) y arma el
    paquete JSON del proyecto. Regreso None si no queda ningún mensaje válido, para
    que quien llame a esta función sepa que no hay nada que mandar al endpoint.
    """
    # descarto mensajes sin texto, igual que hacía con el filtro del nodo Code
    # (el mensaje de sistema que llega cuando el bot se une al servidor cae aquí)
    interacciones = []
    for m in mensajes:
        texto = m.content.strip()
        if not texto:
            continue
        interacciones.append({
            "autor": str(m.author),
            "canal": CANALES.get(str(m.channel.id), f"#{m.channel.id}"),
            "texto": texto,
            # "tipo" no se manda: lo sigue decidiendo la IA en la etapa de análisis
        })

    if not interacciones:
        return None

    # tomo la fecha del mensaje más reciente para calcular la semana. Ya no es la semana
    # del año, sino la semana desde que arrancó el servidor (FECHA_INICIO)
    fecha_reciente = max(m.created_at for m in mensajes)
    semana_del_anio = fecha_reciente.date().isocalendar().week
    semana = semana_del_anio - SEMANA_INICIO + 1

    return {
        "origen_comunidad": ORIGEN_COMUNIDAD,
        "periodo_referencia": f"Semana_{semana:02d}",
        "interacciones": interacciones,
    }


# ---- cómo se usaría, una vez que el bot ya tiene la lista de mensajes ----
# (la forma de conseguir "mensajes" -tiempo real con on_message, o por lotes con
# channel.history()- es una decisión aparte, todavía no la resolví aquí)
if __name__ == "__main__":
    import requests

    mensajes = []  # aquí el bot pondría los discord.Message que haya capturado

    paquete = construir_paquete(mensajes)
    if paquete:
        respuesta = requests.post(
            "https://tu-endpoint/procesar-actividad", json=paquete
        )
        print(respuesta.json())
    else:
        print("No había mensajes con texto para mandar.")
