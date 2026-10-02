"""
Todo lo que tiene que ver con fechas y semanas del proyecto vive aquí, en un solo
lugar, para que armar_json_bot_python.py (que calcula la semana de cada lote) y, más
adelante, ver_json.py (que filtra por periodo) nunca puedan quedar desalineados.
"""
from datetime import date, datetime, time, timedelta, timezone

# el proyecto cuenta las semanas desde este lunes; todo lo anterior cuenta como Semana_01
FECHA_INICIO = date(2026, 9, 21)

# hora de referencia del proyecto: Guadalajara/CDMX, UTC-6 (sin horario de verano desde 2022).
# Discord entrega las fechas en UTC; sin esta conversión, un mensaje del domingo a las 8 p.m.
# ya sería lunes en UTC y caería en la semana siguiente
ZONA_PROYECTO = timezone(timedelta(hours=-6))


def a_utc_iso(fecha: datetime) -> str:
    """
    Fecha de envío en el formato exacto que se guarda en la base: UTC, sin fracciones
    de segundo, por ejemplo "2026-09-20T19:38:53+00:00". Que todas tengan el mismo
    formato es lo que permite después compararlas como texto para filtrar por periodo.
    """
    if fecha.tzinfo is None:
        # por si llegara una fecha sin zona horaria, la tomo como UTC (así las entrega Discord)
        fecha = fecha.replace(tzinfo=timezone.utc)
    return fecha.astimezone(timezone.utc).isoformat(timespec="seconds")


def semana_de(fecha: datetime) -> int:
    """
    Número de semana del proyecto (1, 2, 3...) de una fecha con zona horaria.
    Las semanas van de lunes a domingo, en hora del proyecto, empezando el lunes de
    FECHA_INICIO. Todo lo anterior a esa fecha cuenta como semana 1.
    """
    if fecha.tzinfo is None:
        fecha = fecha.replace(tzinfo=timezone.utc)
    dia_local = fecha.astimezone(ZONA_PROYECTO).date()
    dias_desde_inicio = (dia_local - FECHA_INICIO).days
    # max(..., 0) es lo que hace que los mensajes anteriores al inicio caigan en la semana 1
    return max(dias_desde_inicio, 0) // 7 + 1


def periodo_de(enviado_en: str | None, por_defecto: str) -> str:
    """
    Etiqueta de semana (Semana_01, Semana_02...) de UN mensaje, calculada con su propia
    fecha de envío. Si el mensaje no trae fecha (por ejemplo un paquete armado a mano) o la
    fecha no se puede leer, uso la etiqueta del lote (por_defecto).
    """
    if not enviado_en:
        return por_defecto
    try:
        fecha = datetime.fromisoformat(enviado_en)
    except ValueError:
        return por_defecto
    return f"Semana_{semana_de(fecha):02d}"


def nombre_zona() -> str:
    """La zona de referencia del proyecto como texto, por ejemplo "UTC-6"."""
    horas = ZONA_PROYECTO.utcoffset(None).total_seconds() / 3600
    return f"UTC{int(horas):+d}"


def como_fecha(valor) -> date:
    """
    Acepta "AAAA-MM-DD", un date o un datetime y regresa la fecha. Un datetime con zona
    horaria se pasa primero a la hora del proyecto, para que caiga en el día correcto.
    """
    if isinstance(valor, datetime):
        if valor.tzinfo is not None:
            valor = valor.astimezone(ZONA_PROYECTO)
        return valor.date()
    if isinstance(valor, date):
        return valor
    try:
        return date.fromisoformat(valor)
    except (TypeError, ValueError):
        raise ValueError(
            f"{valor!r} no es una fecha válida; usa el formato AAAA-MM-DD, por ejemplo 2026-09-28"
        ) from None


def limites_utc(desde=None, hasta=None) -> tuple:
    """
    Convierte un rango de días (en hora del proyecto) en dos cortes UTC para filtrar enviado_en.
    Los dos días cuentan completos: "hasta" incluye todo ese día, así que su corte es la
    medianoche del día siguiente (que ya no entra). Cualquiera de los dos puede faltar.
    """
    d = como_fecha(desde) if desde is not None else None
    h = como_fecha(hasta) if hasta is not None else None
    if d is not None and h is not None and d > h:
        raise ValueError(f"'desde' ({d}) es posterior a 'hasta' ({h})")
    desde_utc = a_utc_iso(datetime.combine(d, time.min, tzinfo=ZONA_PROYECTO)) if d else None
    hasta_utc = (
        a_utc_iso(datetime.combine(h + timedelta(days=1), time.min, tzinfo=ZONA_PROYECTO)) if h else None
    )
    return desde_utc, hasta_utc


def fechas_de_semanas(semana_desde=None, semana_hasta=None) -> tuple:
    """
    Traduce semanas del proyecto a un rango de días (desde, hasta), los dos incluidos.
    La semana 1 no tiene límite inferior, porque absorbe todo lo anterior al inicio
    (igual que semana_de). Cualquiera de los dos puede faltar.
    """
    for nombre, valor in (("semana_desde", semana_desde), ("semana_hasta", semana_hasta)):
        if valor is not None and (isinstance(valor, bool) or not isinstance(valor, int) or valor < 1):
            raise ValueError(f"{nombre} debe ser un número entero desde 1 (recibí {valor!r})")
    if semana_desde is not None and semana_hasta is not None and semana_desde > semana_hasta:
        raise ValueError(f"semana_desde ({semana_desde}) es posterior a semana_hasta ({semana_hasta})")
    desde = FECHA_INICIO + timedelta(weeks=semana_desde - 1) if semana_desde and semana_desde > 1 else None
    hasta = FECHA_INICIO + timedelta(weeks=semana_hasta) - timedelta(days=1) if semana_hasta else None
    return desde, hasta
