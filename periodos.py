"""
Todo lo que tiene que ver con fechas y semanas del proyecto vive aquí, en un solo
lugar, para que armar_json_bot_python.py (que calcula la semana de cada lote) y, más
adelante, ver_json.py (que filtra por periodo) nunca puedan quedar desalineados.
"""
from datetime import date, datetime, timedelta, timezone

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
