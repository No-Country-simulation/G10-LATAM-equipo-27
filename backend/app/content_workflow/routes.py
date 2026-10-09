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
