"""
Anuncios para Discord a partir de un archivo .txt o .md.

Flujo:
1. La persona sube un archivo con el borrador del anuncio.
2. El LLM (Gemma 4) lo reescribe con la voz de marca de CloudEDTech.
3. La persona revisa/edita el texto y lo publica en el canal de anuncios
   de Discord mediante un webhook.

Variables de entorno (.env):
- GOOGLE_API_KEY: clave de Google AI Studio (la misma que usa cerebro_ia_gemma_4.py).
- GOOGLE_MODEL: modelo a usar (por defecto gemma-4-31b-it).
- DISCORD_WEBHOOK_ANUNCIOS: URL del webhook del canal de anuncios.
"""

import os
import json
import urllib.request
import urllib.error

from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate

load_dotenv()

LIMITE_DISCORD = 2000  # Discord no acepta mensajes de más de 2000 caracteres
EXTENSIONES_PERMITIDAS = ["txt", "md"]

# Reglas del Manual de Marca incluidas directamente en el prompt (sin RAG).
template_anuncio = """
ERES EL COPYWRITER OFICIAL DE CloudEDTech, UNA EMPRESA EDTECH LATINOAMERICANA DE FORMACIÓN
EN IA, CLOUD Y PROGRAMACIÓN. TU ÚNICO TRABAJO ES CONVERTIR UN BORRADOR EN UN ANUNCIO
PARA EL CANAL DE ANUNCIOS DE DISCORD.

<manual_de_marca>
## Voz (siempre igual)
Cercana · Clara · Experta · Motivadora · Responsable.

## Tono para anuncios en Discord
- Conversacional y de apoyo comunitario, moderadamente casual, ligeramente entusiasta.
- Siempre respetuoso; nunca irónico ni irreverente.
- Técnico accesible: usa términos precisos y explícalos si hace falta.

## Tratamiento y vocabulario
- Tutea siempre («tú», «tu», «te»). Nunca uses «usted».
- Prefiere: «tu ruta de aprendizaje», «logras», «aplicas», «competencias», «resultado»,
  «inserción laboral», «actualización continua».
- Prohibido: «usted», «sinergia», «soluciones disruptivas», «apalancar», «best-in-class»,
  «no te lo pierdas», frases vacías y promesas exageradas sin respaldo.

## Principios de redacción
1. Orientado a resultados: conecta con un beneficio concreto o una competencia aplicable.
2. Claridad primero: frases directas, voz activa, vocabulario preciso.
3. Transparencia: sé honesto sobre fechas, requisitos y resultados. No inventes datos.
4. Acción concreta: cierra con una llamada a la acción simple y clara.
5. Refleja al menos un pilar: Personas, Tecnología, Aplicabilidad, Innovación o Futuro.

## Ejemplo
- Evitar: «Potencia tu carrera con nuestra solución disruptiva de última generación.»
- Preferir: «Aprende las competencias de alta demanda que el mercado pide hoy y aplícalas de inmediato.»
- Evitar CTA: «No te lo pierdas.»
- Preferir CTA: «Revisa el programa completo y elige la ruta que mejor se adapta a tu objetivo profesional.»
</manual_de_marca>

<formato_discord>
- Máximo 1500 caracteres.
- Puedes usar Markdown de Discord: **negritas**, listas con guiones, encabezado con #.
- Máximo 2 emojis, solo si aportan.
- Estructura: gancho → información clave (qué, cuándo, dónde, para quién) → llamada a la acción.
- No uses @everyone ni @here.
</formato_discord>

<reglas>
- Conserva TODOS los datos del borrador (fechas, horas, enlaces, nombres). No inventes ninguno.
- Si al borrador le falta un dato importante, no lo inventes; redacta sin él.
- Responde ÚNICAMENTE con el texto final del anuncio, sin comentarios ni comillas.
</reglas>

<borrador>
{borrador}
</borrador>
"""

prompt_anuncio = PromptTemplate(input_variables=["borrador"], template=template_anuncio)


def leer_archivo(archivo_bytes: bytes) -> str:
    """Convierte el contenido del archivo subido a texto."""
    try:
        return archivo_bytes.decode("utf-8").strip()
    except UnicodeDecodeError:
        # Archivos guardados en Windows a veces usan otra codificación
        return archivo_bytes.decode("latin-1").strip()


def _crear_llm():
    """Crea el LLM solo cuando se necesita (así el módulo carga aunque falte la clave)."""
    from langchain_google_genai import ChatGoogleGenerativeAI

    return ChatGoogleGenerativeAI(
        model=os.getenv("GOOGLE_MODEL", "gemma-4-31b-it"),
        temperature=0.4,
        google_api_key=os.environ.get("GOOGLE_API_KEY"),
    )


def generar_anuncio(borrador: str, llm=None) -> str:
    """Envía el borrador al LLM y devuelve el anuncio con la voz de marca."""
    if not borrador.strip():
        raise ValueError("El archivo está vacío.")
    llm = llm or _crear_llm()
    respuesta = (prompt_anuncio | llm).invoke({"borrador": borrador})
    texto = respuesta.content if hasattr(respuesta, "content") else str(respuesta)
    # Algunos modelos devuelven el contenido como lista de bloques
    if isinstance(texto, list):
        texto = "".join(b.get("text", "") if isinstance(b, dict) else str(b) for b in texto)
    return texto.strip()


def publicar_en_discord(texto: str, webhook_url: str | None = None) -> None:
    """Publica el anuncio en el canal de Discord mediante un webhook."""
    webhook_url = webhook_url or os.environ.get("DISCORD_WEBHOOK_ANUNCIOS")
    if not webhook_url:
        raise ValueError("Falta DISCORD_WEBHOOK_ANUNCIOS en el archivo .env")
    if not texto.strip():
        raise ValueError("El anuncio está vacío.")
    if len(texto) > LIMITE_DISCORD:
        raise ValueError(f"El anuncio tiene {len(texto)} caracteres; Discord permite máximo {LIMITE_DISCORD}.")

    datos = json.dumps({
        "content": texto,
        "allowed_mentions": {"parse": []},  # evita menciones masivas accidentales
    }).encode("utf-8")
    peticion = urllib.request.Request(
        webhook_url,
        data=datos,
        headers={"Content-Type": "application/json", "User-Agent": "CommunityLab-Anuncios"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(peticion, timeout=15):
            pass  # Discord responde 204 (sin contenido) si todo salió bien
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Discord rechazó el mensaje (error {e.code}): {e.read().decode(errors='ignore')}")
