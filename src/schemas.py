from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Annotated
from typing_extensions import TypedDict
import operator

# ==========================================
# 1. ESTADO DEL GRAFO (LangGraph State)
# ==========================================

class AgentState(TypedDict):
    id_mensaje: str
    autor: str
    semana: str
    fecha_envio: Optional[str]
    fecha_extraccion: Optional[str]
    json_precurado: Dict[str, Any]
    rutas_activas: List[str]
    copys_generados: Annotated[Dict[str, Any], operator.ior]  # Corregido: Any (contiene objetos anidados)
    errores_dlq: Annotated[List[Dict[str, Any]], operator.add]
    estado_publicacion: str


# ==========================================
# 2. MODELOS PYDANTIC PARA LLMS Y COPYWRITING
# ==========================================

class RouterOutput(BaseModel):
    rutas: List[str] = Field(description="Lista de rutas a activar. Opciones válidas: 'linkedin', 'x', 'discord'")


# --- LINKEDIN ---

class ResumenComunidad(BaseModel):
    total_interacciones_procesadas: int = Field(default=1, description="Número de interacciones procesadas")
    sentimiento_predominante: str = Field(default="Positivo", description="Sentimiento general")
    temas_principales: List[str] = Field(default_factory=lambda: ["Comunidad", "General"], description="Temas clave")
    programa: str = Field(default="Programa General", description="Nombre del programa o contexto")

class PostLinkedin(BaseModel):
    titulo: str = Field(description="Título profesional enfocado en casos de éxito o novedades de CloudEDTech")
    texto_copy: str = Field(description="Cuerpo del post para LinkedIn, tuteo estricto, 800-1100 caracteres, mención a @autor")
    canal_recomendado: str = Field(default="LinkedIn Oficial", description="Canal sugerido")
    potencial_engagement: str = Field(default="Alto", description="Estimación de impacto")

class DestaqueNewsletter(BaseModel):
    seccion: str = Field(default="Feedback de la Comunidad", description="Sección de la newsletter para #notificaciones")
    titular: str = Field(description="Titular llamativo")
    resumen: str = Field(description="Resumen conciso del aporte")

class SugerenciaContenidoFAQ(BaseModel):
    tema: str = Field(description="Subtítulo profesional y persuasivo para el canal #faq")
    origen: str = Field(description="Motivación para orientar y guiar hacia los resultados esperados")
    status: str = Field(default="Derivado_a_Mentoria", description="Estado de atención")

class TemporalidadProductoCreado(BaseModel):
    fecha_envio: str = Field(default="", description="Fecha original de envío")
    fecha_extraccion: str = Field(default="", description="Fecha de extracción")
    semana: str = Field(default="Semana_01", description="Identificador de la semana")

class ActivosDistribucionGeneradosLinkedin(BaseModel):
    post_linkedin: PostLinkedin
    destaque_newsletter_semanal: DestaqueNewsletter
    sugerencia_contenido_faq: SugerenciaContenidoFAQ
    temporalidad_producto_creado: TemporalidadProductoCreado

class RespuestaComunidadLinkedin(BaseModel):
    status: str = Field(default="exito", description="Estado de la respuesta")
    resumen_comunidad: ResumenComunidad
    activos_distribucion_generados: ActivosDistribucionGeneradosLinkedin


# --- RED SOCIAL X ---

class PostX(BaseModel):
    titulo: str = Field(description="Título profesional tema enfocado en resultados, efectivo, muy conciso CloudEDTech, máximo 70 caracteres")
    texto_copy: str = Field(description="Cuerpo del post para X, tuteo estricto, 210 caracteres Máximo, Conciso, Directo y actual")
    canal_recomendado: str = Field(default="X Oficial", description="Canal sugerido")
    potencial_engagement: str = Field(default="Alto", description="Estimación de impacto")

class TemporalidadProductoCreadoX(BaseModel):
    fecha_envio: str = Field(default="", description="Fecha original de envío")
    fecha_extraccion: str = Field(default="", description="Fecha de extracción")
    semana: str = Field(default="Semana_01", description="Identificador de la semana")

class ActivosDistribucionGeneradosX(BaseModel):
    post_postx: PostX
    temporalidad_producto_creado: TemporalidadProductoCreadoX

class RespuestaComunidadX(BaseModel):
    status: str = Field(default="exito", description="Estado de la respuesta")
    resumen_comunidad: ResumenComunidad
    activos_distribucion_generados: ActivosDistribucionGeneradosX


# --- DISCORD (General, FAQ, Notificaciones) ---

class PostDiscordfaq(BaseModel):
    titulo: str = Field(description="Título persuasivo para #faq enfocado en novedades y superación profesional")
    texto_copy: str = Field(description="Cuerpo del post para #faq, tuteo estricto, 900 caracteres máximo, mención a @autor")
    canal_recomendado: str = Field(default="Discord #faq", description="Canal sugerido")
    potencial_engagement: str = Field(default="Alto", description="Estimación de impacto")
    origen: str = Field(description="Motivación para orientar y guiar hacia los resultados esperados")
    status: str = Field(default="Derivado_a_Mentoria", description="Estado de atención")

class PostDiscordgeneral(BaseModel):
    titulo: str = Field(description="Título servicial para #general llamativo y conversacional")
    texto_copy: str = Field(description="Cuerpo del post para #general, tuteo estricto, 900 caracteres máximo, mención a @autor")
    canal_recomendado: str = Field(default="Discord #general", description="Canal sugerido")
    potencial_engagement: str = Field(default="Alto", description="Estimación de impacto")
    origen: str = Field(description="Motivación para orientar y guiar hacia los resultados esperados")
    status: str = Field(default="Derivado_Segun_contexto", description="Estado de atención")

class PostDiscordnotificaciones(BaseModel):
    titulo: str = Field(description="Título entusiasta y alegre para #notificaciones")
    texto_copy: str = Field(description="Cuerpo del post para #notificaciones, tuteo estricto, 900 caracteres máximo, mención a @autor")
    canal_recomendado: str = Field(default="Discord #notificaciones", description="Canal sugerido")
    potencial_engagement: str = Field(default="Alto", description="Estimación de impacto")
    origen: str = Field(description="Anuncios de la marca, eventos, reconocimientos, calendarización")
    status: str = Field(default="Derivado_Segun_contexto", description="Estado de atención")

class TemporalidadProductoCreadoDiscord(BaseModel):
    fecha_envio: str = Field(default="", description="Fecha original de envío")
    fecha_extraccion: str = Field(default="", description="Fecha de extracción")
    semana: str = Field(default="Semana_01", description="Identificador de la semana")

class ActivosDistribucionGeneradosDiscord(BaseModel):
    canal_seleccionado: str = Field(description="Indica cuál canal se activó: '#general', '#faq' o '#notificaciones'")
    post_discord: Optional[PostDiscordgeneral] = Field(default=None, description="Llenar solo si el canal es #general")
    post_discord_faq: Optional[PostDiscordfaq] = Field(default=None, description="Llenar solo si el canal es #faq")
    post_discord_notificaciones: Optional[PostDiscordnotificaciones] = Field(default=None, description="Llenar solo si el canal es #notificaciones")
    temporalidad_producto_creado: TemporalidadProductoCreadoDiscord

class RespuestaComunidadDiscord(BaseModel):
    status: str = Field(default="exito", description="Estado de la respuesta")
    resumen_comunidad: ResumenComunidad
    activos_distribucion_generados: ActivosDistribucionGeneradosDiscord


# --- DISCORD PQRS / RECLAMOS ---

class PostDiscordpqrs(BaseModel):
    titulo: str = Field(description="Título servicial para #pqrs, empático y orientado a solución")
    texto_copy: str = Field(description="Cuerpo del mensaje para #pqrs, tuteo respetuoso, máximo 400 caracteres, mención a @autor")
    canal_recomendado: str = Field(default="Discord #pqrs", description="Canal sugerido")
    potencial_engagement: str = Field(default="Alto", description="Estimación de impacto")
    origen: str = Field(description="1–3 frases: Empatía o reconocimiento + solución/información + derivación cordial a chat privado")
    status: str = Field(default="Derivado_a_Soporte_Privado", description="Estado de atención")

class ActivosDistribucionGeneradosPQRS(BaseModel):
    post_discord_pqrs: PostDiscordpqrs
    temporalidad_producto_creado: TemporalidadProductoCreadoDiscord

class RespuestaComunidadPQRS(BaseModel):
    status: str = Field(default="exito", description="Estado de la respuesta")
    resumen_comunidad: ResumenComunidad
    activos_distribucion_generados: ActivosDistribucionGeneradosPQRS


# --- GEMMA 4 Y AUTOMATIZACIÓN MASIVA ---

class AutomatizacionBajaRelevanciaOutput(BaseModel):
    accion: str = Field(description="Acción a tomar: 'publicar_directo' o 'descartar'")
    canal_destino: str = Field(description="Canal de destino seleccionado: '#faq', '#general', '#pqrs' o 'ninguno'")
    titulo: str = Field(description="Título claro, conciso y alineado al canal (máximo 70 caracteres)")
    texto_copy: str = Field(description="Cuerpo del mensaje aplicando tuteo estricto, tono cercano y mención a @autor (máximo 400 caracteres)")
    razon_decision: str = Field(description="Breve justificación analítica del porqué de esta categorización")
    nuevo_estado_revision: str = Field(description="Estado de revisión a asignar en Supabase: 'aprobado' o 'desaprobado'")

class EvaluacionSpamInyeccionOutput(BaseModel):
    es_spam_o_inyeccion: bool = Field(description="True si el contenido es spam, inyección SQL, saludo vacío o sin sentido; False en caso contrario")
    razon: str = Field(description="Justificación técnica del descarte")
    nuevo_estado_revision: str = Field(description="Debe ser estrictamente 'desaprobado'")