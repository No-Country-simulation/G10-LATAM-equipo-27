# Discord Extractor

Servicio de ingesta: expone una API REST (FastAPI) que lee mensajes de canales
de Discord mediante un bot propio, los transforma al formato de interacciones
de CommunityLab y guarda el paquete resultante como un objeto JSON en **OCI
Object Storage** (capa Always Free).

```
Discord (bot) --> DiscordClient (REST v10) --> transform --> PaqueteInteracciones --> OCI Object Storage
```

## Endpoints

| Método | Ruta        | Auth        | Descripción                                             |
|--------|-------------|-------------|----------------------------------------------------------|
| GET    | `/health`   | ninguna     | Chequeo de vida.                                          |
| GET    | `/channels` | `X-API-Key` | Lista los canales de texto del servidor configurado.      |
| POST   | `/extract`  | `X-API-Key` | Extrae mensajes de uno o más canales y arma el paquete.   |

### `POST /extract`

```json
{
  "channel_ids": ["10", "11"],
  "desde": "2026-09-15T00:00:00Z",
  "hasta": null,
  "max_mensajes_por_canal": 500,
  "periodo_referencia": "Semana_38",
  "subir_a_oci": true
}
```

Con `subir_a_oci: true`, la respuesta incluye `almacenamiento_oci` (bucket y
ruta del objeto) y no repite el paquete completo. Con `subir_a_oci: false`,
no se sube nada y la respuesta trae el `paquete` completo — útil para
depurar el mapeo de mensajes sin tocar OCI.

El objeto se guarda en `discord/{periodo_referencia}/{guild_id}-{timestamp}.json`,
con esta forma:

```json
{
  "origen_comunidad": "Discord_Grupo_ONE_G10",
  "periodo_referencia": "Semana_38",
  "extraido_en": "2026-09-23T10:00:00Z",
  "interacciones": [
    {
      "id": "123456789",
      "autor": "Mariana Souza",
      "canal": "#logros-y-empleos",
      "tipo": "sin_clasificar",
      "texto": "Quede seleccionada para el puesto de Desarrolladora Junior de IA!",
      "fecha": "2026-09-20T10:00:00Z",
      "respuesta_a": null,
      "reacciones": 5,
      "adjuntos": []
    }
  ]
}
```

`tipo` queda siempre en `"sin_clasificar"`: la clasificación (testimonio,
pregunta técnica, etc.) la hace la etapa de IA del pipeline, no este
servicio. Se descartan los mensajes de bots y los que no tienen texto; los
hilos (threads) no se leen en esta versión.

## Configuración

Copiar `.env.example` a `.env` y completar:

- `API_KEY`: clave que deben enviar los clientes en el header `X-API-Key`.
- `DISCORD_BOT_TOKEN` / `DISCORD_GUILD_ID`: ver el Developer Portal de
  Discord (requiere el intent **Message Content** activado, y el bot
  invitado con permisos *View Channel* + *Read Message History*).
- `OCI_AUTH`: `config` para correr en local (usa `~/.oci/config`) o
  `instance_principal` para correr dentro de una VM de OCI (sin llaves).
- `OCI_NAMESPACE` / `OCI_BUCKET_NAME`: namespace de la cuenta y bucket
  destino (ver [`deploy/oci/README.md`](../../deploy/oci/README.md)).

## Correr en local

```bash
python -m venv .venv
./.venv/Scripts/activate       # Windows
pip install -r requirements-dev.txt
cp .env.example .env           # y completar los valores
uvicorn app.main:app --reload
```

## Tests

```bash
pip install -r requirements-dev.txt
pytest -q
```

Los tests mockean tanto la API de Discord (`respx`) como el SDK de OCI
(`unittest.mock`); no requieren credenciales reales ni acceso a internet.

## Docker

```bash
docker build -t discord-extractor .
docker run --env-file .env -p 8000:8000 discord-extractor
```

Para el despliegue en una VM Always Free de OCI, ver
[`deploy/oci/README.md`](../../deploy/oci/README.md).
