import uuid
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.schemas.categoria import CategoriaSalida
from app.schemas.proveedor import ProveedorSalida


class ProductoCrear(BaseModel):
    nombre: str
    codigo_barras: str | None = None
    precio: Decimal
    costo: Decimal
    stock: int = 0
    categoria_id: uuid.UUID
    proveedor_id: uuid.UUID
    imagen_url: str | None = None


class ProductoSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nombre: str
    codigo_barras: str | None
    precio: Decimal
    costo: Decimal
    stock: int
    activo: bool
    imagen_url: str | None
    categoria: CategoriaSalida
    proveedor: ProveedorSalida
