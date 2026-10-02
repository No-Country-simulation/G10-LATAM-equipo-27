"""
Se conecta con el bot, trae los últimos mensajes de los 4 canales y llama directo a
procesar_actividad (ya no hay POST ni endpoint: todo corre en el mismo proceso).
"""
import os

import discord
from dotenv import load_dotenv

from armar_json_bot_python import CANALES, construir_paquete
from base_datos import crear_tabla
from procesamiento import procesar_actividad

load_dotenv()

TOKEN = os.getenv("DISCORD_BOT_TOKEN")

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
        raise SystemExit("Falta DISCORD_BOT_TOKEN en el .env")
    crear_tabla()
    cliente.run(TOKEN)
