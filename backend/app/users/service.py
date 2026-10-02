from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.users.models import User
from app.users.schemas import UserCreate
from app.security.passwords import hash_password

from app.users.roles import Role


def create_user(db: Session, user_data: UserCreate):
    # Verificar si el nombre de usuario ya existe
    existing_user = (
        db.query(User)
        .filter(User.username == user_data.username)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El nombre de usuario ya está registrado"
        )

    # Solo permitimos estos roles al crear usuarios
    allowed_roles = ["analyst", "reviewer"]

    if user_data.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El rol indicado no está permitido"
        )

    # Buscar el rol en la base de datos
    role = (
        db.query(Role)
        .filter(Role.name == user_data.role)
        .first()
    )

    if role is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El rol indicado no existe"
        )

    # Crear el usuario con contraseña protegida y rol
    new_user = User(
        username=user_data.username,
        password_hash=hash_password(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role_id=role.id
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return new_user

    except Exception:
        db.rollback()
        raise

def update_user_role(
    db: Session,
    user_id: int,
    role_name: str
) -> User:

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    role = (
        db.query(Role)
        .filter(Role.name == role_name)
        .first()
    )

    if role is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El rol indicado no existe"
        )

    user.role_id = role.id

    db.commit()
    db.refresh(user)

    return user

def update_user_status(
    db: Session,
    user_id: int,
    is_active: bool
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    user.is_active = is_active

    db.commit()
    db.refresh(user)

    return user

def update_user_name(
    db: Session,
    user_id: int,
    first_name: str,
    last_name: str
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    user.first_name = first_name
    user.last_name = last_name

    db.commit()
    db.refresh(user)

    return user

def reset_user_password(
    db: Session,
    user_id: int,
    new_password: str
) -> User:
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    user.password_hash = hash_password(new_password)

    try:
        db.commit()
        db.refresh(user)
        return user

    except Exception:
        db.rollback()
        raise

def delete_user(
    db: Session,
    user_id: int
) -> User:
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    db.delete(user)
    db.commit()

    return user