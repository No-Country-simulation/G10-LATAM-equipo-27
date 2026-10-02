"""
Esto reemplaza a ver_json_interacciones.py. Antes le pedía el JSON a la API con
requests.get(); ahora no hay ninguna API, así que llamo directo a listar_interacciones
y armo el diccionario con las interacciones guardadas, opcionalmente de un solo periodo.
"""
import argparse
import json

from base_datos import listar_interacciones
from periodos import como_fecha, fechas_de_semanas, limites_utc, nombre_zona


def obtener_json(canal=None, estado=None, limite="auto", desde=None, hasta=None,
                 semana_desde=None, semana_hasta=None) -> dict:
    """
    Regresa un diccionario con "total", "periodo" e "interacciones" (cada una con id,
    origen_comunidad, periodo_referencia, autor, canal, tipo, texto, enviado_en, estado,
    creado_en). Sin argumentos regresa todo, como siempre.

    El periodo se pide con fechas o con semanas del proyecto (no con las dos a la vez), y se
    filtra por enviado_en, la fecha real de envío en Discord:
        obtener_json(semana_desde=2, semana_hasta=3)         semanas completas
        obtener_json(semana_desde=2)                         de la semana 2 en adelante
        obtener_json(desde="2026-09-24", hasta="2026-10-03") fechas, por ejemplo semana y media
    Las fechas cuentan completas (hasta incluye todo ese día) y en hora del proyecto (UTC-6).

    limite: con "auto" son los 100 más recientes, pero sin tope cuando se pide un periodo.
    Si lo pasas tú, se respeta tal cual (None = sin tope).
    """
    pidio_semanas = semana_desde is not None or semana_hasta is not None
    pidio_fechas = desde is not None or hasta is not None
    if pidio_semanas and pidio_fechas:
        raise ValueError(
            "Pide el periodo con fechas (desde/hasta) o con semanas (semana_desde/semana_hasta), "
            "no con las dos a la vez"
        )
    if pidio_semanas:
        desde, hasta = fechas_de_semanas(semana_desde, semana_hasta)

    desde_utc, hasta_utc = limites_utc(desde, hasta)

    pidio_periodo = pidio_semanas or pidio_fechas
    if limite == "auto":
        limite = None if pidio_periodo else 100

    filas = listar_interacciones(canal, estado, limite, desde_utc, hasta_utc)

    periodo = None
    if pidio_periodo:
        # las fechas ya resueltas (None = sin límite de ese lado), para que quien lea el JSON
        # sepa qué días abarca, incluso cuando se pidió por semanas
        periodo = {
            "desde": str(como_fecha(desde)) if desde is not None else None,
            "hasta": str(como_fecha(hasta)) if hasta is not None else None,
            "zona_horaria": nombre_zona(),
        }
    return {"total": len(filas), "periodo": periodo, "interacciones": filas}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Imprime las interacciones guardadas como JSON.")
    parser.add_argument("--desde", help="primer día, AAAA-MM-DD")
    parser.add_argument("--hasta", help="último día (incluido), AAAA-MM-DD")
    parser.add_argument("--semana-desde", type=int, help="primera semana del proyecto")
    parser.add_argument("--semana-hasta", type=int, help="última semana del proyecto (incluida)")
    parser.add_argument("--canal", help='solo ese canal, entre comillas, por ejemplo "#general"')
    args = parser.parse_args()
    try:
        paquete = obtener_json(canal=args.canal, desde=args.desde, hasta=args.hasta,
                               semana_desde=args.semana_desde, semana_hasta=args.semana_hasta)
    except ValueError as error:
        raise SystemExit(f"Error: {error}")
    # ensure_ascii=False para que los acentos y emojis salgan tal cual, no como \u00e9
    print(json.dumps(paquete, indent=2, ensure_ascii=False))
