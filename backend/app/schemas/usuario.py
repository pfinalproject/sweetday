import uuid

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.usuario import RolUsuario


class UsuarioCrear(BaseModel):
    nombre: str
    email: EmailStr
    password: str
    rol: RolUsuario


class UsuarioSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nombre: str
    email: EmailStr
    rol: RolUsuario
    activo: bool
