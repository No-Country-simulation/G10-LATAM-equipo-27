from datetime import datetime, timedelta

from base_datos import listar_interacciones
from periodos import ZONA_PROYECTO



ORIGEN_PRUEBA = "TEST_INTEGRACION_MERGE"


def obtener_interacciones_reales(
    desde_utc=None,
    hasta_utc=None,
) -> list[dict]:
    """
    Obtiene las interacciones reales de Discord y excluye
    registros creados únicamente para pruebas de integración.
    """

    interacciones = listar_interacciones(
        limite=None,
        desde_utc=desde_utc,
        hasta_utc=hasta_utc,
    )

    return [
        item
        for item in interacciones
        if item.get("origen_comunidad") != ORIGEN_PRUEBA
    ]

def obtener_ventanas_comparables() -> dict:
    interacciones = obtener_interacciones_reales()

    if not interacciones:
        return {}

    ultimo_dato_utc = datetime.fromisoformat(
        interacciones[0]["enviado_en"]
    )

    ultimo_dato_local = ultimo_dato_utc.astimezone(ZONA_PROYECTO)

    inicio_semana_local = ultimo_dato_local - timedelta(
        days=ultimo_dato_local.weekday(),
        hours=ultimo_dato_local.hour,
        minutes=ultimo_dato_local.minute,
        seconds=ultimo_dato_local.second,
        microseconds=ultimo_dato_local.microsecond,
    )

    duracion = ultimo_dato_local - inicio_semana_local

    inicio_anterior_local = inicio_semana_local - timedelta(days=7)
    fin_anterior_local = inicio_anterior_local + duracion

    return {
        "actual_desde": inicio_semana_local,
        "actual_hasta": ultimo_dato_local,
        "anterior_desde": inicio_anterior_local,
        "anterior_hasta": fin_anterior_local,
    }

def calcular_comparacion_mensajes() -> dict:
    ventanas = obtener_ventanas_comparables()

    if not ventanas:
        return {
            "actual": 0,
            "anterior": 0,
            "cambio_porcentual": 0.0,
        }

    actuales = obtener_interacciones_reales(
        desde_utc=ventanas["actual_desde"],
        hasta_utc=ventanas["actual_hasta"] + timedelta(seconds=1),
    )

    anteriores = obtener_interacciones_reales(
        desde_utc=ventanas["anterior_desde"],
        hasta_utc=ventanas["anterior_hasta"] + timedelta(seconds=1),
    )

    total_actual = len(actuales)
    total_anterior = len(anteriores)

    if total_anterior == 0:
        cambio = None
    else:
        cambio = round(
            ((total_actual - total_anterior) / total_anterior) * 100,
            1,
        )

    

    return {
        "actual": total_actual,
        "anterior": total_anterior,
        "cambio_porcentual": cambio,
    }

def calcular_comparacion_sentimiento() -> dict:
    ventanas = obtener_ventanas_comparables()

    if not ventanas:
        return {
            "actual": 0.0,
            "anterior": None,
            "cambio_puntos": None,
        }

    actuales = obtener_interacciones_reales(
        desde_utc=ventanas["actual_desde"],
        hasta_utc=ventanas["actual_hasta"] + timedelta(seconds=1),
    )

    anteriores = obtener_interacciones_reales(
        desde_utc=ventanas["anterior_desde"],
        hasta_utc=ventanas["anterior_hasta"] + timedelta(seconds=1),
    )

    actuales_analizados = [
        item for item in actuales
        if item.get("estado") == "analizado"
    ]

    anteriores_analizados = [
        item for item in anteriores
        if item.get("estado") == "analizado"
    ]

    def porcentaje_positivo(items):
        if not items:
            return None

        positivos = sum(
            1
            for item in items
            if item.get("sentimiento") == "Positivo"
        )

        return round((positivos / len(items)) * 100, 1)

    actual = porcentaje_positivo(actuales_analizados)
    anterior = porcentaje_positivo(anteriores_analizados)

    cambio = (
        round(actual - anterior, 1)
        if actual is not None and anterior is not None
        else None
    )

    return {
        "actual": actual,
        "anterior": anterior,
        "cambio_puntos": cambio,
    }

def calcular_comparacion_usuarios_activos() -> dict:
    ventanas = obtener_ventanas_comparables()

    if not ventanas:
        return {
            "total": 0,
            "actual": 0,
            "anterior": 0,
            "cambio_porcentual": None,
        }

    todas = obtener_interacciones_reales()

    actuales = obtener_interacciones_reales(
        desde_utc=ventanas["actual_desde"],
        hasta_utc=ventanas["actual_hasta"] + timedelta(seconds=1),
    )

    anteriores = obtener_interacciones_reales(
        desde_utc=ventanas["anterior_desde"],
        hasta_utc=ventanas["anterior_hasta"] + timedelta(seconds=1),
    )

    def autores_unicos(items):
        return {
            item.get("author_id")
            for item in items
            if item.get("author_id")
        }

    total = len(autores_unicos(todas))
    actual = len(autores_unicos(actuales))
    anterior = len(autores_unicos(anteriores))

    if anterior == 0:
        cambio = None
    else:
        cambio = round(
            ((actual - anterior) / anterior) * 100,
            1,
        )

    return {
        "total": total,
        "actual": actual,
        "anterior": anterior,
        "cambio_porcentual": cambio,
    }

def calcular_temas_detectados() -> dict:
    interacciones = obtener_interacciones_reales()

    analizados = [
        item
        for item in interacciones
        if item.get("estado") == "analizado"
        and item.get("tema")
    ]

    conteo = {}

    for item in analizados:
        tema = item["tema"]

        if tema == "OTRO":
            continue

        conteo[tema] = conteo.get(tema, 0) + 1

    return {
        "total": len(conteo),
        "distribucion": conteo,
    }
def calcular_temas_nuevos() -> dict:
    ventanas = obtener_ventanas_comparables()

    if not ventanas:
        return {
            "total": 0,
            "temas": [],
            "sin_base_comparativa": True,
        }

    actuales = obtener_interacciones_reales(
        desde_utc=ventanas["actual_desde"],
        hasta_utc=ventanas["actual_hasta"] + timedelta(seconds=1),
    )

    anteriores = obtener_interacciones_reales(
        desde_utc=ventanas["anterior_desde"],
        hasta_utc=ventanas["anterior_hasta"] + timedelta(seconds=1),
    )

    temas_actuales = {
        item.get("tema")
        for item in actuales
        if item.get("tema") and item.get("tema") != "OTRO"
    }

    temas_anteriores = {
        item.get("tema")
        for item in anteriores
        if item.get("tema") and item.get("tema") != "OTRO"
    }

    # Si no hubo mensajes en la ventana anterior,
    # no afirmamos que todos los temas actuales sean "nuevos".
    if not anteriores:
        return {
            "total": 0,
            "temas": [],
            "sin_base_comparativa": True,
        }

    nuevos = sorted(temas_actuales - temas_anteriores)

    return {
        "total": len(nuevos),
        "temas": nuevos,
        "sin_base_comparativa": False,
    }

def obtener_dashboard() -> dict:
    interacciones = obtener_interacciones_reales()

    analizados = [
        item
        for item in interacciones
        if item.get("estado") == "analizado"
    ]

    total_mensajes = len(interacciones)

    positivos = sum(
        1
        for item in analizados
        if item.get("sentimiento") == "Positivo"
    )

    sentimiento_positivo = (
        round((positivos / len(analizados)) * 100, 1)
        if analizados
        else 0.0
    )

    comparacion_mensajes = calcular_comparacion_mensajes()
    comparacion_sentimiento = calcular_comparacion_sentimiento()
    usuarios = calcular_comparacion_usuarios_activos()
    temas = calcular_temas_detectados()
    temas_nuevos = calcular_temas_nuevos()

    return {
        "messages_processed": total_mensajes,
        "messages_change": comparacion_mensajes["cambio_porcentual"],

        "total_audience": usuarios["total"],
        "audience_change": usuarios["cambio_porcentual"],

        "positive_sentiment": sentimiento_positivo,
        "sentiment_change": comparacion_sentimiento["cambio_puntos"],

        "topics_detected": temas["total"],
        "new_topics": temas_nuevos["total"],

        "content_generated": 0,
        "pending_approvals": 0,
    }

def obtener_distribucion_sentimiento() -> list[dict]:
    interacciones = obtener_interacciones_reales()

    analizados = [
        item
        for item in interacciones
        if item.get("estado") == "analizado"
        and item.get("sentimiento")
    ]

    total = len(analizados)

    conteo = {
        "Positivo": 0,
        "Neutral": 0,
        "Negativo": 0,
    }

    for item in analizados:
        sentimiento = item.get("sentimiento")

        if sentimiento in conteo:
            conteo[sentimiento] += 1

    if total == 0:
        return [
            {"name": nombre, "value": 0.0}
            for nombre in conteo
        ]

    return [
        {
            "name": nombre,
            "value": round((cantidad / total) * 100, 1),
        }
        for nombre, cantidad in conteo.items()
    ]

def obtener_distribucion_temas() -> list[dict]:
    datos = calcular_temas_detectados()
    distribucion = datos["distribucion"]

    total = sum(distribucion.values())

    if total == 0:
        return []

    return [
        {
            "topic": tema,
            "percentage": round((cantidad / total) * 100, 1),
        }
        for tema, cantidad in sorted(
            distribucion.items(),
            key=lambda item: item[1],
            reverse=True,
        )
    ]