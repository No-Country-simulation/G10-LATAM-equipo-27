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
    dependencies=[Depends(require_role("community_manager"))],
)


class GenerarRespuestaQuejaRequest(BaseModel):
    interaccion_id: int = Field(gt=0)


class RegenerarContenidoRequest(BaseModel):
    texto: str = Field(min_length=1, max_length=10000)
    canal: str = Field(min_length=1, max_length=150)
    formato: str
    tono: str = "profesional"


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
    usuario: User = Depends(require_role("community_manager")),
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
from app.users.models import User


class ConfirmacionManualRequest(BaseModel):
    url_publicacion: str = Field(min_length=1, max_length=2048)


@router.post("/{contenido_id}/confirm-manual-publication")
def confirmar_publicacion_manual_administrativa(
    contenido_id: int,
    solicitud: ConfirmacionManualRequest,
    usuario: User = Depends(require_role("community_manager")),
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
