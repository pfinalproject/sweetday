import uuid

from pydantic import BaseModel, ConfigDict


class ProveedorCrear(BaseModel):
    nombre: str
    contacto: str | None = None
    telefono: str | None = None


class ProveedorSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nombre: str
    contacto: str | None
    telefono: str | None
    activo: bool
