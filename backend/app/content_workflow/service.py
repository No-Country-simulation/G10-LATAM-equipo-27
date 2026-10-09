from dotenv import load_dotenv
from pathlib import Path
import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import HTTPException



load_dotenv(Path(__file__).resolve().parents[2] / '.env')

MOTOR_API_URL = os.getenv(
    "MOTOR_API_URL",
    "http://127.0.0.1:8001",
).rstrip("/")


def solicitar_motor(
    metodo: str,
    ruta: str,
    datos: dict | None = None,
) -> dict:
    if metodo not in {"GET", "POST", "PATCH"}:
        raise ValueError("Metodo HTTP no permitido")

    if not ruta.startswith("/") or ruta.startswith("//"):
        raise ValueError("Ruta interna no valida")

    token_interno = os.getenv("MOTOR_INTERNAL_TOKEN")

    if metodo != "GET" and not token_interno:
        raise HTTPException(
            status_code=503,
            detail="Credencial interna del Motor IA no configurada",
        )

    cuerpo = (
        json.dumps(datos).encode("utf-8")
        if datos is not None
        else None
    )

    encabezados = {
        "Accept": "application/json",
    }

    if cuerpo is not None:
        encabezados["Content-Type"] = "application/json"

    if token_interno:
        encabezados["X-Internal-Token"] = token_interno

    solicitud = Request(
        url=f"{MOTOR_API_URL}{ruta}",
        data=cuerpo,
        headers=encabezados,
        method=metodo,
    )

    try:
        with urlopen(solicitud, timeout=15) as respuesta:
            resultado = json.loads(
                respuesta.read().decode("utf-8")
            )

            if not isinstance(resultado, dict):
                raise HTTPException(
                    status_code=502,
                    detail="Respuesta inesperada del Motor IA",
                )

            return resultado

    except HTTPError as error:
        if error.code in {401, 403}:
            raise HTTPException(
                status_code=502,
                detail="Autenticacion interna del Motor IA rechazada",
            ) from error

        if error.code in {404, 409, 422}:
            raise HTTPException(
                status_code=error.code,
                detail=(
                    "El contenido no existe"
                    if error.code == 404
                    else "Transicion de estado no permitida"
                    if error.code == 409
                    else "Datos de revision invalidos"
                ),
            ) from error

        raise HTTPException(
            status_code=502,
            detail=f"Motor IA respondio HTTP {error.code}",
        ) from error

    except (URLError, TimeoutError) as error:
        raise HTTPException(
            status_code=503,
            detail="No se pudo conectar con el Motor IA",
        ) from error

    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        raise HTTPException(
            status_code=502,
            detail="Respuesta invalida del Motor IA",
        ) from error
