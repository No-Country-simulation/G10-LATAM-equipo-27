from app.content_workflow.service import solicitar_motor


MOTOR_REPORTS_PREFIX = "/api/v1/oci-storage"


def consultar_periodo_motor() -> dict:
    return solicitar_motor(
        "GET",
        f"{MOTOR_REPORTS_PREFIX}/weekly-period",
    )


def consultar_reportes_motor() -> dict:
    return solicitar_motor(
        "GET",
        f"{MOTOR_REPORTS_PREFIX}/reports",
    )


def generar_reporte_motor(semana: str) -> dict:
    if not isinstance(semana, str) or not semana.strip():
        raise ValueError("La semana es obligatoria")

    return solicitar_motor(
        "POST",
        f"{MOTOR_REPORTS_PREFIX}/weekly-sync",
        {"semana": semana.strip()},
    )
