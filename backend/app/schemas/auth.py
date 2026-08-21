from pydantic import BaseModel

from app.models.usuario import RolUsuario


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UsuarioActual(BaseModel):
    id: str
    nombre: str
    email: str
    rol: RolUsuario
