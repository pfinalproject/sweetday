import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CompraCrear(BaseModel):
    producto_id: uuid.UUID
    cantidad: int = Field(gt=0)
    costo_unitario: Decimal = Field(ge=0)


class CompraSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    producto_id: uuid.UUID
    proveedor_id: uuid.UUID
    usuario_id: uuid.UUID
    cantidad: int
    costo_unitario: Decimal
    total: Decimal
    creado_en: datetime


class CompraHistorial(BaseModel):
    id: uuid.UUID
    nombre_producto: str
    nombre_proveedor: str
    nombre_usuario: str
    cantidad: int
    costo_unitario: Decimal
    total: Decimal
    creado_en: datetime
    anulada: bool
    anulada_en: datetime | None
