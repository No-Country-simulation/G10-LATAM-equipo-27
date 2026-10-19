import os
import json
import time
import re
import random
import asyncio
import concurrent.futures
import psycopg
from google.genai import types

from src.schemas import (
    AgentState,
    RouterOutput,
    RespuestaComunidadLinkedin,
    RespuestaComunidadX,
    RespuestaComunidadDiscord,
    RespuestaComunidadPQRS,
)
from src.database import actualizar_estado_lote
from src.publishers import enviar_webhook_discord, enviar_tweet_x, enviar_linkedin
from src.gemma import genai_client, generar_con_gemma_resiliente, extraer_json_seguro
from src.config import config

from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI

print("🚀 Integrando estado con soporte paralelo (operator.ior), matriz defensiva y lógica detallada...\n")

# ==========================================
# 2. INICIALIZACIÓN ESTRICTA DE MODELOS (MATRIZ DEFENSIVA)
# ==========================================

# Modelos base Google AI Studio
llm_gemini_36_flash = ChatGoogleGenerativeAI(model="gemini-3.6-flash", temperature=0.2, google_api_key=config.GEMINI_API_KEY)
llm_gemini_35_flash_lite = ChatGoogleGenerativeAI(model="gemini-3.5-flash-lite", google_api_key=config.GEMINI_API_KEY)
llm_gemini_31_flash_lite = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite", google_api_key=config.GEMINI_API_KEY)

# Modelos base Groq
llm_groq_qwen = ChatGroq(model_name="qwen/qwen3.8-27b", temperature=0.2, max_tokens=700, groq_api_key=config.GROQ_API_KEY)
llm_groq_gpt_oss = ChatGroq(model_name="openai/gpt-oss-120b", temperature=0.7, max_tokens=1200, groq_api_key=config.GROQ_API_KEY)

# ==========================================
# 3. CONFIGURACIÓN DE RESPALDOS (FALLBACKS)
# ==========================================

orquestador_llm = llm_groq_qwen.with_fallbacks([llm_gemini_36_flash])
canal_x_llm = llm_gemini_35_flash_lite.with_fallbacks([llm_gemini_31_flash_lite])
canal_discord_llm = llm_groq_gpt_oss.with_fallbacks([llm_gemini_31_flash_lite])
canal_linkedin_llm = llm_gemini_35_flash_lite.with_fallbacks([llm_gemini_31_flash_lite])
canal_reclamos_llm = llm_groq_qwen.with_fallbacks([llm_gemini_31_flash_lite])
validador_llm = llm_groq_gpt_oss.with_fallbacks([llm_gemini_36_flash])


# ==========================================
# 4. DEFINICIÓN DE NODOS
# ==========================================

def nodo_orquestador(state: AgentState):
    print("🧠 Ejecutando Orquestador Inteligente con matriz de 4 prioridades y Few-Shot avanzado...")
    try:
        datos = state["json_precurado"]
        id_msg = state["id_mensaje"]
        estado_revision = str(datos.get("estado_revision", "pendiente")).lower()

        try:
            relevancia = int(float(datos.get("relevancia") or 0))
        except (ValueError, TypeError):
            relevancia = 0

        sentimiento = str(datos.get("sentimiento", "Neutro")).lower()
        texto_original = str(datos.get("texto_original", "")).strip()

        # =========================================================
        # 🚫 PRIORIDAD 4 PRIMERO (pendiente O rechazado)
        # =========================================================
        es_spam_real = (
            relevancia <= 10
            or len(texto_original) < 3
            or "select" in texto_original.lower()
            or "credenciales" in texto_original.lower()
        )
        if es_spam_real:
            print(f"🚫 [Prioridad 4] ID: {id_msg} spam/sin valor (rel={relevancia}). → desaprobado.")
            actualizar_estado_lote(id_msg, "desaprobado")
            return {"rutas_activas": []}

        # =========================================================
        # 🔄 Reevaluación de RECHAZADOS (solo si NO son spam)
        # =========================================================
        if estado_revision == "rechazado":
            if relevancia >= 35:
                print(f"✨ [Rescate] ID: {id_msg} rechazado pero rel alta ({relevancia}).")
                if 35 <= relevancia < 70:
                    print(f"🔄 [Prioridad 2 - Rescatado] → discord HITL.")
                    return {"rutas_activas": ["discord"]}
            else:
                print(f"⚡ [Reevaluación] ID: {id_msg} rechazado, rel={relevancia} → Gemma.")
                return {"rutas_activas": ["gemma_automatico"]}

        # =========================================================
        # ⚡ PRIORIDAD 3: Baja relevancia útil (11–34) → Gemma
        # =========================================================
        if 10 < relevancia < 35:
            print(f"⚡ [Prioridad 3] rel={relevancia} → Gemma 4.")
            return {"rutas_activas": ["gemma_automatico"]}

        # =========================================================
        # 🔄 PRIORIDAD 2: Media (35–69) → Discord HITL
        # =========================================================
        if 35 <= relevancia < 70:
            print(f"🔄 [Prioridad 2] rel={relevancia} → discord HITL.")
            return {"rutas_activas": ["discord"]}

        # =========================================================
        # 🌟 PRIORIDAD 1: Alta (≥ 70) → multicanal
        # =========================================================
        print(f"✨ [Prioridad 1] Alta relevancia ({relevancia}). Matriz multicanal...")
        llm_estructurado = orquestador_llm.with_structured_output(RouterOutput)

        prompt = f"""<system_prompt>
Eres el Orquestador Inteligente de Contenidos de CloudEDTech. Tu misión es analizar interacciones de alta relevancia (>= 70) y decidir las rutas óptimas entre las opciones disponibles: 'linkedin', 'x', 'discord', 'reclamos'.

PRINCIPIOS DE MARCA (Manual de Marca CloudEDTech):
- **Aporte de Marca y Empleabilidad**: Casos de éxito corporativos, obtención de empleo gracias a los cursos, certificaciones oficiales o transformaciones profesionales profundas. Estos deben distribuirse de forma multicanal (`['linkedin', 'x', 'discord']` o variantes de marca).
- **Aporte a la Comunidad y Micro-logros**: Avances técnicos individuales, proyectos personales en entornos de práctica, dudas metodológicas complejas o retroalimentación de la plataforma. Estos fortalecen el tejido comunitario y deben canalizarse a Discord (`['discord']`).
- **Soporte y Reclamos Críticos**: Quejas sobre accesos, caídas de plataforma o problemas de facturación. Deben canalizarse a soporte (`['reclamos']`).

EJEMPLOS (FEW-SHOT - PRIORIDAD 1):
- Ejemplo 1:
Contenido: "¡Hola a todos! Logré conseguir mi primer empleo como Ingeniero de Datos gracias al curso y la ruta de CloudEDTech. ¡Mil gracias al equipo por las capacitaciones!"
Relevancia: 90
Sentimiento: Positivo
Salida esperada (rutas): ["linkedin", "x", "discord"]

- Ejemplo 2:
Contenido: "Terminé el despliegue de mi aplicación en OCI con Docker y n8n, aquí les comparto una captura de cómo quedó funcionando mi arquitectura de contenedores. Yo sí recomiendo el trabajo que hacen para mis familiares, amigos y conocidos."
Relevancia: 88
Sentimiento: Positivo
Salida esperada (rutas): ["discord", "x", "linkedin"]

- Ejemplo 3:
Contenido: "Después de haber aprobado las certificaciones, bootcamp, y programas que ustedes proporcionan, he logrado que mis proyectos personales salieran a producción."
Relevancia: 71
Sentimiento: Positivo
Salida esperada (rutas): ["discord", "linkedin"]

- Ejemplo 4:
Contenido: "No me han apoyado en solventar mi problema de usuario, y no he tenido acceso a los cursos, qué mal empresa para aprender y estudiar si no pueden solventar algo tan sencillo, más de una semana con el problema."
Relevancia: 85
Sentimiento: Negativo
Salida esperada (rutas): ["reclamos"]
</system_prompt>

<user_data>
Contenido: {json.dumps(datos, ensure_ascii=False)}
Relevancia: {relevancia}
Sentimiento: {sentimiento}
</user_data>
"""
        respuesta = llm_estructurado.invoke(prompt)
        time.sleep(0.5)

        rutas_limpias = [str(r).strip().lower() for r in respuesta.rutas]
        if not rutas_limpias:
            rutas_limpias = ["discord"]

        print(f"🔀 Rutas validadas y activas (Multicanal): {rutas_limpias}")
        return {"rutas_activas": rutas_limpias}

    except Exception as e:
        print(f"⚠️ Alerta/Error en Orquestador: {e}. Activando ruta de contingencia 'discord'.")
        return {"rutas_activas": ["discord"]}


# --- FUNCIÓN AUXILIAR DE CONTROL DE TIEMPO ESTRICTO ---

def invocar_con_respaldo_y_tiempo(llm_primario_est, llm_respaldo_est, prompt, timeout_segundos=15):
    """
    Ejecuta una llamada estructurada intentando primero con el LLM primario.
    Si ocurre un TimeoutError o excepción de API, ejecuta automáticamente el fallback.
    """
    def _llm_call(llm_estructurado):
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(llm_estructurado.invoke, prompt)
            return future.result(timeout=timeout_segundos)

    try:
        print("🤖 Intentando invocación con el modelo primario...")
        return _llm_call(llm_primario_est)
    except (concurrent.futures.TimeoutError, Exception) as e_primario:
        print(f"⚠️ Alerta: El modelo primario falló o se agotó el tiempo ({e_primario}).")
        print("🔄 Activando modelo de respaldo (Fallback) de forma inmediata...")
        try:
            resultado_respaldo = _llm_call(llm_respaldo_est)
            print("✅ ¡El modelo de respaldo respondió exitosamente!")
            return resultado_respaldo
        except Exception as e_respaldo:
            print(f"❌ Error crítico: Tanto el modelo primario como el de respaldo fallaron: {e_respaldo}")
            raise e_respaldo


# --- NODO LINKEDIN ---

def nodo_linkedin(state: AgentState):
    print("💼 Redactando activo profesional para LinkedIn con Few-Shot y Manual de Marca...")
    try:
        llm_primario = canal_linkedin_llm.with_structured_output(RespuestaComunidadLinkedin)
        llm_respaldo = llm_gemini_31_flash_lite.with_structured_output(RespuestaComunidadLinkedin)

        datos = state['json_precurado']
        autor = state.get('autor', 'Comunidad')
        semana = state.get('semana', 'Semana_01')
        fecha_envio = state.get('fecha_envio', '')
        fecha_extraccion = state.get('fecha_extraccion', '')

        prompt = f"""<system_prompt>
Eres el Copywriter Principal de CloudEDTech. Tu misión es transformar las interacciones de la comunidad en publicaciones de alto impacto para LinkedIn, reflejando fielmente los valores corporativos: Rigor Técnico, Compromiso Social, Transparencia, Excelencia Práctica y Colaboración.

PRINCIPIOS DE REDACCIÓN Y TONO (Manual de Marca):
1. Tuteo estricto ("tú", "tu ruta"). Prohibido usar "usted" o frases acartonadas.
2. Cero jerga corporativa vacía (prohibido usar "sinergia", "soluciones disruptivas", "apalancar"). Usa términos precisos y accesibles.
3. Estructura obligatoria del post: Contexto motivador -> Valor técnico/práctico -> Llamado a la acción claro y sencillo.
4. Extensión del cuerpo del post (`texto_copy`): 800 caracteres. Debe incluir una mención natural a @{autor}.
5. Tono: Cercano, experto, motivador y orientado a resultados (aprendizaje basado en competencias aplicables).

EJEMPLO DE REFERENCIA (FEW-SHOT):
- Entrada de la comunidad: "Logré conseguir mi primer trabajo como analista de datos despues de terminar los cursos de SQL y Supabase en CloudEdTech."
- Salida esperada en el JSON:
- titulo: "De la teoría al éxito laboral: El gran paso de @CarlosM"
- texto_copy: "¡Una gran noticia para celebrar en comunidad! 🎉 @CarlosM logró dar el siguiente gran paso en su carrera profesional tras dominar las herramientas clave de nuestra ruta de datos. Sabemos que el mercado tecnológico exige competencias prácticas y reales, y ver cómo aplicas cada conocimiento para conseguir tu nuevo rol como Analista de Datos es la mejor prueba de que el aprendizaje orientado a resultados transforma futuros. La tecnología es una herramienta al servicio de tu desarrollo, y tu constancia hizo posible este logro. ¡Felicitaciones por este gran hito, y sigamos construyendo tu futuro profesional juntos! 🚀 ¿Y tú, qué habilidad técnica estás aplicando hoy en tus proyectos?"

Responde ÚNICAMENTE cumpliendo con el esquema estructurado RespuestaComunidadLinkedin.
</system_prompt>

<user_data>
Contenido analizado: {json.dumps(datos, ensure_ascii=False)}
Autor: {autor}
Semana: {semana}
Fecha Envío: {fecha_envio}
Fecha Extracción: {fecha_extraccion}
</user_data>"""

        respuesta = invocar_con_respaldo_y_tiempo(llm_primario, llm_respaldo, prompt, timeout_segundos=15)
        time.sleep(0.5)

        resultado_dict = respuesta.model_dump()
        copys = state.get("copys_generados", {})
        copys["linkedin"] = resultado_dict

        print("✅ Nodo LinkedIn ejecutado con éxito.")
        return {"copys_generados": copys}

    except Exception as e:
        print(f"⚠️ Alerta/Error en nodo LinkedIn: {e}")
        copys = state.get("copys_generados", {})
        copys["linkedin"] = {"status": "error", "error": str(e)}
        return {"copys_generados": copys}


# --- NODO X ---

def nodo_x(state: AgentState):
    print("📝 Redactando activo conciso para X (Twitter)...")
    try:
        llm_primario = canal_x_llm.with_structured_output(RespuestaComunidadX)
        llm_respaldo = llm_gemini_31_flash_lite.with_structured_output(RespuestaComunidadX)

        datos = state['json_precurado']
        autor = state.get('autor', 'Comunidad')
        semana = state.get('semana', 'Semana_01')
        fecha_envio = state.get('fecha_envio', '')
        fecha_extraccion = state.get('fecha_extraccion', '')

        prompt = f"""<system_prompt>
Eres el Copywriter Principal de CloudEDTech. Tu misión es transformar las interacciones de la comunidad en publicaciones de alto impacto, directas y actuales para X (Twitter), alineadas al Manual de Marca.

PRINCIPIOS DE REDACCIÓN Y TONO (X):
1. Tuteo estricto ("tú", "tu ruta"). Prohibido usar "usted".
2. Cero jerga corporativa vacía. Lenguaje claro, conciso y dinámico.
3. Restricciones de longitud estrictas y obligatorias:
- `titulo`: Máximo 70 caracteres.
- `texto_copy`: Máximo 210 caracteres, incluyendo la mención natural a @{autor}.
4. Tono: Directo, motivador, actual y enfocado en aplicabilidad y resultados tecnológicos.

EJEMPLO DE REFERENCIA (FEW-SHOT):
- Entrada de la comunidad: "Logré conseguir mi primer trabajo como analista de datos después de terminar los cursos de SQL y Supabase en CloudEdTech."
- Salida esperada en el JSON:
- titulo: "¡Nuevo logro en la comunidad!"
- texto_copy: "¡Grande @CarlosM! Lograste aplicar las herramientas de nuestra ruta de datos para conseguir tu nuevo rol profesional. El aprendizaje basado en resultados transforma futuros. 🚀 ¿Qué meta cumples hoy?"

Responde ÚNICAMENTE cumpliendo con el esquema estructurado RespuestaComunidadX.
</system_prompt>

<user_data>
Contenido analizado: {json.dumps(datos, ensure_ascii=False)}
Autor: {autor}
Semana: {semana}
Fecha Envío: {fecha_envio}
Fecha Extracción: {fecha_extraccion}
</user_data>"""

        respuesta = invocar_con_respaldo_y_tiempo(llm_primario, llm_respaldo, prompt, timeout_segundos=12)
        time.sleep(0.5)

        resultado_dict = respuesta.model_dump()
        copys = state.get("copys_generados", {})
        copys["x"] = resultado_dict

        print("✅ Nodo X ejecutado con éxito.")
        return {"copys_generados": copys}

    except Exception as e:
        print(f"⚠️ Alerta en nodo X: {e}")
        copys = state.get("copys_generados", {})
        copys["x"] = {"status": "error", "error": str(e)}
        return {"copys_generados": copys}


# --- NODO DISCORD ---

def nodo_discord(state: AgentState):
    print("📝 Redactando activo para Discord con Few-Shot multicanal...")
    try:
        llm_primario = canal_discord_llm.with_structured_output(RespuestaComunidadDiscord)
        llm_respaldo = llm_gemini_31_flash_lite.with_structured_output(RespuestaComunidadDiscord)

        datos = state['json_precurado']
        autor = state.get('autor', 'Comunidad')
        semana = state.get('semana', 'Semana_02')
        fecha_envio = state.get('fecha_envio', '')
        fecha_extraccion = state.get('fecha_extraccion', '')

        prompt = f"""<system_prompt>
Eres el Community Manager de CloudEDTech en Discord. Tu misión es analizar la interacción de la comunidad y redactar una respuesta óptima seleccionando ÚNICAMENTE UNO de los tres canales disponibles: '#general', '#faq' o '#notificaciones'.

CRITERIOS DE SELECCIÓN Y LONGITUD ADAPTATIVA:
1. '#general':
   - **Para saludos o preguntas cortas/ambiguas:** Responde con un tono servicial pero **breve y directo al grano** (máximo 2 frases).
   - **Para reconocimientos o micro-logros (alto valor):** Redacta una felicitación cálida, motivadora y más desarrollada que resalte el aprendizaje basado en resultados.
2. '#faq':
- Para dudas técnicas de estudio, errores de código o guías metodológicas. Tono experto, claro y práctico.
3. '#notificaciones':
- Exclusivo para anuncios oficiales, eventos o hitos institucionales de la marca. Tono entusiasta y convocante.

REGLAS OBLIGATORIAS:
- Selecciona SOLO UN canal e ingresa la información únicamente en ese objeto (deja los otros en null).
- Tuteo estricto ("tú", "tu ruta") y cero jerga corporativa vacía.
- Mención obligatoria a @{autor}.
- Responde ÚNICAMENTE cumpliendo con el esquema estructurado RespuestaComunidadDiscord.

EJEMPLOS DE REFERENCIA (FEW-SHOT):

- Ejemplo 1 (#general - Entrada corta / Saludo):
  * Entrada: "Hola buenas tardes"
  * Salida esperada: canal_seleccionado = "#general", post_discord (titulo: "¡Hola de nuevo!", texto_copy: "¡Hola @{autor}! Qué gusto saludarte por aquí. Cuéntanos, ¿en qué parte de tu ruta de aprendizaje te encuentras hoy para poder orientarte mejor?")

- Ejemplo 2 (#general - Logro de alto valor):
  * Entrada: "Conseguí mi primer trabajo como analista de datos gracias al curso."
  * Salida esperada: canal_seleccionado = "#general", post_discord (titulo: "¡Gran logro en la comunidad!", texto_copy: "¡Muchas felicidades @{autor}! 🎉 Nos llena de orgullo ver cómo aplicas cada competencia aprendida para dar este gran salto profesional. El aprendizaje orientado a resultados transforma futuros. ¡A celebrar este triunfo y seguir adelante con todo!")

- Ejemplo 3 (#faq - Duda técnica):
  * Entrada: "Tengo un error al conectar Supabase con Python en mis consultas."
  * Salida esperada: canal_seleccionado = "#faq", post_discord_faq (titulo: "Resolvamos tu duda técnica", texto_copy: "¡Hola @{autor}! Excelente pregunta sobre la integración con Supabase. Asegúrate de verificar tus variables de entorno y que el cliente asíncrono esté configurado correctamente. Si el inconveniente persiste, compártenos un fragmento de tu código para revisarlo juntos en detalle.")

- Ejemplo 4 (#notificaciones - Anuncio oficial):
  * Entrada: "Comparto los avances de la nueva plataforma de CloudEdTech."
  * Salida esperada: canal_seleccionado = "#notificaciones", post_discord_notificaciones (titulo: "¡Nuevas actualizaciones en CloudEDTech!", texto_copy: "¡Hola @{autor}! Gracias por destacar los avances de nuestra plataforma. Seguimos mejorando la infraestructura y la velocidad para que tu experiencia de aprendizaje sea óptima. ¡Revisa las novedades de la semana y aprovecha al máximo tu ruta!")
</system_prompt>

<user_data>
Contenido analizado: {json.dumps(datos, ensure_ascii=False)}
Autor: {autor}
Semana: {semana}
Fecha Envío: {fecha_envio}
Fecha Extracción: {fecha_extraccion}
</user_data>
"""

        respuesta = invocar_con_respaldo_y_tiempo(llm_primario, llm_respaldo, prompt, timeout_segundos=15)
        time.sleep(0.5)

        resultado_dict = respuesta.model_dump()
        copys = state.get("copys_generados", {})
        copys["discord"] = resultado_dict

        print("✅ Nodo Discord ejecutado con éxito.")
        return {"copys_generados": copys}

    except Exception as e:
        print(f"⚠️ Alerta en nodo Discord: {e}")
        copys = state.get("copys_generados", {})
        copys["discord"] = {"status": "error", "error": str(e)}
        return {"copys_generados": copys}


# --- NODO RECLAMOS / PQRS ---

def nodo_reclamos(state: AgentState):
    print("🛡️ Atendiendo flujo independiente de PQRS / Soporte Crítico...")
    try:
        llm_primario = canal_reclamos_llm.with_structured_output(RespuestaComunidadPQRS)
        llm_respaldo = llm_gemini_31_flash_lite.with_structured_output(RespuestaComunidadPQRS)

        datos = state['json_precurado']
        autor = state.get('autor', 'Comunidad')
        semana = state.get('semana', 'Semana_02')
        fecha_envio = state.get('fecha_envio', '')
        fecha_extraccion = state.get('fecha_extraccion', '')

        prompt = f"""<system_prompt>
Eres el Especialista de Soporte y Experiencia del Estudiante en CloudEDTech. Tu misión es analizar quejas, reclamos, sugerencias o problemas reportados y generar la respuesta oficial para el canal independiente #pqrs, reflejando integridad profesional y empatía.

PRINCIPIOS DE REDACCIÓN Y TONO (PQRS):
1. Estructura exacta del mensaje (1 a 3 frases, máximo 500 caracteres):
- Frase 1: Empatía sincera y reconocimiento del inconveniente o sugerencia.
- Frase 2: Información clara, solución inmediata o directriz de apoyo inicial[cite: 14].
- Frase 3: Invitación amable a continuar el seguimiento en un chat privado (DM) con soporte para proteger sus datos personales.
2. Tono: Servicial, tranquilo, no técnico y sumamente resolutivo.
3. Tuteo estricto ("tú", "tu ruta")[cite: 13, 14]. Prohibido usar "usted" o frases a la defensiva (ej. "no es un error del sistema")[cite: 14].
4. Mención obligatoria a @{autor}.
5. Responde ÚNICAMENTE cumpliendo con el esquema estructurado RespuestaComunidadPQRS.

EJEMPLO DE REFERENCIA (FEW-SHOT):
- Entrada de la comunidad: "La plataforma se queda congelada al intentar ver los videos de la semana 2."
- Salida esperada en el JSON:
- titulo: "Soporte y atención prioritaria"
- texto_copy: "Lamento mucho el inconveniente con la carga de los videos, @{autor}. Ya estamos revisando el rendimiento del servidor para solucionarlo cuanto antes. Escríbeme por mensaje privado (DM) para darte seguimiento personalizado y proteger tus datos. ¡Estamos para ayudarte!"
</system_prompt>

<user_data>
Contenido analizado: {json.dumps(datos, ensure_ascii=False)}
Autor: {autor}
Semana: {semana}
Fecha Envío: {fecha_envio}
Fecha Extracción: {fecha_extraccion}
</user_data>
"""

        respuesta = invocar_con_respaldo_y_tiempo(llm_primario, llm_respaldo, prompt, timeout_segundos=12)
        time.sleep(0.5)

        resultado_dict = respuesta.model_dump()
        copys = state.get("copys_generados", {})
        copys["reclamos"] = resultado_dict

        print("✅ Nodo Reclamos ejecutado con éxito.")
        return {"copys_generados": copys}

    except Exception as e:
        print(f"⚠️ Alerta en nodo Reclamos: {e}")
        copys = state.get("copys_generados", {})
        copys["reclamos"] = {"status": "error", "error": str(e)}
        return {"copys_generados": copys}


# --- NODO VALIDADOR DE MARCA ---

def nodo_validador(state: AgentState):
    print("✅ Validando Manual de Marca y Tono Institucional...")

    id_msg = state.get("id_mensaje")
    
    try:
        copys = state.get("copys_generados", {})
        if not copys:
            print("⚠️ Validador: no hay copys para auditar.")
            return {"estado_publicacion": "validado_esperando_hitl"}

        prompt = f"""<system_prompt>
Eres el Auditor de Marca y Compliance de CloudEDTech.
Tu tarea es revisar los copys generados para las distintas plataformas (LinkedIn, X, Discord, PQRS) y verificar estrictamente que cumplan con los lineamientos del Manual de Marca:
1. Tuteo estricto ("tú", "tu ruta"). Cero uso de "usted" o lenguaje distante[cite: 13, 14].
2. Cero jerga corporativa vacía (prohibido: "sinergia", "soluciones disruptivas", "apalancar", "best-in-class")[cite: 14].
3. Enfoque claro en empleabilidad, competencias aplicables y aprendizaje orientado a resultados.
4. Tono cercano, experto, motivador y responsable según los pilares institucionales (Personas, Tecnología, Aplicabilidad)[cite: 12, 13].

Responde ÚNICAMENTE con una de estas dos opciones:
- APROBADO
- REVISAR: <motivo corto>

TEXTOS A AUDITAR:
COPIES:
{json.dumps(copys, ensure_ascii=False, indent=2)}

Realiza una validación rápida y confirma que el tono institucional sea el correcto para avanzar hacia la revisión humana (HITL).
</system_prompt>
"""
        respuesta = validador_llm.invoke(prompt)
        contenido = getattr(respuesta, "content", str(respuesta))
        print(f"✅ Auditoría de marca: {contenido[:150]}")
        time.sleep(0.3)
    except Exception as e:
        print(f"⚠️ Alerta no bloqueante en Validador: {e}")
    if id_msg:
        actualizar_estado_lote(str(id_msg), "procesado")
    return {"estado_publicacion": "validado_esperando_hitl"}

# --- NODO GEMMA AUTOMÁTICO (BAJA RELEVANCIA) ---

async def nodo_gemma_automatico(state: AgentState):
    print("🤖 Ejecutando Nodo Autónomo de Discord impulsado por Gemma 4 (Resiliente)...")

    datos = state["json_precurado"]
    id_msg = state["id_mensaje"]
    try:
        relevancia = int(float(datos.get("relevancia") or 0))
    except (ValueError, TypeError):
        relevancia = 0
    sentimiento = str(datos.get("sentimiento", "Neutro")).lower()
    texto_original = str(datos.get("texto_original", "")).strip()
    estado_revision = str(datos.get("estado_revision", "pendiente")).lower()
    autor_mensaje = str(state.get("autor", "Comunidad"))

    if relevancia <= 10 or len(texto_original) < 3:
        print("🚫 Contenido spam/sin valor. Cerrando como desaprobado.")
        actualizar_estado_lote(id_msg, "desaprobado")
        return {"rutas_activas": [], "estado_publicacion": "descartado_automatico"}

    from src.gemma import PROMPT_GEMMA_BAJA_RELEVANCIA

    prompt = PROMPT_GEMMA_BAJA_RELEVANCIA.format(
        autor_mensaje=autor_mensaje,
        relevancia=relevancia,
        sentimiento=sentimiento,
        texto_original=texto_original,
    )

    configuracion = types.GenerateContentConfig(
        temperature=0.1,
        max_output_tokens=800,
        response_mime_type="application/json",
    )

    try:
        response = await generar_con_gemma_resiliente(prompt, configuracion, timeout_segundos=20)
        texto_respuesta = getattr(response, "_texto_seguro", None) or getattr(response, "text", None)
        if not texto_respuesta:
            raise ValueError("Respuesta del modelo sin texto usable")

        resultado_json = extraer_json_seguro(texto_respuesta)
        canal_destino = str(resultado_json.get("canal_destino", "#general"))
        titulo = str(resultado_json.get("titulo", "Actualización CloudEDTech"))
        texto_copy = str(resultado_json.get("texto_copy", ""))
        nuevo_estado = str(resultado_json.get("nuevo_estado_revision", "aprobado")).lower()

        copys_generados = {
            "discord": {
                "status": "exito",
                "activos_distribucion_generados": {
                    "canal_seleccionado": canal_destino,
                    "post_discord": {"titulo": titulo, "texto_copy": texto_copy} if "#general" in canal_destino else None,
                    "post_discord_faq": {"titulo": titulo, "texto_copy": texto_copy} if "#faq" in canal_destino else None,
                    "post_discord_pqrs": {"titulo": titulo, "texto_copy": texto_copy} if "#pqrs" in canal_destino else None,
                },
            }
        }

        if nuevo_estado == "aprobado" and canal_destino not in ("ninguno", "", "none"):
            exito_envio = enviar_webhook_discord(
                copys_generados, autor=autor_mensaje, texto_original=texto_original
            )
            if exito_envio:
                actualizar_estado_lote(id_msg, "aprobado")
                print(f"🎉 Lote ID: {id_msg} publicado y 'aprobado'.")
            else:
                actualizar_estado_lote(id_msg, "procesado")
                print(f"⚠️ Webhook falló. Lote ID: {id_msg} queda en 'procesado'.")
        else:
            actualizar_estado_lote(id_msg, "desaprobado")
            print(f"🚫 Lote ID: {id_msg} → 'desaprobado'.")

        return {
            "rutas_activas": ["gemma_automatico"],
            "copys_generados": copys_generados,
            "estado_publicacion": "completado_automatico",
        }

    except Exception as e:
        print(f"❌ Error crítico en nodo Gemma: {e}")
        actualizar_estado_lote(id_msg, estado_revision)
        return {"rutas_activas": [], "estado_publicacion": "error_gemma_revision_manual"}


# --- NODO PUBLICADOR UNIVERSAL ---

def nodo_publicador(state: AgentState):
    print("🚀 Ejecutando Publicador Universal: Verificando y disparando APIs de redes activas...")

    id_msg = state.get("id_mensaje", "msg_test_01")
    autor = state.get("autor", "Comunidad CloudEDTech")
    semana = state.get("semana", "Semana_01")
    fecha_envio = state.get("fecha_envio")
    fecha_extraccion = state.get("fecha_extraccion")
    rutas = state.get("rutas_activas", [])
    copys = state.get("copys_generados", {})
    datos_originales = state.get("json_precurado", {})

    if not rutas and copys:
        rutas = list(copys.keys())

    supabase_url_conn = config.SUPABASE_DB_URL or os.environ.get("SUPABASE_DB_URL")
    todas_exitosas = True

    if "discord" in rutas:
        if not enviar_webhook_discord(copys, autor=autor, texto_original=datos_originales.get("texto_original", "")):
            todas_exitosas = False

    if "reclamos" in rutas:
        if not enviar_webhook_discord(copys, autor=autor, texto_original=datos_originales.get("texto_original", "")):
            todas_exitosas = False

    if "x" in rutas:
        if not enviar_tweet_x(copys):
            todas_exitosas = False

    if "linkedin" in rutas:
        if not enviar_linkedin(copys):
            todas_exitosas = False

    if todas_exitosas:
        try:
            modelos_mapa = {"linkedin": "gemini-3.5-flash-lite", "x": "gemini-3.5-flash-lite", "discord": "openai/gpt-oss-120b", "reclamos": "qwen/qwen3.8-27b"}
            modelos_activos = [modelos_mapa[r] for r in rutas if r in modelos_mapa]
            cw_modelo_ia_str = ", ".join(list(set(modelos_activos))) if modelos_activos else "orquestador-multi-llm"

            with psycopg.connect(supabase_url_conn) as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO public.historial_reportes_semanales
                        (id_mensaje, autor, semana, fecha_envio, fecha_extraccion, fecha_publicacion, rutas_activas, estado, contenido_original, cw_modelo_ia, copys_generados)
                        VALUES (%s, %s, %s, %s, %s, NOW(), %s, %s, %s, %s, %s);
                        """,
                        (
                            str(id_msg), str(autor), str(semana),
                            fecha_envio if fecha_envio else None,
                            fecha_extraccion if fecha_extraccion else None,
                            rutas, "publicado",
                            json.dumps(datos_originales),
                            str(cw_modelo_ia_str),
                            json.dumps(copys)
                        )
                    )
                    conn.commit()

            actualizar_estado_lote(id_msg, "aprobado")
            print(f"🎉 ¡Flujo completado con éxito! Lote ID: {id_msg} marcado como 'aprobado'.")
            return {"estado_publicacion": "completado"}
        except Exception as e:
            print(f"⚠️ Error crítico al guardar en base de datos: {e}")
            return {"estado_publicacion": "error_db"}
    else:
        print(f"⚠️ Alerta: Una o más publicaciones fallaron. El lote ID: {id_msg} se mantiene en 'procesado'.")
        return {"estado_publicacion": "fallido_api_externa"}