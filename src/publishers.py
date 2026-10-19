import os
import requests
import tweepy
from src.config import config
from typing import Dict, Any
import time
import random
from functools import wraps

def retry_with_backoff(max_intentos=3, base_delay=1.0):
    """Reintento simple con backoff exponencial para rate-limits."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            ultimo_error = None
            for intento in range(1, max_intentos + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    ultimo_error = e
                    msg = str(e).lower()
                    if any(x in msg for x in ["rate", "429", "limit", "throttle", "timeout", "503", "502"]):
                        espera = (base_delay * (2 ** (intento - 1))) + random.uniform(0.1, 0.5)
                        print(f"⏳ Rate-limit/Error transitorio en {func.__name__} (intento {intento}/{max_intentos}). Esperando {espera:.1f}s...")
                        time.sleep(espera)
                    else:
                        break
            print(f"❌ {func.__name__} falló después de {max_intentos} intentos: {ultimo_error}")
            return False
        return wrapper
    return decorator

def enviar_webhook_discord(copys_generados: Dict[str, Any], autor: str = "Comunidad CloudEDTech", texto_original: str = "") -> bool:
    """
    Envía el copy a Discord (o canal de Reclamos) incluyendo una citación formal
    en bloque del mensaje original del usuario para dar contexto.
    Retorna True si el envío es exitoso o no hay ruta activa, False si falla.
    """
    canal_datos = copys_generados.get("discord") or copys_generados.get("reclamos")

    if not canal_datos:
        return True # Si no hay ruta de discord/reclamos activa, no bloquea

    # 🛠️ Corrección: Incluir "procesado" y manejar estados vacíos o de éxito
    status_copy = str(canal_datos.get("status", "")).lower()
    if status_copy == "error":
        return False
    if status_copy and status_copy not in ["success", "exito", "procesado"]:
        return True

    activos = canal_datos.get("activos_distribucion_generados", {})
    canal = activos.get("canal_seleccionado", "").lower()

    post_a_enviar = None
    webhook_url = None

    # Mapeo estricto de webhooks por canal
    if canal == "#general" or "general" in canal:
        post_a_enviar = activos.get("post_discord")
        webhook_url = config.DISCORD_WEBHOOK_GENERAL or config.get("DISCORD_WEBHOOK_GENERAL")
    elif canal == "#faq" or "faq" in canal:
        post_a_enviar = activos.get("post_discord_faq")
        webhook_url = config.DISCORD_WEBHOOK_FAQ or config.get("DISCORD_WEBHOOK_FAQ")
    elif canal == "#notificaciones" or "notificaciones" in canal:
        post_a_enviar = activos.get("post_discord_notificaciones")
        webhook_url = config.DISCORD_WEBHOOK_NOTIFICACIONES or config.get("DISCORD_WEBHOOK_NOTIFICACIONES")
    elif "pqrs" in canal or "reclamos" in copys_generados:
        post_a_enviar = activos.get("post_discord_pqrs")
        webhook_url = config.DISCORD_WEBHOOK_PQRS or config.get("DISCORD_WEBHOOK_PQRS")

    if not post_a_enviar and "post_discord_pqrs" in activos:
        post_a_enviar = activos.get("post_discord_pqrs")
        webhook_url = config.DISCORD_WEBHOOK_PQRS or config.get("DISCORD_WEBHOOK_PQRS")

    if not webhook_url:
        print(f"⚠️ Discord: Webhook no configurado para el canal '{canal}'. Revisa variables DISCORD_WEBHOOK_* en .env")
        return False

    if not post_a_enviar or not webhook_url:
        print("⚠️ Discord: Falta contenido estructurado o URL de Webhook en las variables de entorno.")
        return False

    titulo = post_a_enviar.get("titulo", "Actualización CloudEDTech")
    texto = post_a_enviar.get("texto_copy", "")

    # 💬 Cita resumida e inteligente (máximo 110 caracteres para dar contexto sin saturar)
    if texto_original:
        texto_snippet = (texto_original[:110] + "...") if len(texto_original) > 110 else texto_original
        citacion = f"> 💬 **Contexto de @{autor}:** *\"{texto_snippet}\"*\n\n"
    else:
        citacion = ""

    mensaje_completo = f"{citacion}**{titulo}**\n\n{texto}"
    payload = {"content": mensaje_completo}

    try:
        print(f"🌐 Enviando petición POST al Webhook de Discord con citación de contexto...")
        response = requests.post(webhook_url, json=payload)
        if response.status_code in [200, 204]:
            print("✅ ¡Publicado con éxito en Discord con contexto!")
            return True
        else:
            print(f"❌ Error en Discord | Código: {response.status_code} | Respuesta: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Excepción crítica en Discord: {e}")
        return False

@retry_with_backoff(max_intentos=3)
def enviar_tweet_x(copys_generados: Dict[str, Any]) -> bool:
    """
    Publica un tweet utilizando la API v2 de X (Twitter) vía tweepy.
    Retorna True si es exitoso, False si falla.
    """
    x_datos = copys_generados.get("x")
    if not x_datos:
        return True

    status_copy = str(x_datos.get("status", "")).lower()
    if status_copy not in ["success", "exito", "exitoso"]:
        print(f"⚠️ X omitido por estado no exitoso: {status_copy}")
        return True

    activos = x_datos.get("activos_distribucion_generados", {})
    post_x = activos.get("post_postx", {})

    if not post_x:
        print("⚠️ X (Twitter): No se encontró contenido estructurado en post_postx.")
        return False

    titulo = post_x.get("titulo", "")
    texto = post_x.get("texto_copy", "")
    tweet_mensaje = f"{titulo}\n\n{texto}"

    if len(tweet_mensaje) > 280:
        print(f"⚠️ X: Tweet demasiado largo ({len(tweet_mensaje)} chars). Se truncará a 277 + '...'")
        tweet_mensaje = tweet_mensaje[:277] + "..."

    api_key = config.X_API_KEY or config.get("X_API_KEY")
    api_secret = config.X_API_SECRET or config.get("X_API_SECRET")
    access_token = config.X_ACCESS_TOKEN or config.get("X_ACCESS_TOKEN")
    access_token_secret = config.X_ACCESS_TOKEN_SECRET or config.get("X_ACCESS_TOKEN_SECRET")

    if not all([api_key, api_secret, access_token, access_token_secret]):
        print("⚠️ X (Twitter): Faltan credenciales en variables de entorno.")
        return False

    try:
        print("🐦 Conectando con la API de X (Twitter v2)...")
        client = tweepy.Client(
            consumer_key=api_key,
            consumer_secret=api_secret,
            access_token=access_token,
            access_token_secret=access_token_secret
        )
        response = client.create_tweet(text=tweet_mensaje)
        print(f"✅ ¡Publicado con éxito en X! ID: {response.data['id']}")
        return True
    except Exception as e:
        print(f"❌ Error al publicar en X: {e}")
        return False

@retry_with_backoff(max_intentos=3)
def enviar_linkedin(copys_generados: Dict[str, Any]) -> bool:
    """
    Envía el copy a LinkedIn usando la API corporativa y retorna True si es exitoso, False si falla.
    """
    lk_datos = copys_generados.get("linkedin")

    if not lk_datos:
        return True

    status_copy = str(lk_datos.get("status", "")).lower()
    if status_copy not in ["success", "exito"]:
        return True

    activos = lk_datos.get("activos_distribucion_generados", {})
    post_lk = activos.get("post_linkedin", {})

    if not post_lk:
        print("⚠️ LinkedIn: No se encontró contenido estructurado en post_linkedin.")
        return False

    titulo = post_lk.get("titulo", "")
    texto = post_lk.get("texto_copy", "")
    mensaje_completo = f"{titulo}\n\n{texto}"

    access_token = (config.LINKEDIN_ACCESS_TOKEN or config.get("LINKEDIN_ACCESS_TOKEN", "")).strip().replace('\"', '')
    author_urn = (config.LINKEDIN_AUTHOR_URN or config.get("LINKEDIN_AUTHOR_URN", "")).strip().replace('\"', '')

    if not access_token or not author_urn:
        print("⚠️ LinkedIn: Faltan credenciales (LINKEDIN_ACCESS_TOKEN o LINKEDIN_AUTHOR_URN).")
        return False

    if not author_urn.startswith("urn:li:"):
        author_urn = f"urn:li:person:{author_urn}"

    try:
        print(f"💼 Conectando con la API de LinkedIn para URN: {author_urn}...")
        url = "https://api.linkedin.com/v2/ugcPosts"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0"
        }
        payload = {
            "author": author_urn,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {"text": mensaje_completo},
                    "shareMediaCategory": "NONE"
                }
            },
            "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"}
        }

        response = requests.post(url, headers=headers, json=payload)
        if response.status_code in [200, 201]:
            print("✅ ¡Publicado con éxito en LinkedIn!")
            return True
        else:
            print(f"❌ Error en LinkedIn | Código: {response.status_code} | Respuesta: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Excepción crítica en LinkedIn: {e}")
        return False