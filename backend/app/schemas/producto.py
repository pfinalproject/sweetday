import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.categoria import CategoriaSalida
from app.schemas.proveedor import ProveedorSalida
from app.schemas.validadores import validar_nombre


class ProductoCrear(BaseModel):
    nombre: str
    codigo_barras: str | None = None
    precio: Decimal = Field(gt=0)
    costo: Decimal = Field(ge=0)
    stock: int = Field(ge=0, default=0)
    categoria_id: uuid.UUID
    proveedor_id: uuid.UUID
    imagen_url: str | None = None

    @field_validator("nombre")
    @classmethod
    def _validar_nombre(cls, v: str) -> str:
        return validar_nombre(v)


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
    tiene_foto: bool
    creado_en: datetime
    categoria: CategoriaSalida
    proveedor: ProveedorSalida


class ProductoReconocido(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    producto: ProductoSalida
    similitud_pct: float
