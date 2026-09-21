import requests
import pandas as pd

# dirección del endpoint; si uso el túnel, cambio esta línea por la dirección que imprime cloudflared
URL = "http://127.0.0.1:8000/interacciones"

respuesta = requests.get(URL, params={"estado": "pendiente"})
respuesta.raise_for_status()

# convierto la lista de diccionarios que regresa la API en una tabla de pandas
df = pd.DataFrame(respuesta.json()["interacciones"])

if df.empty:
    print("No hay interacciones pendientes.")
    raise SystemExit

print(f"Total: {len(df)}")
# max_colwidth recorta los textos largos para que la tabla quepa en la terminal
print(df[["id", "canal", "autor", "estado", "texto"]].to_string(index=False, max_colwidth=60))
