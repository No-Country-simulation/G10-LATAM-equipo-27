from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException
from fastapi.responses import FileResponse
from typing import Literal

from app.content_workflow.brand_images import generar_pieza_corporativa

from typing import Literal
from app.users.models import User
from urllib.parse import quote
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.content_workflow.schemas import (
    CrearContenidoRequest,
    RevisarContenidoRequest,
)
from app.content_workflow.service import solicitar_motor
from app.security.dependencies import require_role


router = APIRouter(
    prefix="/api/v1/content-workflow",
    tags=["Content Workflow"],
    dependencies=[Depends(require_role("admin", "community_manager"))],
)


class GenerarRespuestaQuejaRequest(BaseModel):
    interaccion_id: int = Field(gt=0)


class RegenerarContenidoRequest(BaseModel):
    texto: str = Field(min_length=1, max_length=10000)
    canal: str = Field(min_length=1, max_length=150)
    formato: str
    tono: str = "profesional"



class EvaluarAlineacionMarcaRequest(BaseModel):
    contenido: str
    plataforma: Literal["linkedin", "x", "discord"]
    origen: str = ""
    contenido_id: int | None = Field(default=None, gt=0)


@router.post("/brand-alignment")
def evaluar_alineacion_marca_contenido(
    solicitud: EvaluarAlineacionMarcaRequest,
):
    return solicitar_motor(
        "POST",
        "/api/content/brand-alignment",
        datos=solicitud.model_dump(),
    )


class ConfirmarAlineacionMarcaRequest(BaseModel):
    contenido_id: int = Field(gt=0)
    contenido: str = Field(min_length=1)
    plataforma: Literal["linkedin", "x", "discord"]
    evaluacion: dict


@router.post("/brand-alignment/commit")
def confirmar_alineacion_marca(solicitud: ConfirmarAlineacionMarcaRequest):
    return solicitar_motor(
        "POST", "/api/content/brand-alignment/commit", datos=solicitud.model_dump()
    )


@router.post("/regenerate")
def regenerar_contenido(solicitud: RegenerarContenidoRequest):
    from fastapi import HTTPException

    if solicitud.formato not in {"linkedin", "x", "discord"}:
        raise HTTPException(
            status_code=422,
            detail="Formato no disponible para regeneracion",
        )

    return solicitar_motor(
        "POST",
        "/api/content/generate",
        solicitud.model_dump(),
    )


@router.post("/drafts")
def guardar_borrador(solicitud: CrearContenidoRequest):
    return solicitar_motor(
        "POST",
        "/api/content/drafts",
        solicitud.model_dump(),
    )


class ActualizarImagenBorradorRequest(BaseModel):
    imagen_generada_url: str | None = None


@router.patch("/drafts/{contenido_id}/image")
def actualizar_imagen_borrador(
    contenido_id: int,
    solicitud: ActualizarImagenBorradorRequest,
):
    from fastapi import HTTPException

    if contenido_id <= 0:
        raise HTTPException(
            status_code=422,
            detail="El identificador debe ser positivo.",
        )

    return solicitar_motor(
        "PATCH",
        f"/api/content/{contenido_id}/image",
        solicitud.model_dump(),
    )


@router.post("/complaints/generate-response")
def generar_respuesta_queja(
    solicitud: GenerarRespuestaQuejaRequest,
):
    return solicitar_motor(
        "POST",
        "/api/community/complaints/generate-response",
        solicitud.model_dump(),
    )


@router.patch("/{contenido_id}/status")
def revisar_contenido(
    contenido_id: int,
    solicitud: RevisarContenidoRequest,
):
    if contenido_id <= 0:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=422,
            detail="El identificador debe ser positivo",
        )

    return solicitar_motor(
        "PATCH",
        f"/api/content/{contenido_id}/status",
        solicitud.model_dump(),
    )



class ActualizarCuraduriaRequest(BaseModel):
    status: str

    @classmethod
    def _estados_permitidos(cls):
        return {"pending", "curated", "discarded"}


@router.patch("/messages/{interaccion_id}/curation")
def actualizar_curaduria_mensaje(
    interaccion_id: int,
    solicitud: ActualizarCuraduriaRequest,
):
    from fastapi import HTTPException

    if interaccion_id <= 0:
        raise HTTPException(
            status_code=422,
            detail="El identificador debe ser positivo",
        )

    if solicitud.status not in ActualizarCuraduriaRequest._estados_permitidos():
        raise HTTPException(
            status_code=422,
            detail="Estado de curaduria no valido",
        )

    return solicitar_motor(
        "PATCH",
        f"/api/community/messages/{interaccion_id}/curation",
        solicitud.model_dump(),
    )


class ActualizarEtapaFlujoRequest(BaseModel):
    stage: str


@router.patch("/messages/{interaccion_id}/workflow")
def actualizar_etapa_mensaje(
    interaccion_id: int,
    solicitud: ActualizarEtapaFlujoRequest,
):
    from fastapi import HTTPException

    if interaccion_id <= 0:
        raise HTTPException(
            status_code=422,
            detail="El identificador debe ser positivo",
        )

    etapas_permitidas = {
        "en_analisis",
        "en_redaccion",
        "en_aprobacion",
    }

    if solicitud.stage not in etapas_permitidas:
        raise HTTPException(
            status_code=422,
            detail="Etapa de flujo no valida",
        )

    return solicitar_motor(
        "PATCH",
        f"/api/community/messages/{interaccion_id}/workflow",
        solicitud.model_dump(),
    )

class PublicarContenidoDiscordRequest(BaseModel):
    canal_id: str = Field(min_length=1, max_length=30)
    modo: str = "publicacion"
    mensaje_original_id: str | None = None



@router.get("/messages/{interaccion_id}/origin")
def consultar_origen_interaccion(
    interaccion_id: int,
    usuario: User = Depends(require_role("admin", "community_manager")),
):
    from fastapi import HTTPException

    if interaccion_id <= 0:
        raise HTTPException(
            status_code=422,
            detail="Identificador de interaccion invalido.",
        )

    return solicitar_motor(
        "GET",
        f"/api/community/messages/{interaccion_id}",
    )



@router.get("/discord/recovery-preview")
def consultar_mensajes_discord_para_recuperar(
    canal_id: str = "",
    buscar: str = "",
    dias: int | None = 7,
    solo_pendientes: bool = True,
    pagina: int = 1,
):
    """Vista previa protegida, sin guardar mensajes."""
    from fastapi import HTTPException

    if pagina < 1 or len(buscar) > 200:
        raise HTTPException(
            status_code=422,
            detail="Filtros de consulta invalidos.",
        )

    if dias is not None and dias not in (1, 7, 30):
        raise HTTPException(
            status_code=422,
            detail="Periodo de consulta invalido.",
        )

    parametros = [
        f"canal_id={canal_id}",
        f"buscar={quote(buscar, safe='')}",
        f"solo_pendientes={str(solo_pendientes).lower()}",
        f"pagina={pagina}",
    ]

    if dias is not None:
        parametros.append(f"dias={dias}")

    return solicitar_motor(
        "GET",
        "/api/community/discord/recovery-preview?"
        + "&".join(parametros),
    )


class MensajeDiscordSeleccionadoRequest(BaseModel):
    channel_id: str = Field(pattern=r"^\d{15,22}$")
    message_id: str = Field(pattern=r"^\d{15,22}$")


class RecuperarMensajesDiscordRequest(BaseModel):
    mensajes: list[MensajeDiscordSeleccionadoRequest] = Field(
        min_length=1,
        max_length=20,
    )


@router.post("/discord/recover-selected")
def recuperar_mensajes_discord(
    solicitud: RecuperarMensajesDiscordRequest,
):
    """Envia al Motor IA los mensajes historicos seleccionados."""
    return solicitar_motor(
        "POST",
        "/api/community/discord/recover-selected",
        solicitud.model_dump(),
    )

@router.get("/discord-channels")
def consultar_canales_discord():
    return solicitar_motor(
        "GET",
        "/api/content/discord-channels",
    )


@router.post("/{contenido_id}/publish")
def publicar_contenido_aprobado(
    contenido_id: int,
    solicitud: PublicarContenidoDiscordRequest,
):
    from fastapi import HTTPException

    if contenido_id <= 0:
        raise HTTPException(
            status_code=422,
            detail="Identificador de contenido invalido",
        )

    return solicitar_motor(
        "POST",
        f"/api/content/{contenido_id}/publish",
        solicitud.model_dump(),
    )


from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.audit.service import create_audit_log
from app.database.dependencies import get_db


class ConfirmacionManualRequest(BaseModel):
    url_publicacion: str = Field(min_length=1, max_length=2048)


@router.post("/{contenido_id}/confirm-manual-publication")
def confirmar_publicacion_manual_administrativa(
    contenido_id: int,
    solicitud: ConfirmacionManualRequest,
    usuario: User = Depends(require_role("admin", "community_manager")),
    db: Session = Depends(get_db),
):
    if contenido_id <= 0:
        raise HTTPException(
            status_code=422,
            detail="Identificador de contenido invalido",
        )

    resultado = solicitar_motor(
        "POST",
        f"/api/content/{contenido_id}/confirm-manual-publication",
        {
            "url_publicacion": solicitud.url_publicacion,
            "responsable": usuario.username,
        },
    )

    create_audit_log(
        db=db,
        action="manual_publication_confirmed",
        resource_type="content",
        user_id=usuario.id,
        resource_id=str(contenido_id),
        details=(
            f"Plataforma: {resultado.get('plataforma')}; "
            f"URL: {resultado.get('url_publicacion')}"
        ),
    )

    return resultado


# CLOUDedTECH_READ_ONLY_MOTOR_ROUTES
# Consultas autenticadas al Motor IA; no publican contenido.

@router.get("/dashboard")
def consultar_dashboard_motor():
    return solicitar_motor("GET", "/api/community/dashboard")


@router.get("/analytics")
def consultar_analytics_motor():
    return solicitar_motor("GET", "/api/community/analytics")


@router.get("/messages")
def consultar_mensajes_motor(limit: int | None = None):
    if limit is not None:
        if limit < 1 or limit > 500:
            raise HTTPException(
                status_code=422,
                detail="El parametro limit debe estar entre 1 y 500",
            )
        return solicitar_motor("GET", f"/api/community/messages?limit={limit}")

    return solicitar_motor("GET", "/api/community/messages")


@router.get("/complaints")
def consultar_quejas_motor():
    return solicitar_motor("GET", "/api/community/complaints")


@router.get("/content")
def consultar_contenidos_motor():
    return solicitar_motor("GET", "/api/content")


class CorporateImageRequest(BaseModel):
    plataforma: Literal["linkedin", "x", "discord"]
    titulo: str = Field(min_length=1, max_length=65)
    mensaje: str = Field(min_length=1, max_length=2000)


def _corporate_image_dir() -> Path:
    import os

    configured = os.getenv("CLOUDEDTECH_IMAGE_DIR", "").strip()

    if configured:
        directory = Path(configured).expanduser()

        if not directory.is_absolute():
            raise RuntimeError(
                "CLOUDEDTECH_IMAGE_DIR must be an absolute path"
            )

        return directory

    return (
        Path(__file__).resolve().parents[2]
        / "generated_content_images"
    )


@router.post("/corporate-images")
def create_corporate_image(solicitud: CorporateImageRequest):
    _corporate_image_dir().mkdir(
        parents=True,
        exist_ok=True,
    )

    image_id = uuid4().hex
    destination = _corporate_image_dir() / f"{image_id}.png"

    generar_pieza_corporativa(
        plataforma=solicitud.plataforma,
        titulo=solicitud.titulo,
        mensaje=solicitud.mensaje,
        destino=destination,
    )

    return {
        "image_id": image_id,
        "image_url": (
            f"/api/v1/content-workflow/corporate-images/{image_id}"
        ),
        "platform": solicitud.plataforma,
        "generator": "corporate_template",
    }


@router.get("/corporate-images/{image_id}")
def get_corporate_image(image_id: str):
    if (
        len(image_id) != 32
        or any(character not in "0123456789abcdef" for character in image_id)
    ):
        raise HTTPException(status_code=404, detail="Image not found")

    image_path = _corporate_image_dir() / f"{image_id}.png"

    if not image_path.is_file():
        raise HTTPException(status_code=404, detail="Image not found")

    return FileResponse(
        image_path,
        media_type="image/png",
        filename="cloudedtech-corporate.png",
    )


