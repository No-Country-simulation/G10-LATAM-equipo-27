from sqlalchemy.orm import Session

from app.users.roles import Role


INITIAL_ROLES = [
    {
        "name": "admin",
        "description": "Administración de CommunityLab"
    },
    {
        "name": "analyst",
        "description": "Consulta y análisis de la comunidad"
    },
    {
        "name": "reviewer",
        "description": "Revisión y aprobación de contenido"
    }
]


def seed_roles(db: Session):
    for role_data in INITIAL_ROLES:
        existing_role = (
            db.query(Role)
            .filter(Role.name == role_data["name"])
            .first()
        )

        if not existing_role:
            db.add(Role(**role_data))

    db.commit()