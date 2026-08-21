import uuid

from pydantic import BaseModel, ConfigDict


class CategoriaCrear(BaseModel):
    nombre: str


class CategoriaSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nombre: str
    activo: bool
