import json
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="CommunityLab API", version="1.0")

# Configurar CORS para permitir que el Frontend de Netlify se conecte
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, aquí iría la URL de Netlify
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ARCHIVO_RESULTADOS = "resultados_kpis.json"

@app.get("/api/kpis", summary="Obtiene los mensajes analizados con el texto dummy de copy")
def obtener_kpis():
    if not os.path.exists(ARCHIVO_RESULTADOS):
        return []
    
    try:
        with open(ARCHIVO_RESULTADOS, "r", encoding="utf-8") as f:
            datos = json.load(f)
            
        # Inyectar el campo 'copy_final' para la Integración Iterativa con Frontend
        for mensaje in datos:
            if "copy_final" not in mensaje:
                mensaje["copy_final"] = "Pendiente de redacción por Enoc..."
            
        return datos
    except Exception as e:
        return {"error": f"Error al procesar el archivo: {str(e)}"}

@app.get("/", summary="Estado del servidor")
def health_check():
    return {"status": "ok", "message": "Backend Administrativo funcionando correctamente."}
