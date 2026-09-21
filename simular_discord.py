"""
Publica conversaciones simuladas en el servidor de Discord de prueba.

Cada canal necesita su propio webhook (un webhook solo publica en el canal donde
se creó). El truco: el campo "username" de un webhook permite que cada mensaje
aparezca con un autor distinto, así se simulan varios usuarios con una sola URL.

Uso:
    python simular_discord.py              # publica los 15 mensajes
    python simular_discord.py --duplicado  # además repite el primero (prueba de dedupe)

.env necesario (una URL por canal):
    DISCORD_WEBHOOK_GENERAL=https://discord.com/api/webhooks/...
    DISCORD_WEBHOOK_PREGUNTAS=https://discord.com/api/webhooks/...
    DISCORD_WEBHOOK_CHAT_EGRESADOS=https://discord.com/api/webhooks/...
    DISCORD_WEBHOOK_OPORTUNIDADES_LABORALES=https://discord.com/api/webhooks/...
"""
import os
import sys
import time

import requests
from dotenv import load_dotenv

load_dotenv()

WEBHOOKS = {
    "general": os.getenv("DISCORD_WEBHOOK_GENERAL"),
    "preguntas": os.getenv("DISCORD_WEBHOOK_PREGUNTAS"),
    "chat-egresados": os.getenv("DISCORD_WEBHOOK_CHAT_EGRESADOS"),
    "oportunidades-laborales": os.getenv("DISCORD_WEBHOOK_OPORTUNIDADES_LABORALES"),
}

# "esperado" NO se publica: es la clasificación que debería dar la IA más adelante,
# para poder comparar contra su salida (tipo, sentimiento, relevancia).
MENSAJES = [
    # ---- #oportunidades-laborales ----
    {
        "canal": "oportunidades-laborales",
        "autor": "Mariana Souza",
        "texto": "¡Comunidad, quedé seleccionada para el puesto de Desarrolladora Junior de IA! El proyecto del curso de LangChain y OCI que subí a mi portafolio marcó toda la diferencia en la entrevista técnica. ¡Muchas gracias por todo el apoyo!",
        "esperado": "testimonio | muy positivo | relevancia alta",
    },
    {
        "canal": "oportunidades-laborales",
        "autor": "Diego Herrera",
        "texto": "Comparto una vacante: mi empresa busca practicante de datos en Guadalajara, modalidad híbrida. Piden Python y SQL básico. Si les interesa les paso el contacto.",
        "esperado": "oportunidad | neutro | relevancia media",
    },
    {
        "canal": "oportunidades-laborales",
        "autor": "Camila Ortiz",
        "texto": "Llevo tres semanas mandando CVs y no me han respondido de ninguno. Estoy algo desanimada, ¿alguien sabe si vale la pena poner los proyectos del curso en el CV?",
        "esperado": "duda / apoyo | negativo | relevancia media",
    },
    {
        "canal": "oportunidades-laborales",
        "autor": "Andrés Paredes",
        "texto": "Hoy tuve mi primera entrevista técnica gracias a los tips de la comunidad. Me pidieron explicar cómo funciona un agente ReAct y pude hacerlo. ¡Increíble!",
        "esperado": "testimonio | muy positivo | relevancia alta",
    },
    # ---- #chat-egresados ----
    {
        "canal": "chat-egresados",
        "autor": "Valeria Núñez",
        "texto": "Terminé la formación hoy 🎉 Gracias a todos los mentores, aprendí muchísimo de RAG y de agentes. ¡Ya quiero seguir con la siguiente ruta!",
        "esperado": "testimonio | muy positivo | relevancia alta",
    },
    {
        "canal": "chat-egresados",
        "autor": "Lucas Albuquerque",
        "texto": "Egresados, ¿alguien quiere armar un grupo de estudio los sábados para practicar preguntas de entrevista?",
        "esperado": "propuesta | positivo | relevancia media",
    },
    {
        "canal": "chat-egresados",
        "autor": "Sofía Ramírez",
        "texto": "Sinceramente el módulo de despliegue en la nube me pareció confuso, sentí que faltaron ejemplos paso a paso. Espero que lo mejoren.",
        "esperado": "feedback / crítica | negativo | relevancia media",
    },
    # ---- #preguntas ----
    {
        "canal": "preguntas",
        "autor": "Lucas Albuquerque",
        "texto": "Tengo dudas sobre cómo estructurar los nodos condicionales en LangGraph cuando la respuesta del LLM necesita reintento. ¿Alguien tiene un ejemplo práctico de router?",
        "esperado": "pregunta_tecnica | neutro | relevancia alta (FAQ)",
    },
    {
        "canal": "preguntas",
        "autor": "Mateo Díaz",
        "texto": "¿Cómo subo un archivo a OCI Object Storage desde Python? Me sale error de autenticación con el SDK y no encuentro qué falta en el archivo de configuración.",
        "esperado": "pregunta_tecnica | neutro | relevancia alta (FAQ)",
    },
    {
        "canal": "preguntas",
        "autor": "Renata Flores",
        "texto": "En n8n el nodo HTTP Request me da error 422 al enviar el JSON a mi API de FastAPI. ¿Qué puede estar mal en el body?",
        "esperado": "pregunta_tecnica | neutro | relevancia alta (FAQ)",
    },
    {
        "canal": "preguntas",
        "autor": "Iván Salazar",
        "texto": "¿Qué diferencia hay entre usar RecursiveCharacterTextSplitter y CharacterTextSplitter para RAG? ¿Cuándo conviene cada uno?",
        "esperado": "pregunta_tecnica | neutro | relevancia media",
    },
    # ---- #general (ruido: debería descartarse) ----
    {
        "canal": "general",
        "autor": "Paola Vega",
        "texto": "Buenos días a todos 👋",
        "esperado": "conversación casual | neutro | relevancia baja (descartar)",
    },
    {
        "canal": "general",
        "autor": "Diego Herrera",
        "texto": "¿A qué hora es la sesión en vivo de hoy?",
        "esperado": "logística | neutro | relevancia baja (descartar)",
    },
    {
        "canal": "general",
        "autor": "Camila Ortiz",
        "texto": "Jajaja qué buen meme el de anoche",
        "esperado": "conversación casual | positivo | relevancia baja (descartar)",
    },
    {
        "canal": "general",
        "autor": "Mariana Souza",
        "texto": "Recuerden que mañana cierra el plazo para entregar el proyecto del hackathon. ¡Mucho ánimo, equipo! 💪",
        "esperado": "aviso | positivo | relevancia media",
    },
]


def publicar(canal: str, autor: str, texto: str) -> None:
    respuesta = requests.post(
        WEBHOOKS[canal],
        json={
            "username": autor,  # nombre que se ve en Discord para este mensaje
            "content": texto,
            "allowed_mentions": {"parse": []},  # evita pings accidentales
        },
        timeout=15,
    )
    respuesta.raise_for_status()


def main() -> None:
    faltantes = [c for c, url in WEBHOOKS.items() if not url]
    if faltantes:
        sys.exit(f"Faltan webhooks en el .env para los canales: {', '.join(faltantes)}")

    mensajes = list(MENSAJES)
    if "--duplicado" in sys.argv:
        mensajes.append(MENSAJES[0])  # mismo mensaje otra vez, para probar el dedupe

    for i, m in enumerate(mensajes, start=1):
        publicar(m["canal"], m["autor"], m["texto"])
        print(f"[{i}/{len(mensajes)}] #{m['canal']} · {m['autor']}")
        time.sleep(1.5)  # respeta el límite de peticiones de Discord

    print("Listo.")


if __name__ == "__main__":
    main()