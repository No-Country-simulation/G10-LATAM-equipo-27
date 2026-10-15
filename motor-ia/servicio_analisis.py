from base_datos import guardar_analisis, listar_interacciones
from cerebro_ia import cadena


def analizar_pendientes(limite: int = 20) -> dict:
    """
    Analiza mensajes pendientes con el motor de IA y guarda
    los KPIs directamente en SQLite.
    """
    mensajes = listar_interacciones(
        estado="pendiente",
        limite=limite,
    )

    analizados = 0
    errores = 0

    for mensaje in mensajes:
        try:
            respuesta = cadena.invoke(
                {
                    "texto": mensaje["texto"],
                    "canal": mensaje["canal"],
                }
            )

            kpis = respuesta.model_dump()

            guardado = guardar_analisis(
                mensaje["id"],
                kpis["relevancia"],
                kpis["sentimiento"],
                kpis["sentiment_score"],
                kpis["temas_clave"],
                kpis["tema"],
                kpis["segmento"],
                kpis["razonamiento"],
            )

            if guardado:
                analizados += 1
            else:
                errores += 1

        except Exception:
            errores += 1

    return {
        "status": "exito",
        "procesados": len(mensajes),
        "analizados": analizados,
        "errores": errores,
    }

def reanalizar_interacciones(ids: list[int]) -> dict:
    mensajes = listar_interacciones(limite=1000)

    seleccionados = [
        mensaje for mensaje in mensajes
        if mensaje["id"] in ids
    ]

    analizados = 0
    errores = 0

    for mensaje in seleccionados:
        try:
            respuesta = cadena.invoke({
                "texto": mensaje["texto"],
                "canal": mensaje["canal"]
            })

            kpis = respuesta.model_dump()

            guardado = guardar_analisis(
                mensaje["id"],
                kpis["relevancia"],
                kpis["sentimiento"],
                kpis["sentiment_score"],
                kpis["temas_clave"],
                kpis["tema"],
                kpis["segmento"],
                kpis["razonamiento"],
            )

            if guardado:
                analizados += 1
            else:
                errores += 1

        except Exception:
            errores += 1

    return {
        "status": "exito",
        "solicitados": len(ids),
        "encontrados": len(seleccionados),
        "analizados": analizados,
        "errores": errores,
    }


def preparar_copywriting_desde_analisis(
    ids_locales: list[int],
    *,
    permitir_conexion: bool = False,
) -> dict:
    """Prepara registros Copywriting sin escribir datos remotos."""
    from adaptador_copywriting import preparar_resultado_copywriting

    preparados = []
    errores = []

    for id_local in ids_locales:
        try:
            registro = preparar_resultado_copywriting(
                id_local,
                permitir_conexion=permitir_conexion,
            )
            preparados.append(registro)
        except Exception as exc:
            errores.append({
                "id_local": id_local,
                "error": str(exc),
            })

    return {
        "preparados": preparados,
        "errores": errores,
        "total_preparados": len(preparados),
        "total_errores": len(errores),
    }
