"""
Se conecta con el bot, trae los últimos mensajes de los 4 canales y llama directo a
procesar_actividad (ya no hay POST ni endpoint: todo corre en el mismo proceso).
"""
import os

import discord

from armar_json_bot_python import CANALES, construir_paquete
from base_datos import crear_tabla
from procesamiento import procesar_actividad

# el token se lee distinto según dónde corra el código, y así este mismo archivo sirve en los dos:
# - en Colab no hay .env: el token vive en Secrets (icono de llave), con un secreto llamado
#   DISCORD_BOT_TOKEN (o DISCORD_TOKEN) y "Notebook access" activado. Además Colab ya tiene su propio bucle de
#   eventos y choca con discord.py: nest_asyncio.apply() lo resuelve (sin eso, cliente.run
#   revienta con "RuntimeError: This event loop is already running")
# - en la PC: el token está en el archivo .env
try:
    from google.colab import userdata  # este módulo solo existe en Colab
except ImportError:
    from dotenv import load_dotenv

    # el .env se busca junto a este archivo, no en la carpeta desde la que se corra el programa
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
    # acepta los dos nombres: DISCORD_BOT_TOKEN (el de este proyecto) y DISCORD_TOKEN (el que usa app.py)
    TOKEN = os.getenv("DISCORD_BOT_TOKEN") or os.getenv("DISCORD_TOKEN")
else:
    import nest_asyncio

    nest_asyncio.apply()
    try:
        TOKEN = userdata.get("DISCORD_BOT_TOKEN")
    except Exception:
        TOKEN = userdata.get("DISCORD_TOKEN")

# None = leer todo el historial de cada canal. Con un límite (por ejemplo 20) se pierden los
# mensajes más viejos si un canal recibe más mensajes nuevos que ese número entre una corrida
# y la siguiente, y tampoco serviría para reconstruir la base desde Discord. Es seguro dejarlo
# sin límite porque procesar_actividad descarta lo que ya está guardado
LIMITE_POR_CANAL = None

intents = discord.Intents.default()
intents.message_content = True

cliente = discord.Client(intents=intents)


@cliente.event
async def on_ready():
    print(f"Conectado como {cliente.user}")

    mensajes_totales = []

    for canal_id in CANALES:
        canal = cliente.get_channel(int(canal_id))
        if canal is None:
            print(f"No encontré el canal con ID {canal_id} (¿el bot está en el servidor correcto?)")
            continue

        leidos = 0
        async for mensaje in canal.history(limit=LIMITE_POR_CANAL):
            mensajes_totales.append(mensaje)
            leidos += 1
        # así se ve cuántos mensajes leyó de cada canal (útil para saber si algo no llegó)
        print(f"{canal.name}: {leidos} mensajes leídos")

    paquete = construir_paquete(mensajes_totales)

    if paquete:
        print(f"Arme el paquete con {len(paquete['interacciones'])} interacciones, lo proceso...")
        # aquí está el cambio: en vez de requests.post(URL, json=paquete),
        # llamo directo a la función de procesamiento.py
        resultado = procesar_actividad(paquete)
        print(resultado)
    else:
        print("No encontré mensajes con texto para armar el paquete.")

    await cliente.close()


if __name__ == "__main__":
    if not TOKEN:
        raise SystemExit("Falta DISCORD_BOT_TOKEN o DISCORD_TOKEN (en el .env, o en Secrets si es Colab)")
    crear_tabla()
    cliente.run(TOKEN)
