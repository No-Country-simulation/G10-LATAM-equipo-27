"""Preparacion de registros IA sin escrituras a Supabase."""


def preparar_registro_supabase(item: dict, decision: str) -> dict:
    if not isinstance(item, dict):
        raise TypeError("El registro debe ser un diccionario.")

    if decision not in ("aprobado", "descartado"):
        raise ValueError("Decision IA no valida.")

    id_supabase = item.get("id_supabase")
    if type(id_supabase) is not int or id_supabase <= 0:
        raise ValueError("ID Supabase invalido.")

    if item.get("identidad_validada") is not True:
        raise ValueError("Identidad Supabase no validada.")

    kpis = item.get("kpis") or {}
    if not isinstance(kpis, dict):
        raise TypeError("Los KPIs deben ser un diccionario.")

    return {
        "id_mensaje": id_supabase,
        "autor": item.get("autor", "Desconocido"),
        "canal_origen": item.get("canal_origen"),
        "comunidad": item.get("comunidad"),
        "semana": item.get("semana"),
        "fecha_envio": item.get("fecha_envio"),
        "fecha_extraccion": item.get("fecha_extraccion"),
        "modelo_ia": item.get("modelo_ia"),
        "texto_original": item.get("texto_original"),
        "relevancia": kpis.get("relevancia"),
        "sentimiento": kpis.get("sentimiento"),
        "temas_clave": kpis.get("temas_clave"),
        "segmento": kpis.get("segmento"),
        "razonamiento": kpis.get("razonamiento"),
        "decision_ia": decision,
    }


def preparar_paquete_supabase(paquete_maestro: dict) -> list[dict]:
    if not isinstance(paquete_maestro, dict):
        raise TypeError("El paquete maestro debe ser un diccionario.")

    registros = []
    ids_vistos = set()

    for decision, grupo in (
        ("aprobado", "aprobados"),
        ("descartado", "descartados"),
    ):
        items = paquete_maestro.get(grupo, [])
        if not isinstance(items, list):
            raise TypeError("Cada grupo debe ser una lista.")

        for item in items:
            registro = preparar_registro_supabase(item, decision)
            identificador = registro["id_mensaje"]

            if identificador in ids_vistos:
                raise ValueError("ID Supabase duplicado.")

            ids_vistos.add(identificador)
            registros.append(registro)

    return registros
