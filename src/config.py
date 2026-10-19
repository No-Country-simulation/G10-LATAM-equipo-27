import os
from pathlib import Path
from dotenv import load_dotenv

# Carga robusta del .env (funciona en local, Docker y pipelines)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

class Config:
    """
    Clase centralizada para la gestión de variables de entorno y credenciales.
    Reemplaza el uso de google.colab.userdata en el entorno local.
    """
    # Base de Datos (Supabase / PostgreSQL)
    SUPABASE_DB_URL: str = os.getenv("SUPABASE_DB_URL", "")
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")

    # Proveedores de LLMs
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Redes Sociales y Webhooks de Discord
    LINKEDIN_ACCESS_TOKEN: str = os.getenv("LINKEDIN_ACCESS_TOKEN", "")
    LINKEDIN_AUTHOR_URN: str = os.getenv("LINKEDIN_AUTHOR_URN", "")
    
    DISCORD_WEBHOOK_GENERAL: str = os.getenv("DISCORD_WEBHOOK_GENERAL", "")
    DISCORD_WEBHOOK_FAQ: str = os.getenv("DISCORD_WEBHOOK_FAQ", "")
    DISCORD_WEBHOOK_NOTIFICACIONES: str = os.getenv("DISCORD_WEBHOOK_NOTIFICACIONES", "")
    DISCORD_WEBHOOK_PQRS: str = os.getenv("DISCORD_WEBHOOK_PQRS", "")

    X_API_KEY: str = os.getenv("X_API_KEY", "")
    X_API_SECRET: str = os.getenv("X_API_SECRET", "")
    X_ACCESS_TOKEN: str = os.getenv("X_ACCESS_TOKEN", "")
    X_ACCESS_TOKEN_SECRET: str = os.getenv("X_ACCESS_TOKEN_SECRET", "")

    # LangSmith (Opcional)
    LANGCHAIN_API_KEY: str = os.getenv("LANGCHAIN_API_KEY", "")
    LANGCHAIN_TRACING_V2: str = os.getenv("LANGCHAIN_TRACING_V2", "false")
    LANGCHAIN_PROJECT: str = os.getenv("LANGCHAIN_PROJECT", "CloudEDTech_Graph")

    @classmethod
    def validar_configuracion(cls):
        """Valida que las credenciales críticas indispensables estén presentes."""
        criticas = ["SUPABASE_DB_URL", "GROQ_API_KEY", "GEMINI_API_KEY"]
        faltantes = [var for var in criticas if not getattr(cls, var)]
        
        if faltantes:
            raise ValueError(f"❌ Faltan las siguientes variables críticas de entorno en el archivo .env: {', '.join(faltantes)}")
        print("✅ Configuración de entorno cargada y validada correctamente.")

    @classmethod
    def validar_opcionales(cls):
        """Emite warnings si faltan credenciales de redes sociales (no bloquea)."""
        opcionales = {
            "LINKEDIN_ACCESS_TOKEN": cls.LINKEDIN_ACCESS_TOKEN,
            "LINKEDIN_AUTHOR_URN": cls.LINKEDIN_AUTHOR_URN,
            "DISCORD_WEBHOOK_GENERAL": cls.DISCORD_WEBHOOK_GENERAL,
            "DISCORD_WEBHOOK_FAQ": cls.DISCORD_WEBHOOK_FAQ,
            "DISCORD_WEBHOOK_NOTIFICACIONES": cls.DISCORD_WEBHOOK_NOTIFICACIONES,
            "DISCORD_WEBHOOK_PQRS": cls.DISCORD_WEBHOOK_PQRS,
            "X_API_KEY": cls.X_API_KEY,
            "X_API_SECRET": cls.X_API_SECRET,
            "X_ACCESS_TOKEN": cls.X_ACCESS_TOKEN,
            "X_ACCESS_TOKEN_SECRET": cls.X_ACCESS_TOKEN_SECRET,
        }
        faltantes = [k for k, v in opcionales.items() if not v]
        if faltantes:
            print(f"⚠️ Variables opcionales ausentes (publicación en redes puede fallar): {', '.join(faltantes)}")
        else:
            print("✅ Todas las variables de redes sociales están presentes.")

config = Config()
# Validación automática al importar (útil en local y deploy)
try:
    config.validar_configuracion()
    config.validar_opcionales()
except ValueError as e:
    print(e)