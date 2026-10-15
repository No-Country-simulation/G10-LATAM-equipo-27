from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.security.auth_service import authenticate_user
from pydantic import BaseModel, Field
from app.security.dependencies import get_current_user, require_role
from app.users.models import User

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Autenticación"]
)


class LoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=128)



@router.post("/login")
def login(
    credentials: LoginRequest,
    db: Session = Depends(get_db)
):
    return authenticate_user(
        db=db,
        username=credentials.username,
        password=credentials.password
    )

@router.post("/login-swagger")
def login_swagger(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    return authenticate_user(
        db=db,
        username=form_data.username,
        password=form_data.password
    )



@router.get("/me")
def read_current_user(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "is_active": current_user.is_active,
        "role": current_user.role.name if current_user.role else None
    }

@router.get("/admin-test")
def admin_test(
    current_user: User = Depends(require_role("admin"))
):
    return {
        "message": "Acceso de administrador autorizado",
        "username": current_user.username,
        "role": current_user.role.name
    }