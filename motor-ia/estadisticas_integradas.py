"""Estadisticas combinadas, de solo lectura, para Analytics."""

from collections import Counter

from integracion_lectura_supabase import obtener_analisis_vinculados
from servicio_dashboard import obtener_interacciones_reales


def obtener_estadisticas_integradas():
    locales = obtener_interacciones_reales()
    integracion = obtener_analisis_vinculados()

    vinculados = {
        str(item["id_local"]): item
        for item in integracion["items"]
    }

    sentimientos = Counter({
        "Positivo": 0,
        "Neutral": 0,
        "Negativo": 0,
    })
    temas = Counter()
    mensajes_analizados = 0
    mensajes_enoc = 0

    for local in locales:
        if local.get("estado") != "analizado":
            continue

        id_local = str(local.get("id"))
        enoc = vinculados.get(id_local)

        if enoc:
            mensajes_enoc += 1

        sentimiento = (
            enoc.get("sentimiento")
            if enoc else local.get("sentimiento")
        )

        if sentimiento in sentimientos:
            sentimientos[sentimiento] += 1
            mensajes_analizados += 1

        valor_temas = (
            enoc.get("temas_clave")
            if enoc else local.get("tema")
        )

        if not valor_temas:
            continue

        for tema in str(valor_temas).split(","):
            tema = tema.strip()

            if tema and tema.upper() != "OTRO":
                temas[tema] += 1

    total_sentimientos = sum(sentimientos.values())
    total_temas = sum(temas.values())

    distribucion = [
        {
            "name": nombre,
            "value": round(
                cantidad * 100 / total_sentimientos, 1
            ) if total_sentimientos else 0.0,
        }
        for nombre, cantidad in sentimientos.items()
    ]

    # Distribuir decimas mediante restos mayores para sumar 100%.
    temas_ordenados = temas.most_common()
    unidades = []

    if total_temas:
        bases = [
            cantidad * 1000 // total_temas
            for _, cantidad in temas_ordenados
        ]
        pendientes = 1000 - sum(bases)

        orden = sorted(
            range(len(temas_ordenados)),
            key=lambda i: (
                -(temas_ordenados[i][1] * 1000 % total_temas),
                i,
            ),
        )

        unidades = bases[:]
        for indice in orden[:pendientes]:
            unidades[indice] += 1

    distribucion_temas = [
        {
            "topic": tema,
            "percentage": unidades[i] / 10,
        }
        for i, (tema, _) in enumerate(temas_ordenados)
    ]

    return {
        "sentiment": {"distribution": distribucion},
        "topics": distribucion_temas,
        "metadata": {
            "mensajes_locales": len(locales),
            "mensajes_analizados": mensajes_analizados,
            "mensajes_enoc_utilizados": mensajes_enoc,
            "analisis_enoc_vinculados": len(vinculados),
        },
    }
