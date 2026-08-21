from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.usuario import RolUsuario, Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_usuario_actual(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    credenciales_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales invalidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        usuario_id = payload.get("sub")
        if usuario_id is None:
            raise credenciales_invalidas
    except JWTError:
        raise credenciales_invalidas

    usuario = db.get(Usuario, usuario_id)
    if usuario is None or not usuario.activo:
        raise credenciales_invalidas
    return usuario


def requiere_rol(*roles_permitidos: RolUsuario):
    """Guard de dependencia: solo deja pasar a los roles indicados.

    Uso: Depends(requiere_rol(RolUsuario.DUENA)) protege endpoints
    reservados a la Duena (ej. apertura/cierre de caja, reportes).
    """

    def dependencia(usuario: Usuario = Depends(get_usuario_actual)) -> Usuario:
        if usuario.rol not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para realizar esta accion",
            )
        return usuario

    return dependencia
