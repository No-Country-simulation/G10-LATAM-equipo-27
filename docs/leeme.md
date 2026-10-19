# Mototradis MVP – Pipeline de Copywriting Inteligente (CloudEDTech)

MVP demostrativo del sistema de redacción y publicación multicanal impulsado por LangGraph, Supabase y modelos de IA (Gemini, Groq, Gemma 4).

Migrado desde un notebook monolítico de Google Colab hacia una arquitectura modular lista para entorno local y deploy.

**Rama de trabajo:** `mototradis-mvp`  
**Equipo:** G10-LATAM-equipo-27

---

## 📁 Estructura del Proyecto

```
mototradisbk/
├── .env.example              # Plantilla de variables de entorno
├── .gitignore
├── requirements.txt
├── README.md
├── docs/
│   ├── constitution.md
│   └── contrato-pipeline.md
├── src/
│   ├── __init__.py           # Paquete + versión
│   ├── config.py             # Gestión centralizada de configuración
│   ├── schemas.py            # Esquemas Pydantic + AgentState
│   ├── database.py           # Consultas y actualización de lotes en Supabase
│   ├── checkpoints.py        # Limpieza de hilos LangGraph
│   ├── publishers.py         # Publicación en Discord, X y LinkedIn
│   ├── gemma.py              # Cliente Gemma 4 resiliente + prompt
│   ├── nodes.py              # Nodos del grafo (orquestador, canales, validador...)
│   └── graph.py              # Ensamblaje y compilación del StateGraph
└── scripts/
    ├── run_hitl.py           # Entrypoint flujo uno-a-uno con revisión humana
    ├── run_mass.py           # Entrypoint flujo masivo (baja relevancia)
    └── reset_thread.py       # Utilidad de limpieza de checkpoints
```

---

## ⚙️ Requisitos previos

- Python 3.10+
- Cuenta Supabase (PostgreSQL)
- API Keys: Groq, Google Gemini, (opcional) X, LinkedIn, Discord Webhooks
- Git Bash / terminal

---

## 🚀 Instalación y configuración

```bash
# 1. Clonar / entrar al proyecto
cd ruta/a/mototradisbk

# 2. Crear y activar entorno virtual
python -m venv .venv
source .venv/Scripts/activate          # Git Bash (Windows)
# source .venv/bin/activate            # Linux / WSL / macOS

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar variables de entorno
cp .env.example .env
# Edita .env y completa las claves reales
```

### Variables críticas (obligatorias)

| Variable | Descripción |
|----------|-------------|
| `SUPABASE_DB_URL` | Cadena de conexión PostgreSQL de Supabase |
| `GROQ_API_KEY` | Clave de Groq |
| `GEMINI_API_KEY` | Clave de Google AI Studio / Gemini |

### Variables opcionales (redes sociales)

`LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_AUTHOR_URN`,  
`DISCORD_WEBHOOK_GENERAL`, `DISCORD_WEBHOOK_FAQ`, `DISCORD_WEBHOOK_NOTIFICACIONES`, `DISCORD_WEBHOOK_PQRS`,  
`X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET`

---

## 🧪 Cómo ejecutar las pruebas

### Preparación (solo una vez)

```bash
cd /c/ruta/a/tu/mototradisbk
source .venv/Scripts/activate
ls -la .env
```

### Prueba 1 – Flujo HITL (uno a uno)

```bash
# Opción normal (siguiente de la cola)
python -m scripts.run_hitl

# Forzar un ID concreto
export ID_MENSAJE_HITL=98
python -m scripts.run_hitl

# Decisión automática (sin preguntar en consola)
export HITL_DECISION=s          # o "n" para rechazar
python -m scripts.run_hitl
```

**Resultado esperado (ejemplo real):**
- Carga del lote y generación de borradores
- Publicación en Discord / X / LinkedIn según rutas
- Actualización de estado a `aprobado` en Supabase

### Prueba 2 – Flujo Masivo (baja relevancia < 35)

```bash
export LIMITE_LOTES_MASIVOS=3
python -m scripts.run_mass
```

### Prueba 3 – Validación rápida de configuración

```bash
python -c "from src.config import config; print('Config OK')"
```

### Demo visual opcional (Streamlit)

```bash
pip install streamlit
streamlit run app_demo.py
```

> La interfaz Streamlit es solo para demostración local. No forma parte del pipeline de producción.

---

## 🧠 Flujo de alto nivel

1. **Ingesta** de mensajes desde Supabase (`lotes_ia_kpis`).
2. **Orquestador** decide rutas según relevancia y sentimiento:
   - ≤ 10 → descarte (spam)
   - 11–34 → Gemma automático (Discord)
   - 35–69 → Discord HITL
   - ≥ 70 → multicanal (LinkedIn + X + Discord / reclamos)
3. **Generación de copys** por nodo de canal.
4. **Validador** de tono y Manual de Marca.
5. **HITL** (pausa antes de publicar) o publicación directa (Gemma).
6. **Publicador** envía a las APIs y registra en historial.

---

## 📦 Descripción de módulos principales

| Módulo | Responsabilidad |
|--------|-----------------|
| `config.py` | Carga y validación de variables de entorno |
| `schemas.py` | Modelos Pydantic + `AgentState` de LangGraph |
| `database.py` | CRUD de lotes y actualización de estados |
| `checkpoints.py` | Limpieza segura de hilos de LangGraph |
| `publishers.py` | Envío real a Discord, X y LinkedIn (con retry) |
| `gemma.py` | Cliente resiliente Gemma 4 + prompt estructurado |
| `nodes.py` | Lógica de cada nodo del grafo |
| `graph.py` | Fábrica del StateGraph + enrutamiento |
| `run_hitl.py` | Entrypoint con revisión humana |
| `run_mass.py` | Entrypoint procesamiento masivo autónomo |

---

## 🔒 Notas de seguridad

- Nunca subas el archivo `.env` real.
- El borrado global de checkpoints requiere `ALLOW_GLOBAL_CHECKPOINT_CLEAN=true`.
- Las claves de redes sociales son opcionales; el sistema avisa si faltan.

---

## 🛠️ Tecnologías

- **LangGraph** + LangChain
- **Supabase** (PostgreSQL + checkpointer)
- **Google GenAI** (Gemma 4 / Gemini)
- **Groq** (Qwen, GPT-OSS)
- **tweepy**, **requests**
- **Pydantic**, **python-dotenv**

---

## 📄 Documentación adicional

- `docs/contrato-pipeline.md` – Contrato de integración del pipeline
- `docs/constitution.md` – Principios del equipo / proyecto

---

**Estado:** MVP funcional para demostración local y pipeline de deploy.  
Probado con publicación real en Discord, X y LinkedIn.
