"""
Paquete fuente del MVP Mototradis (equipo-27).

Contiene la lógica de negocio migrada desde el notebook monolítico:
configuración, esquemas Pydantic, nodos de LangGraph, publicación en redes
y utilidades de checkpoints/Supabase.
"""

from .config import config

__version__ = "1.0.0"

__all__ = [
    "config",
    "__version__",
]