import uuid

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.usuario import RolUsuario
from app.schemas.validadores import validar_nombre, validar_nombre_opcional


class UsuarioCrear(BaseModel):
    nombre: str
    email: EmailStr
    password: str = Field(min_length=6)
    rol: RolUsuario

    @field_validator("nombre")
    @classmethod
    def _validar_nombre(cls, v: str) -> str:
        return validar_nombre(v)


class UsuarioActualizar(BaseModel):
    nombre: str | None = None
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=6)
    rol: RolUsuario | None = None

    @field_validator("nombre")
    @classmethod
    def _validar_nombre(cls, v: str | None) -> str | None:
        return validar_nombre_opcional(v)


class UsuarioSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nombre: str
    email: EmailStr
    rol: RolUsuario
    activo: bool
