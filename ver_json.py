"""
Esto reemplaza a ver_json_interacciones.py. Antes le pedía el JSON a la API con
requests.get(); ahora no hay ninguna API, así que llamo directo a listar_interacciones
y armo el mismo diccionario que antes devolvía GET /interacciones.
"""
import json

from base_datos import listar_interacciones


def obtener_json(canal=None, estado=None, limite=100) -> dict:
    """
    Regresa el mismo formato que antes daba GET /interacciones: un diccionario con
    "total" y "interacciones" (cada una con id, origen_comunidad, periodo_referencia,
    autor, canal, tipo, texto, estado, creado_en).
    """
    filas = listar_interacciones(canal, estado, limite)
    return {"total": len(filas), "interacciones": filas}


if __name__ == "__main__":
    paquete = obtener_json()
    # ensure_ascii=False para que los acentos y emojis salgan tal cual, no como \u00e9
    print(json.dumps(paquete, indent=2, ensure_ascii=False))
