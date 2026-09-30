"""
Armo aquí el mismo paquete JSON que antes armaba el nodo Code de n8n, para que el
bot en Python lo mande directo a procesar_actividad (ya no hay endpoint al que
mandarlo por POST). La limpieza del texto y la detección de repetidos siguen siendo
trabajo de procesamiento.py y base_datos.py; el bot solo arma el paquete.
"""
from datetime import date

CANALES = {
    "1550016804418621452": "#general",
    "1551309664397033513": "#preguntas",
    "1551309281041715230": "#chat-egresados",
    "1551309330198953994": "#oportunidades-laborales",
}

ORIGEN_COMUNIDAD = "Discord_Grupo_ONE_G10"

# fecha en la que arrancó el servidor de Discord; el periodo se cuenta desde aquí
FECHA_INICIO = date(2026, 9, 20)
SEMANA_INICIO = FECHA_INICIO.isocalendar().week


def construir_paquete(mensajes: list) -> dict | None:
    # channel.history() entrega cada canal del más nuevo al más viejo, y el bot los recorre
    # canal por canal, así que la lista llega desordenada. Como el id de la base se asigna
    # en el orden en que se guarda, la ordeno aquí de más viejo a más nuevo (por la fecha
    # real en que se mandó cada mensaje en Discord) para que el id 1 sea el primero enviado
    mensajes = sorted(mensajes, key=lambda m: m.created_at)

    interacciones = []
    for m in mensajes:
        texto = m.content.strip()
        if not texto:
            continue
        interacciones.append({
            "autor": str(m.author),
            "canal": CANALES.get(str(m.channel.id), f"#{m.channel.id}"),
            "texto": texto,
        })

    if not interacciones:
        return None

    fecha_reciente = max(m.created_at for m in mensajes)
    semana_del_anio = fecha_reciente.date().isocalendar().week
    semana = semana_del_anio - SEMANA_INICIO + 1

    return {
        "origen_comunidad": ORIGEN_COMUNIDAD,
        "periodo_referencia": f"Semana_{semana:02d}",
        "interacciones": interacciones,
    }
