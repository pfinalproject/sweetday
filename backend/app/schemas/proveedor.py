import uuid

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.validadores import validar_nombre, validar_nombre_opcional, validar_telefono


class ProveedorCrear(BaseModel):
    nombre: str
    contacto: str | None = None
    telefono: str | None = None

    @field_validator("nombre")
    @classmethod
    def _validar_nombre(cls, v: str) -> str:
        return validar_nombre(v)

    @field_validator("contacto")
    @classmethod
    def _validar_contacto(cls, v: str | None) -> str | None:
        return validar_nombre_opcional(v)

    @field_validator("telefono")
    @classmethod
    def _validar_telefono(cls, v: str | None) -> str | None:
        return validar_telefono(v)


class ProveedorSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nombre: str
    contacto: str | None
    telefono: str | None
    activo: bool
