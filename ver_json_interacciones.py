"""
Muestra el JSON completo de lo guardado (origen_comunidad, periodo_referencia, tipo,
estado, etc., por cada interacción), tal cual lo entrega GET /interacciones, sin
pasar por pandas ni armar una tabla.
"""
import json

import requests

# dirección del endpoint; si se usa el túnel, cambiar esta línea por la dirección
# que imprime cloudflared
URL = "http://127.0.0.1:8000/interacciones"


def main() -> None:
    respuesta = requests.get(URL)
    respuesta.raise_for_status()

    paquete = respuesta.json()

    # ensure_ascii=False para que los acentos y emojis salgan tal cual, no como \u00e9
    print(json.dumps(paquete, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
