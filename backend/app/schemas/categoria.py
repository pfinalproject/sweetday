import uuid

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.validadores import validar_nombre


class CategoriaCrear(BaseModel):
    nombre: str

    @field_validator("nombre")
    @classmethod
    def _validar_nombre(cls, v: str) -> str:
        return validar_nombre(v)


class CategoriaSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nombre: str
    activo: bool
