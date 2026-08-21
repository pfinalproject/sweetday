from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_usuario_actual
from app.core.security import create_access_token, verify_password
from app.db.session import get_db
from app.models.usuario import Usuario
from app.schemas.auth import Token, UsuarioActual

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == form_data.username).first()
    if usuario is None or not verify_password(form_data.password, usuario.hash_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email o contrasena incorrectos")
    if not usuario.activo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuario inactivo")

    token = create_access_token(subject=str(usuario.id), rol=usuario.rol.value)
    return Token(access_token=token)


@router.get("/me", response_model=UsuarioActual)
def me(usuario: Usuario = Depends(get_usuario_actual)):
    return UsuarioActual(id=str(usuario.id), nombre=usuario.nombre, email=usuario.email, rol=usuario.rol)
