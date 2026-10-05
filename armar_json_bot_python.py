"""
Armo aquí el mismo paquete JSON que antes armaba el nodo Code de n8n, para que el
bot en Python lo mande directo a procesar_actividad (ya no hay endpoint al que
mandarlo por POST). La limpieza del texto y la detección de repetidos siguen siendo
trabajo de procesamiento.py y base_datos.py; el bot solo arma el paquete.
"""
from periodos import a_utc_iso, semana_de

CANALES = {
    "1550016804418621452": "#general",
    "1551309664397033513": "#preguntas",
    "1551309281041715230": "#chat-egresados",
    "1551309330198953994": "#oportunidades-laborales",
}

ORIGEN_COMUNIDAD = "Discord_Grupo_ONE_G10"

# la fecha de inicio del proyecto (y cómo se cuentan las semanas) ya no vive aquí:
# está en periodos.py, para que solo haya un lugar donde cambiarla


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

            # Metadatos originales de Discord
            "guild_id": str(m.guild.id),
            "guild_name": m.guild.name,
            "channel_id": str(m.channel.id),
            "message_id": str(m.id),
            "author_id": str(m.author.id),

            # Fecha real de envío en Discord, normalizada a UTC.
            # Internamente usamos enviado_en; la API la expondrá como created_at.
            "enviado_en": a_utc_iso(m.created_at),
        })

    if not interacciones:
        return None

    # periodo_referencia sigue siendo por lote: la semana del mensaje más reciente de esta corrida
    fecha_reciente = max(m.created_at for m in mensajes)

    return {
        "origen_comunidad": ORIGEN_COMUNIDAD,
        "periodo_referencia": f"Semana_{semana_de(fecha_reciente):02d}",
        "interacciones": interacciones,
    }
