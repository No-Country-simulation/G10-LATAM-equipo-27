import discord
import json
import os
from dotenv import load_dotenv

# 1. Cargamos las claves de seguridad
load_dotenv()
TOKEN = os.getenv('DISCORD_TOKEN')

# 2. Configuramos los permisos del bot
intents = discord.Intents.default()
intents.message_content = True 
cliente = discord.Client(intents=intents)

# ==========================================
# ⚙️ CONFIGURACIÓN DEL FILTRO DE MARKETING
# ==========================================
# Escribe aquí los nombres exactos de los canales que SÍ quieres que la IA analice.
CANALES_PERMITIDOS = ["general", "preguntas", "chat-egresados", "oportunidades-laborales"]
LIMITE_POR_CANAL = 2  # Cuántos mensajes recientes queremos sacar de CADA canal permitido

@cliente.event
async def on_ready():
    print(f'✅ Conectado exitosamente como {cliente.user}')
    
    datos_json = {
        "origen_comunidad": "Discord_Bot_Directo",
        "interacciones": []
    }
    id_contador = 1
    
    print("Recolectando los mensajes de los canales objetivo...")
    
    for servidor in cliente.guilds:
        for canal in servidor.text_channels:
            
            # FILTRO: Si el canal no está en nuestra lista blanca, lo ignora y pasa al siguiente
            if canal.name not in CANALES_PERMITIDOS:
                continue
                
            try:
                # Extrae solo el límite definido de los canales que sí pasaron el filtro
                async for mensaje in canal.history(limit=LIMITE_POR_CANAL):
                    
                    if mensaje.author == cliente.user or not mensaje.content:
                        continue
                        
                    datos_json["interacciones"].append({
                        "id": id_contador,
                        "autor": mensaje.author.name,
                        "canal": canal.name,
                        "texto": mensaje.content
                    })
                    id_contador += 1
            except discord.errors.Forbidden:
                pass
                
    # Guardamos todo en el JSON
    with open('mock_data.json', 'w', encoding='utf-8') as archivo:
        json.dump(datos_json, archivo, ensure_ascii=False, indent=4)
        
    print(f"🎉 Recolección terminada. Se guardaron {id_contador - 1} mensajes reales.")
    
    # Apagamos el bot
    await cliente.close()

cliente.run(TOKEN)