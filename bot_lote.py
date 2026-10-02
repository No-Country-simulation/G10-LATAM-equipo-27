"""
Se conecta con el bot, trae los últimos mensajes de los 4 canales y llama directo a
procesar_actividad (ya no hay POST ni endpoint: todo corre en el mismo proceso).
"""
import discord
import nest_asyncio

from armar_json_bot_python import CANALES, construir_paquete
from base_datos import crear_tabla
from procesamiento import procesar_actividad

# resuelve el choque entre discord.py y el bucle de eventos que Colab ya tiene
# corriendo de fondo (sin esto, cliente.run(TOKEN) revienta con RuntimeError)
nest_asyncio.apply()

# el token vive en Colab Secrets (icono de llave), no en un .env como en la PC.
# primero: crear un secreto llamado DISCORD_BOT_TOKEN y activar "Notebook access"
import os
from dotenv import load_dotenv
load_dotenv()
TOKEN = os.environ.get('DISCORD_BOT_TOKEN')

LIMITE_POR_CANAL = 20

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

        async for mensaje in canal.history(limit=LIMITE_POR_CANAL):
            mensajes_totales.append(mensaje)

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
