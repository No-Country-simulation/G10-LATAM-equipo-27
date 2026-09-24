"""
Este es el reemplazo, en Python, de los pasos 1 y 2 del flujo que tenía en n8n
(Schedule Trigger + Get Many de Discord). Se conecta con el bot, trae los últimos
mensajes de los 4 canales y arma el paquete con construir_paquete (armar_json_bot_python.py).
Todavía no lo dejé mandando nada al endpoint: por ahora solo imprime el paquete armado,
para revisar que salga bien antes de conectarlo con requests.post.
"""
import os

import discord
import requests
from dotenv import load_dotenv

from armar_json_bot_python import CANALES, construir_paquete

load_dotenv()

TOKEN = os.getenv("DISCORD_BOT_TOKEN")

# la misma dirección que le pondría al nodo HTTP Request en n8n
URL_ENDPOINT = "http://127.0.0.1:8000/procesar-actividad"

# cuántos mensajes recientes traigo de cada canal (equivalente al "Limit: 20" que
# le puse al nodo Get Many en n8n)
LIMITE_POR_CANAL = 20

# necesito este permiso para que el bot pueda leer el texto de los mensajes,
# es lo mismo que activé como "Message Content Intent" en el portal de Discord
intents = discord.Intents.default()
intents.message_content = True

cliente = discord.Client(intents=intents)


@cliente.event
async def on_ready():
    print(f"Conectado como {cliente.user}")

    mensajes_totales = []

    # recorro los canales por su ID (los mismos que usé en el nodo Code de n8n)
    for canal_id in CANALES:
        canal = cliente.get_channel(int(canal_id))
        if canal is None:
            print(f"No encontré el canal con ID {canal_id} (¿el bot está en el servidor correcto?)")
            continue

        # history() trae los mensajes más recientes primero, igual que el nodo Get Many
        async for mensaje in canal.history(limit=LIMITE_POR_CANAL):
            mensajes_totales.append(mensaje)

    paquete = construir_paquete(mensajes_totales)

    if paquete:
        print(f"Arme el paquete con {len(paquete['interacciones'])} interacciones, lo mando al endpoint...")
        respuesta = requests.post(URL_ENDPOINT, json=paquete)
        print(respuesta.status_code, respuesta.json())
    else:
        print("No encontré mensajes con texto para armar el paquete.")

    # cierro la conexión: este script es un lote, no se queda escuchando
    await cliente.close()


if __name__ == "__main__":
    if not TOKEN:
        raise SystemExit("Falta DISCORD_BOT_TOKEN en el .env")
    cliente.run(TOKEN)
