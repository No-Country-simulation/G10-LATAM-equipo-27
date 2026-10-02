from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.audit.service import create_audit_log


from app.users.models import User
from app.security.dependencies import require_role
from app.users.service import (
    create_user,
    update_user_role,
    update_user_status,
    update_user_name,
    reset_user_password,
    delete_user,
)

from app.users.schemas import (
    UserCreate,
    UserRoleUpdate,
    UserStatusUpdate,
    UserNameUpdate,
    UserPasswordReset,
)


router = APIRouter(
    prefix="/api/v1/users",
    tags=["Usuarios"]
)


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED
)
def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    user = create_user(db, user_data)
    create_audit_log(
    db=db,
    user_id=current_user.id,
    action="USER_CREATED",
    resource_type="user",
    resource_id=str(user.id),
    details=f"Usuario {user.username} creado con rol {user.role.name if user.role else 'sin rol'}"
)

    return {
        "message": "Usuario registrado correctamente",
        "user": {
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_active": user.is_active,
            "role": user.role.name if user.role else None
        }
    }

@router.get("/")
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    users = db.query(User).order_by(User.id.asc()).all()

    return [
        {
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_active": user.is_active,
            "role": user.role.name if user.role else None
        }
        for user in users
    ]

@router.patch("/{user_id}/role")
def change_user_role(
    user_id: int,
    data: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    if current_user.id == user_id:
        raise HTTPException(
            status_code=400,
            detail="No puedes modificar tu propio rol"
        )

    user = update_user_role(
        db=db,
        user_id=user_id,
        role_name=data.role
    )

    create_audit_log(
    db=db,
    user_id=current_user.id,
    action="USER_ROLE_CHANGED",
    resource_type="user",
    resource_id=str(user.id),
    details=f"Rol del usuario {user.username} actualizado a {user.role.name}"
)

    return {
    "message": "Rol actualizado correctamente",
    "user": {
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_active": user.is_active,
        "role": user.role.name if user.role else None
    }
}

@router.patch("/{user_id}/status")
def change_user_status(
    user_id: int,
    data: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    if current_user.id == user_id:
        raise HTTPException(
            status_code=400,
            detail="No puedes modificar el estado de tu propia cuenta"
        )

    user = update_user_status(
        db=db,
        user_id=user_id,
        is_active=data.is_active
    )

    create_audit_log(
    db=db,
    user_id=current_user.id,
    action="USER_ENABLED" if user.is_active else "USER_DISABLED",
    resource_type="user",
    resource_id=str(user.id),
    details=(
        f"Usuario {user.username} "
        f"{'activado' if user.is_active else 'desactivado'}"
    )
)

    return {
        "message": "Estado del usuario actualizado correctamente",
        "user": {
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_active": user.is_active,
            "role": user.role.name if user.role else None
        }
    }
@router.patch("/{user_id}/name")
def change_user_name(
    user_id: int,
    data: UserNameUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    user = update_user_name(
        db=db,
        user_id=user_id,
        first_name=data.first_name,
        last_name=data.last_name
    )

    create_audit_log(
    db=db,
    user_id=current_user.id,
    action="USER_NAME_UPDATED",
    resource_type="user",
    resource_id=str(user.id),
    details=f"Nombre actualizado para el usuario {user.username}"
)

    return {
        "message": "Nombre del usuario actualizado correctamente",
        "user": {
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_active": user.is_active,
            "role": user.role.name if user.role else None
        }
    }

@router.patch("/{user_id}/password")
def reset_password(
    user_id: int,
    data: UserPasswordReset,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    user = reset_user_password(
        db=db,
        user_id=user_id,
        new_password=data.new_password
    )

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="USER_PASSWORD_RESET",
        resource_type="user",
        resource_id=str(user.id),
        details=f"Contraseña restablecida para el usuario {user.username}"
    )

    return {
        "message": "Contraseña del usuario restablecida correctamente"
    }

@router.delete("/{user_id}")
def remove_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propia cuenta"
        )

    user = delete_user(
        db=db,
        user_id=user_id
    )

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="USER_DELETED",
        resource_type="user",
        resource_id=str(user.id),
        details=f"Usuario {user.username} eliminado"
    )

    return {
        "message": "Usuario eliminado correctamente"
    }